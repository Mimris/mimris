// 'use client';

import Head from 'next/head';
import TopMenu from './Navbar';

// import useDarkMode from '../hooks/use-dark-mode';
// import Toggle from '../utils/Toggle';

const Layout = (props) => {
  const projName =  props?.children?.props?.children?.props?.children[0]?.props?.children[0]?.props?.ph?.phSource;
  // console.log("11 projName", projName);
  // const projName = props.phSource.;
  // const [darkMode, setDarkMode] = useDarkMode();
  return (
    <div style={{ backgroundColor: "#fff" }} >
      <Head>
      <title>
         {(projName) ? projName : "AKMM"}
      </title>
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
