import { promises as fs } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    responseLimit: false,
  },
};

const sharesDir = path.join(process.cwd(), 'data', 'shares');

const isValidShareId = (value: string) => /^[a-f0-9]{16}$/i.test(value);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const shareId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!shareId || !isValidShareId(shareId)) {
    return res.status(400).json({ error: 'Invalid share id.' });
  }

  try {
    const filePath = path.join(sharesDir, `${shareId}.json`);
    const raw = await fs.readFile(filePath, 'utf8');
    const payload = JSON.parse(raw);
    return res.status(200).json(payload);
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return res.status(404).json({ error: 'Share not found.' });
    }
    console.error('Error reading share snapshot:', error);
    return res.status(500).json({ error: 'Unable to read share snapshot.' });
  }
}
