// import { NextApiRequest, NextApiResponse } from 'next';
// import sqlite from 'sqlite';

// export default async function getUsersessionById(req: NextApiRequest, res: NextApiResponse) {
//   const db = await sqlite.open('./mydb.sqlite');
//   const usersession = await db.get('select * from usersession where id = ?', [req.query.id]);
//   res.json(usersession);
// } 