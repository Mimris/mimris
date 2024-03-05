import React, { useState, useEffect } from 'react'; 
import { connect, useSelector, useDispatch } from  'react-redux';
import { useRouter } from 'next/router';
import Page from '../components/page';

import Model from '../components/modelSuite/Model'
import Modelling from '../components/Modelling'

import { searchGithub } from '../components/githubServices/githubService';
import GenGojsModel from '../components/GenGojsModel';
import { setfocusRefresh } from '../actions/actions';
import Link from 'next/link';

// example: http://localhost:3000/model?org=Kavca&repo=kavca-akm-models&path=models&branch=main&file=SELL-A-CAR_PR.json&model=SELL_A_CAR_CM&modelview=1-Overview

const debug = false

const page = (props: any) => {

  let data = props.data
  const { query } = useRouter(); 
  const dispatch = useDispatch();
  const [domainName, setDomainName] = useState("");
  const [queryParam, setQueryParam] = useState(new URLSearchParams());
  const [mount, setMount] = useState(false);
  const [refresh, setRefresh] = useState(false);

  let queryModel, queryModelview = null;
  let org, repo, path, branch, file, model, modelview = null;


  useEffect(() => {

    const timer = setTimeout(() => {// wait for the query to be set
      if (!debug) console.log('26 model useEffect 1', query) 
      if (query) {  
        setDomainName(window.location.hostname);
        setQueryParam(new URLSearchParams(window.location.search));
        file = queryParam.get('file');
        model = queryParam.get('model');
        modelview= queryParam.get('modelview');
      }
        setMount(true)
      }, 1000);
      return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (mount) {
      if (!debug) console.log('53 model useEffect 2', query) 
        const getQuery = async () => {
          try {
            console.log('57 model query', query, file, model, modelview)
            if (query) {
              org = query.org;
              repo = query.repo;
              path = query.path;
              branch = query.branch;
              file = query.file;
              model = query.model;
              modelview = query.modelview;

      
              if(!debug) console.log('64 model query', query, file, model, modelview)
              if (!debug) console.log('65 model queryParam', queryParam, model, modelview, file )
              // first lets get the file from GitHub
              if (!debug) console.log('71 model ', org, repo, path, file, branch, model, modelview)
              const response = await searchGithub(org+'/'+repo, path, file, branch, 'file') // file is the complete url
              console.log('70 model response:', response)
              const responseData = await response.data
              if (responseData) {
                console.log('72 model githubData:', responseData)
                const phData = responseData.phData
                const phFocus = responseData.phFocus
                const phUser = responseData.phUser
                const phSource = responseData.phSource
                const metis = phData.metis
                console.log('80 model metis', phData, metis)
                let curmodel = metis.models.find(m => m.id === model)
                if (!curmodel) curmodel = metis.models.find(m => m.name === model)
                console.log('83 model curmodel', curmodel.modelviews, modelview)
                let curmodelview = curmodel.modelviews.find(v => v.id === modelview)
                if (!curmodelview) curmodelview = curmodel.modelviews.find(v => v.name === modelview)
                // it is a Project file
                console.log('85 model curmodelview', curmodelview)
                  data = {
                    phData: {
                        ...phData,
                        metis: {
                            ...metis,
                            name: metis.name,
                            description: metis.description,
                        },
                    },
                    phFocus:  {
                      ...phFocus,
                      focusModel: { 
                        id: curmodel.id,
                        name: curmodel.name,
                      },
                      focusView: {
                        id: curmodelview.id,
                        name: curmodelview.name,
                      },
                        
                      focusProj: {
                        ...phFocus.focusProj,
                        org: org,
                        repo: repo,
                        path: path,
                        branch: branch,
                        username: org,
                        file: file,
                      }
                    },
                    phUser:   phUser,
                    phSource: phSource
                    // phSource: model.phData.metis.name || model.phSource 
                  }
                  if (!debug) console.log('116 model', data)
                  if (data.phData)    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
                  if (data.phFocus)   dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data.phFocus })
                  if (data.phUser)    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: data.phUser })
                  if (data.phSource)  dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data.phSource })
              } 
            }

            setRefresh(true)
            if (!debug) console.log('122', model, modelview)

          } catch (error) { 
            console.log('128 query error', error)
          }
        }
        getQuery()  
    }
  } , [mount]);

  return (
    <>
      <div className="ms-aut expand-button"> {/* Changed className to "ms-auto expand-button" */}
        <Link className="link " href={`/modelling?org=${org}&repo=${repo}&path=${path}&branch=${branch}&file=${file}&model=${model}&modelview=${modelview}`}
          style={{position: "fixed", marginRight: "9px", right: "0", top: "0"}}
        >
          <i className="fa fa-maximize" aria-hidden="true"></i>
        </Link>
        <Model props={data} />
      </div>  
    </>
  )
  // return (<Modelling props={data}/>)
}
export default Page(connect(state => state)(page));