import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const sharesDir = path.join(process.cwd(), 'data', 'shares');

const ensureSharesDir = async () => {
  await fs.mkdir(sharesDir, { recursive: true });
};

const createShareId = () => randomBytes(8).toString('hex');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const snapshot = req.body?.snapshot;
  if (!snapshot?.phData) {
    return res.status(400).json({ error: 'Missing snapshot payload.' });
  }

  try {
    await ensureSharesDir();
    const id = createShareId();
    const filePath = path.join(sharesDir, `${id}.json`);
    const payload = {
      id,
      createdAt: new Date().toISOString(),
      snapshot,
    };
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return res.status(201).json({ id });
  } catch (error) {
    console.error('Error creating share snapshot:', error);
    return res.status(500).json({ error: 'Unable to create share snapshot.' });
  }
}
