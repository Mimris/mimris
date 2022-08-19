import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'
import base64 from 'base-64';

// import  Search  from './Search';
import TextInput from './utils/TextInput';
import Select from './utils/Select';
import { searchRepos, searchModels, searchModel } from './services/githubService';
import { loadDataModel } from '../actions/actions';

const debug = false

const LoadGitHub = (props: any) => {
  const dispatch = useDispatch();
  // console.log('11', props)

  const username = 'SnorreFossland'

  const url = `https://api.github.com/users/${username}/repos/`

  const repository = 'akm-models'
  const path = 'StartupModels'
  // // const path = 'StartupModels'
  // // console.log('26 url', url)

  // const username = 'josmiseth'
  // const url = `https://api.github.com/users/${username}/repos/`
  // const repository = 'cumulus-akm-pocc'
  // const path = 'Cumulus'

  // The search string are: https://api.github.com/users/${username}/repos/
  // const url = `https://github.com/repos/${username}/${repository}/contents/${path}`

  const [githubLink, setGithubLink] = useState('http://github.com/');
  // const [searchText, setSearchText] = useState('');
  const [usernameText, setUsernameText] = useState('');
  const [pathText, setPathText] = useState('');
  const [repoText, setRepoText] = useState(repository);
  const [repos, setRepos] = useState([]);
  const [model, setModel] = useState({});
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState(false);

  const { buttonLabel, className } = props;
  const toggle = () => setModal(!modal);

  useEffect(() => {
    if (usernameText === '') setUsernameText(username)
    if (repoText === '') setRepoText(repository)
    if (pathText === '') setPathText(path)  
    const timer = setTimeout(() => {
    setGithubLink(`https://github.com/${usernameText}${repoText}/`)
    }, 1000);
    return () => clearTimeout(timer);
  }, [])

  const onUsernameChange = (text) => {
    console.log('50 onUsernameChange', text)
    setUsernameText(text);
    setGithubLink(`http://github.com/${text}/${repoText}`);
    console.log('55 onUsernameChange', usernameText)
  };

  const onPathChange = (text) => {
    if (text?.length > 0) {
      setPathText(text);
    } else {
      setPathText('');
    }
  };

  const onModelChange = (text) => {
    console.log('71 onModelChange', text)
    const rep = `repos/${usernameText}/${repoText}/contents/${pathText}`;
    const filname = `/${text}`; // add slash
    loadModel(rep, filname);
    if (debug) console.log('52', rep, filname, )
  }

  const loadModel = async (rep, path) => {
    setLoading(true);
    const searchtext = `${rep}${path}`;
    console.log('80 ', searchtext)
    const res = await searchModel(searchtext, '')
    const content = res.data.content
    console.log('83 ', res)
    if (!debug) console.log('84 ', base64.decode(content))
    const model = JSON.parse(base64.decode(content));
    // const model = JSON.parse(base64.decode(content));
    if (!debug) console.log('87', model)
    setLoading(false);

    if (debug) console.log('90 onModelChange', model)
      
      const data = {
        phData:   model.phData,
        phFocus:  model.phFocus,
        phUser:   model.phUser,
        phSource: model.phSource,
      }

      if (data.phData)    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
      if (data.phFocus)   dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data.phFocus })
      if (data.phUser)    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: data.phUser })
      if (data.phSource)  dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data.phSource })
   
  }
  const onRepoChange = (text) => {
    setRepoText(text);
    // loadRepos(searchText, model);
  };

  const loadRepos = async (repoText, pathText) => {
    if (usernameText?.length > 0)  { 
    setLoading(true);
    if (!debug) console.log('76 loadRepos', repoText, pathText, model)
    const res = await searchRepos(repoText, pathText);
    setLoading(false);
    const repofound = await res.data.items?.filter(repo => repo.name === repoText);
    console.log('118 res.data.items: ', await res.data.items)
    setRepos(await res.data.items?.filter(repo => repo.name === repoText));
    if (debug) console.log('95', usernameText, pathText, repoText, res.data, res.data.items, res)
    // loadModels(repoText, pathText);
    }
  };

  const loadModels = async (usernameText, pathText) => {
    setLoading(true);
    const repos = (pathText !== '') ?`repos/${usernameText}/${repoText}/contents/${pathText}` : `repos/${usernameText}/${repoText}/contents`;
    // const rep = `repos/${username}/${repoText}/contents/${pathText}`;
    if (!debug) console.log('125  u', usernameText , 'p', pathText, 'r', repoText, 'repos', repos)
    const res = await searchModels(repos, pathText);
    if (debug) console.log('127 ',  res.data, res)
    // console.log('58', urlText, pathText, res.data, res.data.items, res)
    setLoading(false);
    const filteredModels = res.data.items?.filter(model => model.name.endsWith('.json'));
    setModels(filteredModels);
  };

  useEffect(() => {
    setUsernameText(username);
    setPathText(path);
    const repotext = `${username}/repos`;
    setRepoText(repoText);
    console.log('125',repoText, pathText)
    // const timer = setTimeout(() => {
      loadRepos(repoText, pathText);
    // }, 1000);
    // return () => clearTimeout(timer);
    // loadModels(repoText, pathText);
  }, [(modal)]);

  // useEffect(() => {
  //   setModels()
  // }, [models?.length > 0]);


  let modeloptionss = models?.map((mod) => {
    return {
      value: mod.name,
      label: mod.name
    } 
  });
  const  modeloptions = (modeloptionss?.length > 1) ? [{value: '', label: 'Select Model...'}, ...modeloptionss] : [{value: '', label: 'No Model to select...'}]
  console.log('163 modeloptions', modeloptions, modeloptions?.length)
  // useEffect(() => {
  //  const modeloptionss = 
  //   models?.map((mod) => {
  //     return {
  //       value: mod.name,
  //       label: mod.name
  //     } 
  //   }) || [];
  //   modeloptions = [{value: '', label: 'Select Model...'}, ...modeloptionss]
  //   console.log('162 modeloptions', modeloptionss, models)
  // }, [models])   

    // [{
    //   value: 'none',
    //   label: 'No models found'
    // }]
  
  
  // const githubLink = url.replace(/repos/,'').replace(/api.github.com\/users\//,'github.com/')+repoText+'/'
  console.log('160 githubLink', githubLink)

  return  (
    <>
      <span><button className="btn-context btn-outline-primary text-dark ml-1" onClick={toggle}>{buttonLabel}</button>
      </span>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => {toggle(); }}>GitHub repo</ModalHeader>
        <ModalBody className="pl-1 pt-1 ">
        <div>
          <TextInput
            label="Repo UserName:"
            value={usernameText}
            onChange={(value) => onUsernameChange(value)}
            placeholder="Repos UserName:"
          />         
          {/* {loading ? 'Loading...' : 
            <div>{models.length > 0 ? <div className="text-success"> Models fond </div> : <div className="text-warning"> No repos found </div>}</div>
          } */}
          <hr className="bg-primary m-2" />
          <div>Searching repos in: {url} </div>
          {loading ? 'Loading...' : 
             <div className="text-success m-1" > 
              {repos.map((repo) => (
                <span className="px-1" key={repo.id} > {repo.name}, </span>
              ))} 
              </div> 
          }
          <TextInput
            label="Repository Name:"
            value={repoText}
            onChange={(value) => onRepoChange(value)}
            placeholder="Repo name:"
          />      
  
          <hr className="bg-primary m-2" />
          <span className="w-50">
          <TextInput 
            label="Model path:"
            value={pathText}
            onChange={(value) => onPathChange(value)}
            placeholder="Path to models"
          />
          </span>
          {/* <hr className="bg-primary" /> */}
          <Button className="btn-primary text-black border-primary w-100 float-right mt-2 mb-2 pb-0" onClick = {() => loadModels(usernameText, pathText)}>List Models</Button>
          {(models?.length > 0) 
            ? <div >Models found:
              <span className="text-success m-1">
                {models?.map((mod) => (
                  <span className="px-1" key={mod.name} >{mod.name}, </span>
                ))}
              </span>
              </div> 
            : <div className='text-warning'> 'No models found!'</div>
          } 
           
            {/* {(models.length > 0) ? <div className="text-success">Models found!</div> : <div className="text-warning">No models found!</div>} */}

          <div className="w-75">
            <Select 
              label="Select model:"
              value={(modeloptions) ? modeloptions[0] : 'no models'}
              options={(modeloptions) ? modeloptions : []}
              onChange={(value) => onModelChange(value)}
            />
          </div>
          {/* <hr /> */}
          {/* {loading ? 'Loading...' : (models?.length > 0) 
            ? <div>Models found:
              {models?.map((mod) => (
                <li key={mod.name} >{mod.name}</li>
              ))} </div> 
            : 'No models found!'} */}
          <hr className="bg-primary m-2" />
          githubLink: {githubLink} <br /> repoText: {repoText} <br />pathText: {pathText} <br /> usernameText: {usernameText}  <br />
          <a href={githubLink} target="_blank" rel="noopener noreferrer"> <strong> Click here to open GitHub</strong></a>
          <p>There you can learn how to upload your Model project.json files. <br />Check the README file for Guidence</p>
        </div>
        </ModalBody>
      </Modal>
    </>
  )
}

