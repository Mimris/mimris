import "../styles/globals.css";
import { wrapper } from "../store";

const MyApp = ({ Component, pageProps }) => (
  <Component {...pageProps} />
)

export default wrapper.withRedux(MyApp);