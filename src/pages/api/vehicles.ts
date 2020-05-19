// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import sqlite from 'sqlite';
import { authenticated } from '../../defs/authenticated'

export default authenticated(async function getAllVehicles(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
  const db = await sqlite.open('./mydb.sqlite');
  const vehicle = await db.all('select * from vehicle');
  // console.log('13 vehicles ', vehicle);
  res.json(vehicle);
});
 
