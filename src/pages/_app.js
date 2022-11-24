import React from 'react'
import { wrapper } from '../store'

import "../styles/styles.css"
import "../styles/styles-grid.css"
import "../styles/gojs.css"

<<<<<<< HEAD
const MyApp = ({ Component, pageProps }) => (
  <Component {...pageProps} />
  )
  
  export default wrapper.withRedux(MyApp)
  
  
// import App, { Container } from 'next/app'
// import { Provider } from 'react-redux'
// import withRedux from 'next-redux-wrapper'
// import withReduxSaga from 'next-redux-saga'
// import createStore from '../store'

// class MyApp extends App {
//   static async getInitialProps ({ Component, ctx }) {
//     let pageProps = {}
//     if (Component.getInitialProps) {
//       pageProps = await Component.getInitialProps({ ctx })
//     } else if (Component.getStaticProps) {
//       pageProps = await Component.getStaticProps({ ctx })
//     return { pageProps }
//     }
//   }
//   render () {
//     const { Component, pageProps, store } = this.props
//     return (
//       <Provider store={store}>
//         <Component {...pageProps} />
//       </Provider>
//     )
//   }
// }
// export default withRedux(createStore)(withReduxSaga(MyApp))
=======
class MyApp extends App {
  static async getInitialProps ({ Component, ctx }) {
    let pageProps = {}
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps({ ctx })
    } else if (Component.getStaticProps) {
      pageProps = await Component.getStaticProps({ ctx })
    return { pageProps }
    }
  }
  render () {
    // const { Component, pageProps, store } = this.props

    return (
      <Provider store={store}>
        <Component {...pageProps} />
      </Provider>
    )
  }
}

export default withRedux(createStore)(withReduxSaga(MyApp))
>>>>>>> f13a2688d4f937a1fbaf573735281edde1b808e3
