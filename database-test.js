// const sqlite = require('sqlite3');

// async function setup() {

//   let db = await new sqlite.Database('./mydb.sqlite', sqlite.OPEN_READWRITE, (err) => {
//     if (err) {
//       console.error(err.message);
//     }
//     console.log('Connected to the user db');
//   }
//   );
//   // await db.migrate({ force: 'last' });

//   const people = await db.all('SELECT * FROM person');
//   console.log('ALL PEOPLE', JSON.stringify(people, null, 2));

//   const vehicles = await db.all('SELECT * FROM vehicle');
//   console.log('ALL VEHICLES', JSON.stringify(vehicles, null, 2));

//   const usersessions = await db.all('SELECT * FROM usersession');
//   console.log('ALL USERSESSIONS', JSON.stringify(usersessions, null, 2));
// }

// setup();
