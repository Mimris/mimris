// // @ts-nocheck
// import { NextPageContext } from "next";
// import { useSelector } from 'react-redux';
// import { myGet } from "../defs/myGet";
// import Layout from '../components/Layout';
// import Link from 'next/link';

// export default function Vehicles({ vehicles }: any, ctx: NextPageContext) {
//     const user = useSelector(state => state.phUser?.focusUser)
//     return (
//         <>
//             <Layout user={user} >
//                 <Link href="/settings" >
//                     <a>Back </a>
//                 </Link>
//                 <h3 > Vehicles list: </h3>
//                 <div > {JSON.stringify(vehicles)} </div>
//             </Layout>
//         </>
//     )
// }

// Vehicles.getInitialProps = async (ctx: NextPageContext) => {
//   const json = await myGet('/api/vehicles', ctx);
//   return {vehicles: json };
// }
export {}