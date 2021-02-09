import { compare } from 'bcryptjs';
import cookie from 'cookie';
import { sign } from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
//import sqlite from 'sqlite';
import { secret } from '../../defs/secret';

export default async function login(req: NextApiRequest, res: NextApiResponse) {
    return;
    const db = await sqlite.open('./mydb.sqlite');

  if (req.method === 'POST') {
    const person = await db.get('select * from person where email = ?', [
      req.body.email
    ]);
    if (person) {
      compare(req.body.password, person.password, function(err, result) {
        // console.log('17', err, result);
        
        if (!err && result) {
          const claims = { sub: person.id, myPersonEmail: person.email };
          const jwt = sign(claims, secret, { expiresIn: '8h' });
          res.setHeader('Set-Cookie', cookie.serialize('auth', jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 3600*8,
            path: '/'
          }))
          let message = { message: { mess: 'Welcome back to AKM Modeller!', person: { id: person.id, name: person.name, email: person.email, session: person.session } } }
          console.log('30 login', JSON.stringify(message));
          
          res.json(message.message);
          // res.json({ message: 'Welcome back to the app!' } );
        } else {
          res.json({ message: 'Ups, something went wrong!' });
        }
      });
    } else { res.json({ message: 'Not signed in'})}
  } else {
    res.status(405).json({ message: 'We only support POST' });
  }
}