export default LoadGitHub;




// import { useState, useEffect } from 'react';
// import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
// import { useDispatch } from 'react-redux'
// import base64 from 'base-64';

// // import  Search  from './Search';
// import TextInput from './utils/TextInput';
// import Select from './utils/Select';
// import { searchRepos, searchModels, searchModel } from './services/githubService';
// import { loadDataModel } from '../actions/actions';

// const debug = false

// const LoadGitHub = (props: any) => {
//   const dispatch = useDispatch();
//   // console.log('11', props)

//   const username = 'SnorreFossland'
//   const url = `https://api.github.com/users/${username}/repos/`
//   const repository = 'akm-models'
//   const path = 'StartupModels'
//   // // const path = 'StartupModels'
//   // // console.log('26 url', url)

//   // const username = 'josmiseth'
//   // const url = `https://api.github.com/users/${username}/repos/`
//   // const repository = 'cumulus-akm-pocc'
//   // const path = 'Cumulus'

//   const [searchText, setSearchText] = useState('');
//   const [urlText, setUrlText] = useState(url);
//   const [pathText, setPathText] = useState(path);
//   const [repoText, setRepoText] = useState(repository);
//   const [repos, setRepos] = useState([]);
//   const [model, setModel] = useState({});
//   const [models, setModels] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(false);
//   const [modal, setModal] = useState(false);

