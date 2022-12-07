'use client';

import Head from 'next/head';
import TopMenu from './Navbar';
// import useDarkMode from '../hooks/use-dark-mode';
// import Toggle from '../utils/Toggle';

const Layout = (props) => {
  // console.log('6 layout', props.user);
  // const [darkMode, setDarkMode] = useDarkMode();

  return (

    <div style={{ backgroundColor: "#fff" }} >
      <Head>
        <title>AKM Modelling App</title>
        {/* <link rel="stylesheet" href="https://bootswatch.com/4/cerulean/bootstrap.min.css" crossOrigin="anonymous"/> */}
        {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reactstrap/4.8.0/reactstrap.min.js"/> */}
        {/* <link rel="icon" href="http://fossland.net/images/spider.gif"/> */}
        <link rel="icon" href="" />
      </Head>
      <TopMenu user={props.user}/>
        {/* <div className="container-fluid" > */}
          {/* <div className="navbar">
            <Toggle darkMode={darkMode} setDarkMode={setDarkMode} />
          </div> */}
      <div className="container-fluid mx-0 px-0" >
        {/* <div className="container-fluid ml-1 pl-0 pr-2" > */}
        {/* <div className="container-fluid"> */}
          {/* <div className="content"> */}
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











// import Head from 'next/head';
// import TopMenu from './Navbar';


// const Layout = (props) => {
//   // console.log('6 layout', props.user);
  
//   return (

//     <div style={{ backgroundColor: "#eee" }} >
//     <Head>
//       <title>AKM Modelling App</title>
//       <link rel="stylesheet" href="https://bootswatch.com/4/cerulean/bootstrap.min.css" />
//       {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reactstrap/4.8.0/reactstrap.min.js"/> */}
//       {/* <link rel="icon" href="http://fossland.net/images/spider.gif"/> */}
//       <link rel="icon" href="" />
//     </Head>
//     <TopMenu user={props.user}/>
//     <div className="container-fluid" >
//     {/* <div className="container-fluid mx-0 px-1" > */}
//     {/* <div className="container-fluid ml-1 pl-0 pr-2" > */}
//     {/* <div className="container-fluid"> */}
//       <div>
//         {props.children}
//       </div>
//     </div>
//   </div>
// );
//   }
// export default Layout;
