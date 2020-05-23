/// @ts- nocheck
import React, { useState } from "react";
// import { connect, useSelector, useDispatch } from 'react-redux';
import { connect, useSelector, useDispatch } from 'react-redux';
import Page from '../components/page';
import Layout from '../components/Layout';
// import Index from '../components/Index';
import { loadData } from '../actions/actions'
// import gqlSchemas from '../components/gql/GenGqlSchemas'

    
// Index.getInitialProps = async function () {
  // const dispatch = useDispatch()
  // dispatch(loadData())
// };

const page = (props: any) => {
  // console.log(props)
  const dispatch = useDispatch()

  // console.log('17', props.phData);
  const [ loaded, setLoaded] = useState(false);
  if (!props.phData) {
    if (!loaded) {
      dispatch(loadData())
      setLoaded(true)
    }
  }
  // const metis = (props.phData) && props.phData.metis
  // const model = (metis) && metis.models[0]
  const state = useSelector((state:any) => state)
  const metis = (state.phData) && state.phData.metis
  const metamodelsPre = (metis) ? JSON.stringify(metis) : []
  // console.log('22', (metis) && metis.metamodels);
  // const modelName = (metis) && metis.models[0].name
  // const indexRender = (metis) && <Index phData={model} phFocus={props.phFocus} />
  // console.log('19', metis); 


  // const [isToggled, setToggled] = useState(false);
  // const [showSubject, setShowSubject] = useState(false);
  // const [showPlenary, setShowPlenary] = useState(false);


  return (
    <div>
      <Layout user={state.phUser?.focusUser}>
        <div>
          <h4>GraphQL Page </h4>
          
          {/* <code><pre> {metamodelsPre} </pre></code> */}
          {/* <code><pre>{JSON.stringify(metamodelsPre)}</pre></code> */}
          <code>      <pre style={{
            display: "block",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            margin: "1em 0",
            overflow: "brake"
          }}> {metamodelsPre}</pre></code>
        </div>
      </Layout>
      < style jsx > {`
      `}</style>
    </div>
  );
}

export default Page(connect(state => state)(page));
