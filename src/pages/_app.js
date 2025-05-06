import { Provider } from 'react-redux';
import { makeStore } from '../store'; // Adjust path as needed
// // Bootstrap Bundle JS
import "bootstrap/dist/css/bootstrap.min.css";
import '@fortawesome/fontawesome-free/css/all.css';
import "../styles/styles.css"
import "../styles/styles-grid.css"
import "../styles/gojs.css"
import "../styles/globals.css";

import { wrapper } from '../store';

const MyApp = ({ Component, pageProps }) => {
  const { store, props } = wrapper.useWrappedStore(pageProps);

  return (
    <Provider store={store}>
      <Component {...props} />
    </Provider>
  );
}

export default MyApp;
