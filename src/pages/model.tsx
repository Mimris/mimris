import { connect, useSelector } from  'react-redux';
import Page from '../components/page'

import Model from '../components/Model.tsx'
import Modelling from '..compnents/Modelling.tsx'

// repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json
// example: http://localhost:3000/model?fileurl=Kavca/kavca-akm-models/models/main/AKM-IRTV-Startup.json&model=modelname&modelview=modelviewname

const page = (props: any) => {

  const [domainName, setDomainName] = useState("");
  let queryModels, queryModelviews

    useEffect(() => {
        if (debug) console.log('89 modelling useEffect 1', query)//memoryLocState[0], props.phFocus.focusModelview.name)
        setDomainName(window.location.hostname);

        const getQuery = async () => {
          let queryParam = null;
          try {
            queryParam = new URLSearchParams(window.location.search);
            if (queryParam) {
              // first lets get the file from GitHub
              if (debug) console.log('120 modelling queryParam', query, queryParam)
              const queryParams = queryParam.get('file');
              // const queryParams = (queryParam) ? JSON.parse(JSON.stringify(queryParam?.focus)) : null;
              const params = JSON.parse(queryParams);
              const res = await searchGithub('', '', filename, '', '') // filename is the complete url
              const githubData = await res.data
              console.log('138 modelling githubData:', githubData)

              if (debug) console.log('124 modelling params', params)
              if (githubData) {
                queryModelName = githubData.model,
                queryModelviewName = githubFile.modelview
              }
                const orgrepo = githubFile.org + '/' + githubFile.repo
                console.log('134 modelling orgrepo:', orgrepo)
                const res = await searchGithub(orgrepo, githubFile.path, githubFile.filename, githubFile.branch, 'file')
                const githubData = await res.data
                const sha = await res.data.sha
                console.log('138 modelling githubData:', githubData, sha) 
                    
                // const data = {
                //   githubData
                // }
                // const data = {
                //   phData: githubData.phData,
                //   phFocus: {
                //     ...props.phFocus,
                //     focusProj: focusProj,
                //     focusModel:  params.focusModel,
                //     focusModelview: params.focusModelview,
                //     focusObject: params.focusObject,
                //     focusObjectview:  params.focusObjectview,
                //     focusRole: params.focusRole,
                //     focusTask: params.focusTask,
                //   },
                //   phSource: props.phSource,
                //   phUser: props.phUser,
                //   lastUpdate: props.lastUpdate,
                // };
                // dispatchLocalStore(data); // dispatch to store the latest [0] from local storage
                console.log('159 modelling', data)
                dispatch({ type: 'LOAD_TOSTORE_DATA', data: githubData })
                // const timer = setTimeout(() => {
                //   setRefresh(!refresh);
                // } , 2000);
    
    
              } else if (focus && !githubFile) {
                if (debug) console.log('155 modelling', focus);
                if (params) {
                  const data = {
                    phFocus: {
                      ...props.phFocus,
                      focusProj: focusProj,
                      focusModel: params.focusModel,
                      focusModelview: params.focusModelview,
                      focusObject: params.focusObject,
                      focusObjectview: params.focusObjectview,
                      focusRole: params.focusRole,
                      focusTask: params.focusTask,
                    },
                  };
    
                  dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data })
                }
              }
            }
          } catch (error) {
            console.log('117 modelling query error ', error);
          }
    
        }
        if (debug) console.log('177 modelling useEffect 1', query)//memoryLocState[0], props.phFocus.focusModelview.name)
        const timer = setTimeout(() => {
          getQuery()
        }
          , 1000);
        setMount(true)
        // }, [])
      }, []);

return (
    <>
        <Modelling />
    </>
)
}

export default Page(connect(state => state)(page));