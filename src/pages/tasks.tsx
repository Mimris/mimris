//@ts-nocheck
import { useEffect } from "react";
import { connect } from 'react-redux';
import { useRouter } from "next/router";
import Page from '../components/page';

import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Tasks from '../components/Tasks';

const page = (props: any) => {
    const { query } = useRouter();
    useEffect(() => {
        console.log('16 page tasks props', props);
    }, []);
    
    const taskFocusModel = {id: query.taskFocusModel, name: 'taskFocusModel'};
    
    console.log('22 page tasks props', query, taskFocusModel,props);

    return (
        <>
            <Layout user={props.phUser?.focusUser} >
                <div id="index" >
                    <div className="wrapper bg-secondary"
                    style={{ minHeight: '100vh', paddingBottom: '100px' }}
                    >
                        <div className="wrapper container"
                            style={{  backgroundColor: 'lightyellow', minHeight: '100vh', paddingBottom: '100px' }}
                        >
                            <div className="header">
                                <Header title='Modelling Tasks' />
                            </div>
                                <Tasks props={props} taskFocusModel={taskFocusModel} asPage={true}/>
                            <div className="footer">
                                <Footer />
                            </div>    
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    );
}

export default Page(connect((state: any) => state)(page));

