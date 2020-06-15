import Head from 'next/head';
import TopMenu from './Navbar';


const Layout = (props) => {
  // console.log('6 layout', props.user);
  return (

    <div style={{ backgroundColor: "#eee" }} >
    <Head>
      <title>AKM Modelling App</title>
      <link rel="stylesheet" href="https://bootswatch.com/4/cerulean/bootstrap.min.css" />
      {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reactstrap/4.8.0/reactstrap.min.js"/> */}
      {/* <link rel="icon" href="http://fossland.net/images/spider.gif"/> */}
      <link rel="icon" href="" />
    </Head>
    <TopMenu user={props.user}/>
    <div className="container-fluid" >
    {/* <div className="container-fluid mx-0 px-1" > */}
    {/* <div className="container-fluid ml-1 pl-0 pr-2" > */}
    {/* <div className="container-fluid"> */}
      <div>
        {props.children}
      </div>
    </div>
  </div>
);
  }
export default Layout;
