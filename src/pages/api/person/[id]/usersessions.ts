// import { NextApiRequest, NextApiResponse } from 'next';
// import sqlite from 'sqlite';

// export default async function getAllUsersessionsByPersonId(req: NextApiRequest, res: NextApiResponse) {
//   const db = await sqlite.open('./mydb.sqlite');
//   const allUsersessions = await db.all('select * from usersession where ownerId = ?', [req.query.id]);
//   res.json(allUsersessions);
// } 