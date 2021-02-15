// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import sqlite from 'sqlite';

export default async function getPersonById(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = await sqlite.open('./mydb.sqlite');

  if (req.method === 'PUT') {
    const statement = await db.prepare(
      'UPDATE usersession SET name= ?, focus = ? where id = ?'
    );
    const result = await statement.run(
      req.body.name,
      req.body.focus,
      req.query.id
    );
    result.finalize();
  }

  const usersession = await db.get('select * from usersession where id = ?', [
    req.query.id
  ]);
  res.json(usersession);
}
