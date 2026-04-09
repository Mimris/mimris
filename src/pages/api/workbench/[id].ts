import { promises as fs } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
};

const workbenchDir = path.join(process.cwd(), 'data', 'workbench');

const readProjectId = (value: string | string[] | undefined) => {
  const resolved = Array.isArray(value) ? value[0] : value;
  return typeof resolved === 'string' ? resolved : '';
};

const getProjectPath = (id: string) => path.join(workbenchDir, `${id}.json`);

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
  const id = readProjectId(req.query.id);
  if (!id) {
    return res.status(400).json({ error: 'Missing project id.' });
  }

  const filePath = getProjectPath(id);

  if (req.method === 'GET') {
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const snapshot = JSON.parse(raw);
      return res.status(200).json({ id, snapshot });
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return res.status(404).json({ error: 'Project not found.' });
      }
      console.error('Error reading workbench project:', error);
      return res.status(500).json({ error: 'Unable to load workbench project.' });
    }
  }

  if (req.method === 'PUT') {
    const snapshot = req.body?.snapshot;
    if (!snapshot || typeof snapshot !== 'object') {
      return res.status(400).json({ error: 'Missing workspace snapshot payload.' });
    }

    try {
      await fs.mkdir(workbenchDir, { recursive: true });
      const payload = {
        ...snapshot,
        projectId: id,
        updatedAt: new Date().toISOString(),
      };
      await fs.writeFile(filePath, safeStringify(payload), 'utf8');
      return res.status(200).json({ id });
    } catch (error) {
      console.error('Error saving workbench project:', error);
      return res.status(500).json({ error: 'Unable to save workbench project.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed.' });
}
