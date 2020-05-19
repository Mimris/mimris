
import fetch from 'isomorphic-unfetch';
import { NextPageContext } from "next";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { myGet } from "../defs/myGet";
import { VehiclePerson } from '../defs/VehiclePerson';
import MyComp from './bruno';

export interface ListProps {
  ownersList?: VehiclePerson[];
}

export default function List({ ownersList }: ListProps, ctx: NextPageContext) {
  // console.log('12 List', ownersList);

  const [owners, setOwners] = useState(ownersList)

  useEffect(() => {
    async function loadData() {
      const response = await myGet('http://localhost:4050/api/vehicles', ctx);
      // console.log('19', response);
      const ows: VehiclePerson[] | undefined = await response;
      // console.log('21', ows);
      setOwners(ows)
    }
    // if (ownersList?.length == 0) {
    if (ownersList) {
      loadData();
    }
  }, [ownersList?.length == 0]);
  console.log('32', owners);
  
  
  return (
    <div>
      {ownersList?.map((e, index) => (
        <div key={index}>
          <Link as={`/${e.vehicle}/${e.ownerName}`} href="/[vehicle]/[person]">
            <a>
              Navigate to {e.ownerName}'s {e.vehicle}
            </a>
            <MyComp />
          </Link>
        </div>
      ))}
    </div>
  );
}

List.getInitialProps = async () => {
  let ownersList: VehiclePerson[] | undefined = []
  try { 
    const response = await fetch('http://localhost:4050/vehicles');
    console.log('32 List', response.json);
    ownersList = await response.json();
    console.log('33 List', ownersList);
    return { ownersList: ownersList }
  } catch (error) {
    console.log(error);
    return { ownersList: ownersList }
  }
    
}






















// import fetch from 'isomorphic-unfetch';
// import { NextPageContext } from "next";
// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { myGet } from "../defs/myGet";
// import { VehiclePerson } from '../defs/VehiclePerson';
// import MyComp from './bruno';

// export interface ListProps {
//   ownersList?: VehiclePerson[];
// }

// export default function List({ ownersList }: ListProps, ctx: NextPageContext) {
//   console.log('11 List', ownersList );
//   const [owners, setOwners] = useState(ownersList)
  
//   useEffect(() => {
//     async function loadData() {
//       const response = await myGet('http://localhost:4050/api/vehicles', ctx);
//       console.log('19', response);
//       const ows: VehiclePerson[] | undefined = await response.json();
//       console.log('21', ows);
//       setOwners(ows)
//     }
//     // if (ownersList?.length == 0) {
//     if (ownersList) {
//       loadData();
//     }
//   }, []);

//   console.log('28 List', owners);
  
//   return (
//     <div>
//       {ownersList?.map((e, index) => (
//         <div key={index}>
//           <Link as={`/${e.vehicle}/${e.ownerName}`} href="/[vehicle]/[person]">
//             <a>
//               Navigate to {e.ownerName}'s {e.vehicle}
//             </a>
//             <MyComp />
//           </Link>
//         </div>
//       ))}
//     </div>
//   );
// }

// // List.getInitialProps = async () => {
// //   const response = await fetch('http://localhost:4050/vehicles');
// //   const ownersList: VehiclePerson[] | undefined = await response.json();
// //   return { ownersList: ownersList }
// // }

// List.getInitialProps = async (ctx: NextPageContext) => {
//   const response = await myGet('http://localhost:4050/api/vehicles', ctx);
//   console.log('49', response);
  
//   const ownersList: VehiclePerson[] | undefined = (response) 
//   console.log('51', ownersList);
  
//   return { ownersList: ownersList };
// }

// List.getInitialProps = async () => {

//     try {
//       const response = await fetch('http://localhost:4050/vehicles');
//       // const restmp:any = (response.json) ? //response.json : undefined
//       const ownersList: VehiclePerson[] | undefined = (response.json) 
//         ? await response?.json() 
//         : undefined

//       console.log('51 Lst', ownersList);
//       return { ownersList: ownersList }

//     } catch (error) {
//       console.log('59 fetch error', error);
//       return []
//     }
      
// }



































// import fetch from 'isomorphic-unfetch';
// import Link from 'next/link';
// import { VehiclePerson } from '../defs/VehiclePerson';
// // import { PeoplePerson } from '../defs/PeoplePerson';
// import MyComp from './bruno';

// export interface ListProps {
//   ownersList?: VehiclePerson[];
// }

// export default function List({ownersList}: ListProps) {
//   console.log('14', ownersList)
//   return (
//     <div>
//       <a>LIST </a>
//       {ownersList?.map((e, index) => (
//         <div key={index}>
//           <Link as={`/${e.brand}/${e.ownerName}`} href="/[vehicle]/[person]">
//             <a>
//               Navigate to {e.ownerName}'s {e.brand}
//             </a>
//             <MyComp/>
//           {/* </Link> */}
//         </div>
//       ))}
//     </div>
//   );
// }

// List.getInitialProps = async () => {
//   const response = await fetch('http://localhost:4050/api/vehicles');
//   const ownersList: VehiclePerson[] | undefined = await response.json();
  
//   console.log('33', ownersList);
//   const people = await fetch('http://localhost:4050/api/people');
//   const peopleList: PeoplePerson[] | undefined = await people.json();

//   console.log('35', peopleList);
  
//   const ownersListWithName: VehiclePerson[] | undefined = ownersList?.map(o => {
//     return {
//       id: o.id,
//       brand: o.brand,
//       model: o.model,
//       ownerId: o.ownerId,
//       ownerName: peopleList?.find(p => p.id === o.ownerId)?.name
//     }
//   })

//   return {ownersList: ownersListWithName}
// }