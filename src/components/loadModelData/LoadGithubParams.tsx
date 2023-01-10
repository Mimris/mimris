import React from 'react';
import { connect, useSelector, useDispatch } from 'react-redux';


const debug = false

export default function LoadGithubParams(props) {
    const dispatch = useDispatch()
    const { file, branch, repo } = props;


    function dispatchGithub(query) {
        if (!debug) console.log('45 modelling dispatchGithub', query)
        const data = {query}
        dispatch({type: 'LOAD_DATAGITHUB', data })
      }

    // const url = `https://raw.githubusercontent.com/${repo}/${branch}/${file}`;
    // const url = `https://raw.githubusercontent.com/${repo}/${path}/${file}`;
    return (
        <div>
        <h1>Prams</h1>
        <h1>{file}</h1>
        {/* <iframe src={url} width="100%" height="1000px" /> */}
        </div>
    );

}


         


       

      