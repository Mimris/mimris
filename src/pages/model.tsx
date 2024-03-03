import React, { useState, useEffect } from 'react'; 
import { connect, useSelector, useDispatch } from  'react-redux';
import { useRouter } from 'next/router';
import Page from '../components/page';

import Model from '../components/Model'
import Modelling from '../components/Modelling'

import { searchGithub } from '../components/githubServices/githubService';
import GenGojsModel from '../components/GenGojsModel';
import { setfocusRefresh } from '../actions/actions';

// repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json
// example: http://localhost:3000/model?fileurl=Kavca/kavca-akm-models/models/main/AKM-IRTV-Startup.json&model=modelname&modelview=modelviewname

const debug = false

const page = (props: any) => {

  let data = props.data
  const { query } = useRouter(); 
  const dispatch = useDispatch();
 // http://localhost:3000/model?org=Kavca&repo=kavca-akm-models&path=models&branch=main&file=AKM-Type-Definitions_PR.json&model=AKM-Type-Definitions_TD&modelview=2-IRTV

 const [domainName, setDomainName] = useState("");
  const [queryParam, setQueryParam] = useState(new URLSearchParams());
  const [mount, setMount] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const [filename, setFilename] = useState("");
  const [model, setModel] = useState(""); 
  const [modelview, setModelview] = useState("");


  let queryModel, queryModelview = null;


    useEffect(() => {
      const timer = setTimeout(() => {
        if (!debug) console.log('26 modelling useEffect 1', query) 
        if (query) {  
          setDomainName(window.location.hostname);
          setQueryParam(new URLSearchParams(window.location.search));
          setFilename(queryParam.get('file'));
          setModel(queryParam.get('model'));
          setModelview(queryParam.get('modelview'));
        }
        setMount(true)
      }, 1000);
      return () => clearTimeout(timer);
    }, []);

    if (mount) {
      if (!debug) console.log('53 modelling useEffect 2', query) 
        const getQuery = async () => {
          try {
            if (query) {
              const org = query.org;
              const repo = query.repo;
              const path = query.path;
              const branch = query.branch;
              const filename = query.file;
              const model = query.model;
              const modelview = query.modelview;
            if(!debug) console.log('64 modelling query', query, filename, model, modelview)
              if (!debug) console.log('65 modelling queryParam', queryParam, model, modelview, filename )
              // first lets get the file from GitHub
              if (!debug) console.log('67 modelling query', query, filename, model, modelview)
              const response = await searchGithub(org+'/'+repo, path, filename, branch, 'file') // filename is the complete url
              console.log('69 modelling githubData:', response)
              const responseData = await response.data
              console.log('71 modelling githubData:', responseData)
              if (responseData) {
                const phData = responseData.phData
                const phFocus = responseData.phFocus
                const phUser = responseData.phUser
                const phSource = responseData.phSource
                const metis = phData.metis
                const curmodel = metis.models.find(m => m.name === model)
                const curmodelview = curmodel.views.find(v => v.name === modelview)
                // it is a Project file
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
                        filename: filename,
                      }
                    },
                    phUser:   phUser,
                    phSource: phSource
                    // phSource: model.phData.metis.name || model.phSource 
                  }
                  if (debug) console.log('116', data)
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

return (refresh) 
?  (<><Modelling props={data}/></>  )
  : ( <> <Modelling  props={data}/> </>)
}

export default Page(connect(state => state)(page));