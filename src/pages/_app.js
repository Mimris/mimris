import { Provider } from 'react-redux';
import { makeStore } from '../store'; // Adjust path as needed
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import '../styles/styles.css';
import '../styles/styles-grid.css';
import '../styles/gojs.css';
import '../styles/globals.css';

import Head from 'next/head';
import Router from 'next/router';
import { wrapper } from '../store';

if (typeof window !== 'undefined') {
  // Suppress TensorFlow.js "already registered" warnings
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args[0]?.toString() || '';
    // Filter out TensorFlow kernel registration warnings
    if (message.includes('already registered') ||
        message.includes('already been set') ||
        message.includes('The kernel') ||
        message.includes('Platform browser')) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };

  const nextGlobal = (window.next = window.next || {});
  const fallbackRouter = {
    components: {},
    pathname: window.location.pathname,
  };
  const descriptor = Object.getOwnPropertyDescriptor(nextGlobal, 'router');

  Object.defineProperty(nextGlobal, 'router', {
    configurable: true,
    enumerable: descriptor?.enumerable ?? true,
    get() {
      return Router.router ?? fallbackRouter;
    },
    set(value) {
      Object.defineProperty(nextGlobal, 'router', {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      });
    },
  });
}

const MyApp = ({ Component, pageProps }) => {
  const { store, props } = wrapper.useWrappedStore(pageProps);

  return (
    <>
      <Head>
        <title>AKMM</title>
        <meta name="description" content="AKM Modelling Platform is the base modelling tool for making Active Knowlege Models. It is built on the ideas and methods used in the Metis modelling tool developed by Metis in the 1990's. AKMM is built with modern web technologies like React, Nextjs, Redux, Nodejs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Provider store={store}>
        <Component {...props} />
      </Provider>
    </>
  );
};

export default MyApp;



// import { Provider } from 'react-redux';
// import { makeStore } from '../store'; // Adjust path as needed
// // // Bootstrap Bundle JS
// import "bootstrap/dist/css/bootstrap.min.css";
// import '@fortawesome/fontawesome-free/css/all.css';
// import "../styles/styles.css"
// import "../styles/styles-grid.css"
// import "../styles/gojs.css"
// import "../styles/globals.css";

// import { wrapper } from '../store';

// const MyApp = ({ Component, pageProps }) => {
//   const { store, props } = wrapper.useWrappedStore(pageProps);

//   return (
//     <Provider store={store}>
//       <Component {...props} />
//     </Provider>
//   );
// }

// export default MyApp;
