const sqlite3 = require('sqlite3');

async function setup() {
  const db = new sqlite3.Database('./mydb.sqlite',
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            console.log('7 database-test', db);
          });
    // const db = await sqlite.open('./mydb.sqlite');
    // await db.migrate({ force: 'last' });
  
  const people = await db.all('SELECT * FROM person');
  console.log('ALL PEOPLE', JSON.stringify(people, null, 2));

  const vehicles = await db.all('SELECT * FROM vehicle');
  console.log('ALL VEHICLES', JSON.stringify(vehicles, null, 2));

  const usersessions = await db.all('SELECT * FROM usersession');
  console.log('ALL USERSESSIONS', JSON.stringify(usersessions, null, 2));
}

setup();
