
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";
// // Bootstrap Bundle JS
// import "bootstrap/dist/js/bootstrap.bundle.min";
import { useEffect } from "react";
import "../styles/styles.css"
import "../styles/styles-grid.css"
import "../styles/gojs.css"
import { wrapper } from "../store";
import "../styles/globals.css";

// useEffect(()=>{
//   import("bootstrap/dist/js/bootstrap.bundle.min");
// },[])

const MyApp = ({ Component, pageProps }) => (
  <Component {...pageProps} />
)

export default wrapper.withRedux(MyApp);