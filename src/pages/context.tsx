import React, { useContext } from 'react'
import Link from 'next/link'
import { connect, useDispatch, useSelector } from 'react-redux'
import Layout from '../components/Layout'
import Context from "../components/Context"
import SetContext from '../defs/SetContext'

const debug = false
const page = (props) => {

    const ph = useSelector(ph => props)

    if (!debug) console.log('13 context', props, ph)

    return (
        <div>
            <Layout>
                <div className="container">
                    <div className="content">
                        <div className="main">
                            <h1 className="title">Context
                            </h1>
                            <div className="contextarea d-flex my-2" style={{backgroundColor: "#cdd" ,width: "99%", maxHeight: "24px"}}> 
                                <SetContext className='setContext' ph={props} />
                                <div className="contextarea--context d-flex justify-content-between align-items-center " style={{ backgroundColor: "#dcc"}}>
                                    <Link className="home p-2 m-2 text-primary" href="/context"> Context </Link>
                                    {/* <SelectContext className='ContextModal mr-2' buttonLabel='Context' phData={props.phData} phFocus={props.phFocus} />  */}
                                    <Link className="video p-2 m-2 text-primary" href="/videos"> Video </Link>
                                </div>
                            </div>
                            <Context props={ph} />
                        </div>
                    </div>
                </div>
            </Layout>
            <style jsx>{` `}</style>
        </div>
    )

}

export default connect (state => state)(page) ;

