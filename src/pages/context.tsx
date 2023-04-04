import React, { useContext } from 'react'
import { connect, useDispatch } from 'react-redux'
import Layout from '../components/Layout'
import Context from "../components/Context"


const page = (props) => {


    return (
        <div>
            <Layout>
                <div className="container">
                    <div className="content">
                        <div className="main">
                            <h1 className="title">Context
                            </h1>
                             <Context />
                        </div>
                    </div>
                </div>
            </Layout>
            <style jsx>{` `}</style>
        </div>
    )

}

export default connect (state => state)(page) ;

