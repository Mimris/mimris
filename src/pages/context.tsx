import React, { useContext } from 'react'
import Link from 'next/link'
import { connect, useDispatch, useSelector } from 'react-redux'
import Layout from '../components/Layout'
import ReportModule from "../components/ReportModule"
import SetContext from '../defs/SetContext'
import SelectContext from '../components/utils/SelectContext'

const debug = false
const page = (props) => {


    const dispatch = useDispatch()
    const [refresh, setRefresh] = React.useState(false)

    const toggleRefresh = () => {
        setRefresh(!refresh)
        dispatch({type: 'SET_FOCUS_REFRESH', data:  {id: Math.random().toString(36).substring(7), name: 'refresh'}})
    }

    if (!debug) console.log('13 context',  props)

    return (
        <>
            <Layout>
                <div className="container-context m-4 w-75">
                    {/* <div className="content"> */}
                        <div className="main">
                            <h1 className="title">Context
                            </h1>
                            <div className="contextarea d-flex my-2" style={{backgroundColor: "#cdd" ,width: "auto", maxHeight: "24px"}}> 
                                <SetContext className='setContext' ph={props} />
                                <div className="contextarea--context d-flex justify-content-between align-items-center " style={{ backgroundColor: "#dcc"}}>
                                    <Link className="home p-2 m-2 text-primary" href="/context">✵</Link>
                                    <SelectContext className='ContextModal mr-2' buttonLabel='Context' phData={props.phData} phFocus={props.phFocus} /> 
                                    <Link className="video p-2 m-2 text-primary" href="/videos"> Video </Link>
                                </div>
                                <span className="btn px-2 py-0 mt-0 pt-1 bg-light text-secondary float-right"  onClick={toggleRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > refresh </span>
                            </div>
                            <div className="container">
                             <ReportModule props={props}  refresh={refresh}/>
                            </div>
                        </div>
                    {/* </div> */}
                </div>
            </Layout>
        </>
    )

}

export default connect (state => state)(page) ;

