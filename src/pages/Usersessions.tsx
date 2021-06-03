// import { NextPageContext } from "next";
// import { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { myGet } from "../defs/myGet";
// import Layout from '../components/Layout';
// import Link from 'next/link';

// export default function Usersessions({ usersessions }: any, ctx: NextPageContext) {

//   const state = useSelector((state: any) => state)
//   const [usersess, setUsersess] = useState(usersessions)

//   useEffect(() => {
//     async function loadData() {
//       const response = await myGet('/api/usersessions', ctx);
//       console.log('19 response ', response);
//       setUsersess(response)
//     }
//     // if (vehicles?.length == 0) {
//     if (usersessions) {
//       loadData();
//     }
//   }, [!usersessions]);

//   return (
//     <>
//       <Layout user={state.phUser?.focusUser}>
//         <Link href="/settings">
//         <a>Back </a>
//         </Link>
//         <h3 > Usersessions: </h3>
//         <pre style={{
//             display: "block",
//             fontFamily: "monospace",
//             whiteSpace: "pre-wrap",
//             margin: "1em 0",
//             overflow: "brake"
//           }}> 
//           {/* { usersess }  */}
//           { JSON.stringify(usersess) } 
//         </pre>
//       </Layout>
//     </>
//   )
// }

// Usersessions.getInitialProps = async (ctx: NextPageContext) => {
//   const json = await myGet('/api/usersessions', ctx);
//   return { usersessions: json };
// }
export {}