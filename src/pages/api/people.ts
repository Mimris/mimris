import { authenticated } from '../../defs/authenticated'
import { NextApiRequest, NextApiResponse } from 'next';
import sqlite from 'sqlite';

export default authenticated(async function getPeople(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = await sqlite.open('./mydb.sqlite');
  const people = await db.all('select id, email, name, session from person');
  console.log('11',
    JSON.stringify({people})
  );

  // res.json(people);
  res.json({people});
});
