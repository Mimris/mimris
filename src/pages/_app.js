import { Provider } from 'react-redux';
import { makeStore } from '../store'; // Adjust path as needed
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import '../styles/styles.css';
import '../styles/styles-grid.css';
import '../styles/gojs.css';
import '../styles/globals.css';

import Router from 'next/router';
import { wrapper } from '../store';

if (typeof window !== 'undefined') {
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
    <Provider store={store}>
      <Component {...props} />
    </Provider>
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
