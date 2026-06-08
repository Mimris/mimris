// @ts-nocheck
import React from 'react'
import Link from 'next/link'
import { connect, useDispatch, useSelector } from 'react-redux'
import Layout from '../components/Layout'
import ReportModule from "../components/export/ReportModule"
import ContextView from '../defs/ContextView'
import SelectContext from '../components/utils/SelectContext'
import { selectSharedUniverseState } from '../sharedUniverse'

const debug = false
const page = (props) => {


    const dispatch = useDispatch()
    const sharedUniverse = useSelector(selectSharedUniverseState)
    const legacyProps = {
        ...props,
        phData: {
            ...props.phData,
            domain: sharedUniverse.world.worldDefinition.domain ?? props.phData?.domain,
            metis: sharedUniverse.world.worldModel.metis ?? props.phData?.metis,
            documents: sharedUniverse.compatibility.documents ?? props.phData?.documents,
        },
        phFocus: sharedUniverse.world.focus || props.phFocus || {},
        phUser: sharedUniverse.user || props.phUser || {},
        phSource: sharedUniverse.source ?? props.phSource,
        phList: sharedUniverse.compatibility.modelList ?? props.phList,
    }
    const modelInFocusId = legacyProps.phFocus?.focusModel?.id || legacyProps.phData?.metis?.models?.[0]?.id
    const [refresh, setRefresh] = React.useState(false)

    const toggleRefresh = () => {
        setRefresh(!refresh)
        dispatch({type: 'SET_FOCUS_REFRESH', data:  {id: Math.random().toString(36).substring(7), name: 'refresh'}})
    }

    if (debug) console.log('13 context',  legacyProps)

    return (
        <>
            <Layout>
                <div className="container-context m-4 w-75">
                    {/* <div className="content"> */}
                        <div className="main">
                            <h1 className="title">Context
                            </h1>
                            <div className="contextarea d-flex my-2" style={{backgroundColor: "#cdd" ,width: "auto", maxHeight: "24px"}}> 
                                <ContextView className='setContext' ph={legacyProps} />
                                <div className="contextarea--context d-flex justify-content-between align-items-center " style={{ backgroundColor: "#dcc"}}>
                                    <Link className="home p-2 m-2 text-primary" href="/context">✵</Link>
                                    <SelectContext className='ContextModal mr-2' buttonLabel='Context' phData={legacyProps.phData} phFocus={legacyProps.phFocus} /> 
                                    <Link className="video p-2 m-2 text-primary" href="/videos"> Video </Link>
                                </div>
                                <span className="btn px-2 py-0 mt-0 pt-1 bg-light text-secondary float-right"  onClick={toggleRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > refresh </span>
                            </div>
                            <div className="container">
                                {modelInFocusId ? (
                                    <ReportModule props={legacyProps} reportType="object" modelInFocusId={modelInFocusId} />
                                ) : (
                                    <div className="text-muted">No model in focus.</div>
                                )}
                            </div>
                        </div>
                    {/* </div> */}
                </div>
            </Layout>
        </>
    )


}

export default connect (state => state)(page) ;
