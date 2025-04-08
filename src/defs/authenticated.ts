import { verify } from 'jsonwebtoken';
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
// import sqlite from 'sqlite3';
import { secret } from './secret';

export const authenticated = (fn: NextApiHandler) => async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  verify(req.cookies.auth!, secret, async function (err, decoded) {
    if (!err && decoded) {
      return await fn(req, res);
    }
    // res.status(401).json({ message: 'Sorry you are not authenticated' });
    return await fn(req, res);  // not checking for outentication
  });
};