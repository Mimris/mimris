// 'use client';

const debug = false;

import Head from 'next/head';
import TopMenu from './Navbar';

// import useDarkMode from '../hooks/use-dark-mode';
// import Toggle from '../utils/Toggle';

const Layout = (props) => {
  if (debug) console.log("11 Layout props", props);
  const projName = "Mimris Modeling App" //props?.children?.props?.children?.props?.children[0]?.props?.props?.phData?.metis?.name || "AKMM APP";
  // const projSource = "AKMM Source file not found"//props.children.props.children.props.children[0].props.props.phSource || "AKMM Source file not found";
  // get projSource from props.children
  const projSource = props?.children?.props?.children?.props?.children[0]?.props?.props?.phSource || "Mimiris Source file not found";
  // console.log("17 projName", projSource);
  // const projName = props.phSource;
  // const [darkMode, setDarkMode] = useDarkMode();
  return (
    <div style={{ backgroundColor: "#fff" }} >
      <Head>
      <title>
        {projName}
         {/* {(projName) ? projName : "AKMM"} */}
      </title>
        <link rel="icon" href="" />
      </Head>
      <TopMenu projName={projSource} user={props.user}/>
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
