import { NextApiRequest, NextApiResponse } from 'next';
import sqlite from 'sqlite';
// import { authenticated } from './people';
import { authenticated } from '../../defs/authenticated'

export default authenticated(async function getAllUsersessions(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
  const db = await sqlite.open('./mydb.sqlite');
  const usersession = await db.all('select * from usersession');
  // console.log('13 usersession ', usersession);
  res.json(usersession);
});
