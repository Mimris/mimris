import { useSelector } from 'react-redux';
import { useRef, useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Signup() {
  const user = useSelector(state => state.phUser.focusUser)
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<any>(null);
  async function handleSignup() {
    const resp = await fetch('http://localhost:4050/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: nameRef.current?.value,
        email: emailRef.current?.value,
        password: passRef.current?.value
      })
    });
    const json = await resp.json();
    setMessage(json);
  }

  return (
    (!message) 
    ?     
    <><Layout user={user} >
      <div>
        <h1>Create a new user!!</h1>
        {JSON.stringify(message)}<br />
        <input type="name" placeholder="name" ref={nameRef} />
        <input type="text" placeholder="email" ref={emailRef} />
        <input type="password" placeholder="password" ref={passRef} />
        <button onClick={handleSignup}>SignUp</button>
      </div>
    </Layout></>
    :  
    <><Layout user={user} >
      <div>
      {JSON.stringify(message)} 
      <br />
            <Link href="/login">
              <a>Login</a>
            </Link>

      </div>
    </Layout></>
  )
}