//   const { buttonLabel, className } = props;
//   const toggle = () => setModal(!modal);


//   const onUrlChange = (text) => {
//     setUrlText(text);
//     const timer = setTimeout(() => {
//     loadRepos(text, model);
//     }, 5000);
//   };

//   const onPathChange = (text) => {
//     setPathText(text);
//     // loadRepos(text, model);
//   };


//   const onModelChange = (text) => {
//     const rep = `repos/${username}/${repoText}/contents/${pathText}`;
//     const path = `/${text}`; // add slash
//     loadModel(rep, path);
//     if (debug) console.log('52', rep, path, )
//   }

//   const loadModel = async (rep, path) => {
//     setLoading(true);
//     const searchtext = `${rep}${path}`;
//     const res = await searchModel(searchtext, '')
//     const content = res.data.content
//     if (!debug) console.log('70', base64.decode(content))
//     const model = JSON.parse(base64.decode(content));
//     // const model = JSON.parse(base64.decode(content));
//     if (debug) console.log('72', model)
//     setLoading(false);

//     if (debug) console.log('53 onModelChange', model)
      
//       const data = {
//         phData:   model.phData,
//         phFocus:  model.phFocus,
//         phUser:   model.phUser,
//         phSource: model.phSource,
//       }

//       if (data.phData)    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
//       if (data.phFocus)   dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data.phFocus })
//       if (data.phUser)    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: data.phUser })
//       if (data.phSource)  dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data.phSource })
   
//   }
//   const onRepoChange = (text) => {
//     setRepoText(text);
//     // loadRepos(searchText, model);
//   };

