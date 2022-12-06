import App, { Container } from 'next/app'
import React from 'react'
import { Provider } from 'react-redux'
import withRedux from 'next-redux-wrapper'
import withReduxSaga from 'redux-saga'
import createStore from '../store'

const MyApp = ({ Component, pageProps }) => (
  <Component {...pageProps} />
)

export default withRedux(createStore)(withReduxSaga(MyApp))
