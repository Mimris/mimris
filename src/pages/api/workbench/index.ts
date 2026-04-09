import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const workbenchDir = path.join(process.cwd(), 'data', 'workbench');

const ensureWorkbenchDir = async () => {
  await fs.mkdir(workbenchDir, { recursive: true });
};

const createProjectId = () => randomBytes(6).toString('hex');

const safeStringify = (value: unknown) => {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (_key, entry) => {
      if (typeof entry === 'object' && entry !== null) {
        if (seen.has(entry)) return undefined;
        seen.add(entry);
      }
      return entry;
    },
    2,
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const snapshot = req.body?.snapshot;
  if (!snapshot || typeof snapshot !== 'object') {
    return res.status(400).json({ error: 'Missing workspace snapshot payload.' });
  }

  try {
    await ensureWorkbenchDir();
    const id = createProjectId();
    const filePath = path.join(workbenchDir, `${id}.json`);
    const payload = {
      ...snapshot,
      projectId: id,
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(filePath, safeStringify(payload), 'utf8');
    return res.status(201).json({ id });
  } catch (error) {
    console.error('Error creating workbench project:', error);
    return res.status(500).json({ error: 'Unable to create workbench project.' });
  }
}