//   const loadRepos = async (repoText, pathText) => {
//     setLoading(true);
//     if (!debug) console.log('76 loadRepos', repoText, pathText)
//     const res = await searchRepos(repoText, model);
//     setLoading(false);
//     setRepos(res.data.items);
//     console.log('94', res.data.items, res)
//     if (debug) console.log('95', urlText, pathText, repoText, res.data, res.data.items, res)
//     // loadModels(repoText, pathText);
//   };

//   const loadModels = async (urlText, pathText) => {
//     setLoading(true);
//     const rep = `repos/${username}/${repoText}/contents/${pathText}`;
//     const path = `${pathText}`
//     if (debug) console.log('72', repoText, path, rep )
//     const res = await searchModels(rep, path);
//     if (debug) console.log('74',  res.data, res)
//     // console.log('58', urlText, pathText, res.data, res.data.items, res)
//     setLoading(false);
//     setModels(res.data);
//   };

//   useEffect(() => {
//     setUrlText(url);
//     setPathText(path);
//     setRepoText(repoText);
//     // const timer = setTimeout(() => {
//       loadRepos(repoText, pathText);
//     // }, 1000);
//     // return () => clearTimeout(timer);
//     // loadModels(repoText, pathText);
//   }, [(modal)]);

//   // useEffect(() => {
//   //   setModels()
//   // }, [models?.length > 0]);


//   const  modeloptionss = 
//      models?.map((mod) => {
//       return {
//         value: mod.name,
//         label: mod.name
//       }
//     })
//     const modeloptions = [{value: '', label: 'Select Model...'}, ...modeloptionss]


//   return  (
//     <>
//       <span><button className="btn btn-success text-white m-0 p-1" onClick={toggle}>{buttonLabel}</button>
//       </span>
//       <Modal isOpen={modal} toggle={toggle} className={className} >
//         <ModalHeader toggle={() => {toggle(); }}>GitHub repo</ModalHeader>
//         <ModalBody className='pt-0'>
//         <div>
//           <TextInput
//             label="Repositories URL (i.e. https/:api.github.com/users/'UserName'/repos/):"
//             value={urlText}
//             onChange={(value) => onUrlChange(value)}
//             placeholder="Repos Url:"
//           />          
//           {loading ? 'Loading...' : (repos.length > 0) 
//             ? <div>Repos found: 
//               {repos.map((repo) => (
//                 <li key={repo.id} >{repo.name}</li>
//               ))} 
//               </div> 
//               : 'No repos found!'}
//             <hr className="bg-primary" />
//           <TextInput
//             label="Repository Name (i.e. akm-start-models):"
//             value={repoText}
//             onChange={(value) => onRepoChange(value)}
//             placeholder="Repo name:"
//           />          
//           {loading ? 'Loading...' : (repos.length > 0) 
//             ? <div>Repo found! 
//               {/* {repos.map((repo) => (
//                 <li key={repo.id} >{repo.name}</li>
//               ))}  */}
//               </div> 
//               : 'No repo found!'}
//           Full url: {url+repoText}
//           <hr className="bg-primary" />
//           <TextInput 
//             label="Model path"
//             value={pathText}
//             onChange={(value) => onPathChange(value)}
//             placeholder="Path to models"
//           />
//             <hr className="bg-primary" />
//           <Button className="btn-primary text-black border-primary w-75 float-right mb-2 pb-0" onClick = {() => loadModels(repoText, pathText)}>Load Models</Button>
//             <div>Models found!</div>
//             <hr className="bg-primary" />

//           <div className="w-100">
//             <Select 
//               label="Select model "
//               value={(models) ? modeloptions[0] : 'no models'}
//               options={(models) ? modeloptions : []}
//               onChange={(value) => onModelChange(value)}
//             />
//           </div>
//           <hr />
//           {loading ? 'Loading...' : (models?.length > 0) 
//             ? <div>Models found:
//               {models?.map((mod) => (
//                 <li key={mod.name} >{mod.name}</li>
//               ))} </div> 
//             : 'No models found!'}

//             {/* {loading ? 'Loading...' : <div>{JSON.stringify(repos, null, 2)}</div>} */}
//         </div>
//         </ModalBody>
//       </Modal>
//     </>
//   )
// }

// export default LoadGitHub;