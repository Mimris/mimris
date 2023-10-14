'use client';

import Head from 'next/head';
import TopMenu from './Navbar';
// import useDarkMode from '../hooks/use-dark-mode';
// import Toggle from '../utils/Toggle';

const Layout = (props) => {
  // console.log('6 layout', props.user, props);
  // const [darkMode, setDarkMode] = useDarkMode();

  return (
    <div style={{ backgroundColor: "#fff" }} >
      <Head>
        <title>AKM Modelling App</title>
        <link rel="icon" href="" />
      </Head>
      <TopMenu user={props.user}/>
          {/* <div className="navbar">
            <Toggle darkMode={darkMode} setDarkMode={setDarkMode} />
          </div> */}
      <div className="container-fluid mx-0 px-0" >
          <div>
          {/* <Content {checked, onChange}> */}
          {props.children} 
          {/* </Content > */}
        </div>
      </div>
    </div>
  );
  }
export default Layout;
