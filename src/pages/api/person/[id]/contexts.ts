import fetch from 'isomorphic-unfetch';
import { NextApiRequest, NextApiResponse } from 'next';
import cheerio from 'cheerio'

export default async function getAllContextsByPersonId(req: NextApiRequest, res: NextApiResponse) {
  // getting phFocus from the store via index html file
  const propsStore = await fetch('http://localhost:4050/index')
    .then(res => res.text())
    .then(data => 
    cheerio.load(data)("script")?.get()[1].children[0].data
  )
  
  const allContexts =  JSON.parse(propsStore).props.initialState
  console.log('14 context', JSON.parse(propsStore).props);
  res.json(allContexts)
} 















// import { NextApiRequest, NextApiResponse } from 'next';
// import sqlite from 'sqlite';

// export default async function getAllContextsByPersonId(req: NextApiRequest, res: NextApiResponse) {
//   console.log('6', req.query.id);
//   const db = await sqlite.open('./mydb.sqlite');
  
//   const allContexts = await db.all('select * from vehicle where ownerId = ?', [req.query.id]);
//   res.json(allContexts);
// } 