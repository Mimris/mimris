// @ts-nocheck

// import { useRef, useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
// import { loadData } from '../actions/actions'
import Page from '../components/page';
// import Layout from '../components/Layout';
// import Link from 'next/link';
// import fetch from 'isomorphic-unfetch'

const page = (props: any) => {}

export default Page(connect(state => state)(page));
//   // export default function Login() {
//   console.log('10 Login',
//     props.phUser.focusUser
//   );
//   const dispatch = useDispatch()

//   if (!props.phData) {
//     dispatch(loadData())
//   }

//   // let state = useSelector((state: any) => state) // Selecting the whole redux store
//   // const focusUser = useSelector(focusUser => state.phUser.focusUser)
//   // const state = useSelector(state => state)
//   // const metis = (state.phData) && state.phData.metis
//   // console.log('21 Login', state);

//   const emailRef = useRef<HTMLInputElement>(null);
//   const passRef = useRef<HTMLInputElement>(null);
//   const [message, setMessage] = useState<any>(null);
//   const [session, setSession] = useState<any>(null);

//   // const [usersess, setUsersess] = useState(null)
//   async function handleLogin() {
//     const resp = await fetch('/api/login', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         email: emailRef.current?.value,
//         password: passRef.current?.value
//       })
//     });
//     const json = await resp.json();
//     setMessage(json);
//   }

//   async function loadSessions() {
//     const res = await fetch('/api/usersession/1'); // take the 1st session and dispatch to phFocus
//     const resuss = res.json
//     // console.log('54 response ', resuss);
//     // setUsersess(resus)
//     return resuss
//   }
//   // console.log('6o', message);

//   useEffect(() => {
//     // console.log('61', message);
//     const usersess = loadSessions()
//     setSession(usersess)
//     // console.log('65', session);
//   }, [message]);

//   useEffect(() => {
//     // console.log('69', message);
//     const phuser = (message) && (
//       {
//         focusUser: {
//           ...message?.person,
//           session: session
//         }
//       }
//     )
//     console.log('77', phuser);

//     const data = phuser?.focusUser;
//     console.log('80', data);
//     (data) && dispatch({ type: 'SET_FOCUS_USER', data })
//   }, [(session && message)]);


//   const loginDiv =
//     <div>
//       {(!message) ? 'Please log in!' : JSON.stringify(message)}
//       <br />
//       <input type="text" placeholder="email" ref={emailRef} />
//       <input type="password" placeholder="password" ref={passRef} />
//       <button onClick={handleLogin}>Login</button>
//     </div>

//   const signupDiv = (message) && (session) && (message.mess !== 'Welcome back to AKM Modeller!')
//     ? <div>
//       <div>Not signed in!</div>
//       <Link href="/signup">Please SignUp</Link>
//     </div>
//     : <div>
//       {(message) && `${message.mess} ${message.person.name} `}
//       <hr />
//       {/* {buttonDiv} */}
//       <br />
//       <Link href="/settings">Settings</Link>)
//       </div>
//   console.log('110', props.phUser.focusUser);

//   return ((!message)
//     ? <><Layout user={props.phUser.focusUser} > {loginDiv}</Layout></>
//     : <><Layout user={props.phUser.focusUser} > {signupDiv}</Layout></>);
// }

// export default Page(connect(state => state)(page));






//   // function handleSetSession() {
//   //   const data = session
//   //   console.log('87', data);   
//   //   dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
//   // }
//   // let sessbutton 
//   // useEffect(() => {
//   //   return <button onClick={handleSetSession}>Get Last Session</button>   
//   // }, [session])
//   // const buttonDiv = (session) && <button onClick = { handleSetSession } > Get Last Session</button >
