// Input parameter:     Metamodel name


// import * as glb    from './akm_globals';

//const glb 	= require('./akm_globals');
const fs 	 = require('./firestore');


let fsDb = new fs.FirestoreStorage();
// console.log(glb);
if (fsDb) {
    fsDb.loadMetaStructureFromFirestore();
    //console.log(glb.metis.datatypes);
}
