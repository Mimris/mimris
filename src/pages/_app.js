import App, { Container } from 'next/app'
import React from 'react'
import { Provider } from 'react-redux'
import withRedux from 'next-redux-wrapper'
import withReduxSaga from 'next-redux-saga'
import createStore from '../store'

import "../styles/styles.css"
import "../styles/styles-grid.css"
// import "../styles/styles-dm.scss"
import "../styles/gojs.css"
// import 'reactjs-popup/dist/index.css';
// import '../styles/globals.css'

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
    const { Component, pageProps, store } = this.props
    return (
      <Provider store={store}>
        <Component {...pageProps} />
      </Provider>
    )
  }
}

export default withRedux(createStore)(withReduxSaga(MyApp))
