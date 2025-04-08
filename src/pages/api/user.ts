import { NextApiRequest, NextApiResponse } from 'next';
import os from 'os';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = os.userInfo().username; // Get the current computer username
  res.status(200).json({ username });
}