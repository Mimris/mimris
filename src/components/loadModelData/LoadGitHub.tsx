import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'
import base64 from 'base-64';

// import  Search  from './Search';
import TextInput from '../utils/TextInput';
import Select from '../utils/Select';
import { searchRepos, searchBranches, searchModels, searchModel, searchGithub, searchModelRaw } from '../githubServices/githubService';
// import { loadDataModel } from '../../actions/actions';

import { SaveAllToFile } from '../utils/SaveModelToFile';

const debug = false

const LoadGitHub = (props: any) => {
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(true);
  // console.log('11', props)

  // const username = 'kavca'
  // const url = `https://api.github.com/users/${username}/repos/`
  // const repository = 'akm-models'
  // const path = 'models'


  // const username = 'josmiseth'
  // const url = `https://api.github.com/users/${username}/repos/`
  // const repository = 'cumulus-akm-pocc'
  // const path = 'Cumulus'

  let phFocus = props.phFocus;
  let phData = props.phData
  let phUser = props.phUser
  let phSource = props.phSource

  const [githubLink, setGithubLink] = useState('http://github.com/');
  
  // const [searchText, setSearchText] = useState('');
  const [usernameText, setUsernameText] = useState('Kavca');
  const [repoText, setRepoText] = useState('kavca-akm-models');
  const [pathText, setPathText] = useState('models');
  const [branchText, setBranchText] = useState('main');
  const [repos, setRepos] = useState([]);
  const [model, setModel] = useState({});
  const [models, setModels] = useState([]);
  const [dirs, setDirs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState(false);

  const { buttonLabel, className } = props;
  const toggle = () => setModal(!modal);
  function toggleRefresh() { setRefresh(!refresh); }

  const data = {
    phData:   props.ph.phData,
    phFocus:  props.ph.phFocus,
    phUser:   props.ph.phUser,
    // phSource: props.phSource,
    phSource: (phSource === "") && phData.metis.name  || phSource,
    lastUpdate: new Date().toISOString()
  }

  useEffect(() => {
    setGithubLink(`https://github.com/${usernameText}/${repoText}/tree/main/${pathText}`)
  }, [])

  const onUsernameChange = (text) => {
    if (text?.length > 0) {
      if (debug) console.log('50 onUsernameChange', text)
      setUsernameText(text);
      setGithubLink(`http://github.com/${text}/${repoText}`);
      if (debug) console.log('55 onUsernameChange', usernameText)
    }
  };

  const onRepoChange = (text) => {
    (text) ? setRepoText(text): setRepoText('');
  };
  

  const onPathChange = (text) => {
    if (text?.length < 2) {
      setPathText('');
    } else {
      setPathText(text);
    }
  };

  const onModelChange = (text) => {
    if (debug) console.log('71 onModelChange', text)
    const rep = `${usernameText}/${repoText}`;
    // const rep = `repos/${usernameText}/${repoText}/contents/${pathText}`;
    const filename = `${text}`; // add slash

    loadModel(rep, filename);

    if (debug) console.log('52', rep, filename, )
    const  refres = () => {
      setRefresh(!refresh)
    }
    setTimeout(refres, 3000);
  }

  const loadRepos = async (repoText, pathText) => {
    if (usernameText?.length > 0)  { 
      setLoading(true);
      if (debug) console.log('76 loadRepos', repoText, pathText, model)
      const res = await searchRepos(repoText, pathText);
      const repolist = await res.data.items?.filter(repo => repo.name === repoText);
      setLoading(false);
      if (debug) console.log('118 res.data.items: ', await res.data.items, repos)
      setRepos(await repolist);
      // setModels(await res.data.items?.filter(repo => repo.name === repoText));
      if (debug) console.log('122', usernameText, pathText, repoText, res.data.items, repos)
      // loadModels(repoText, pathText);
    }
  };

  // todo: loadModel should be loadProject or loadModelProject
  const loadModel = async (rep, filename) => {
    setLoading(true);
    const searchtexttmp = `${rep}`;
    console.log('126 searchtexttmp', rep, repoText, pathText, searchtexttmp, filename, filename)
    const searchtext = searchtexttmp.replace(/\/\//g, '/');
    if (debug) console.log('128 ', searchtext, pathText, filename, branchText, 'file')
    const res = await searchGithub(searchtext, pathText, filename, branchText, 'file');
    const sha = await res.data.sha;
    if (!debug) console.log('131 res', res, res.data, sha)
    // const res2 = await searchGithub(searchtext, pathText, sha, branchText, 'fileSHA');
    // const content = res.data.content
    // if (debug) console.log('113 res', res2, res2.data)
    // if (debug) console.log('139 ', base64.decode(content))
    // const model = JSON.parse(base64.decode(content));

    const content = res.data
    if (!debug) console.log('138 ', searchtext, res, content)
    const model = {
      ...content,
      phData: {
        ...content.phData,
        organisation: rep.split('/')[0],
        repository: rep.split('/')[1],
        path: pathText,
      }
    }
  

    if (debug) console.log('142 ', content, model)
    setModel(model);
    setLoading(false);
    if (debug) console.log('90 onModelChange', model, props) 
    if (model) {
      if (filename.includes('_MM.json')) { // Todo: check if it is only metamodel and not just a namecheck : Metamodel and will be loaded into current project
        const mmodel = model; // model is a metamodel
        let  mmindex = props.ph.phData?.metis?.metamodels?.findIndex(m => m.id === mmodel?.id) // current mmodel index
        // import metamodel into current project, but first rename the current if it has the same id
        // let oldmodel;
        // if ( mmindex !== -1) { //  found
        //   const tmpmodel = props.ph.phData?.metis?.metamodels[mmindex]
        //   oldmodel = {
        //     ...tmpmodel,
        //     id: tmpmodel.id+'_old',
        //     name: tmpmodel.name+'_old',
        //   }    
        // }
        const mmlength = props.ph.phData?.metis?.metamodels.length
        if ( mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new mmodel
        const data = {
          phData: {
              ...props.ph.phData,
              metis: {
                  ...props.ph.phData.metis,
                  metamodels: [
                      ...props.ph.phData.metis.metamodels.slice(0, mmindex),  
                      // oldmodel,
                      mmodel,
                      ...props.ph.phData.metis.metamodels.slice(mmindex + 1, props.ph.phData.metis.metamodels.length),
                  ],
                  models: props.ph.phData.metis.models,   
              },
          }, 
        };
        if (debug) console.log('166 ', data)
        if (data.phData)    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
      } else { // it is a Model and will be loaded into current project
        const data = {
          phData:   model.phData,
          phFocus:  model.phFocus,
          phUser:   model.phUser,
          // phSource: model.phData.metis.name || model.phSource 
          phSource: `GitHub: ${repoText}/${pathText}/${filename}`,
        }
        if (debug) console.log('154', data)
        if (data.phData)    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
        if (data.phFocus)   dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data.phFocus })
        if (data.phUser)    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: data.phUser })
        if (data.phSource)  dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data.phSource })
      }
    }
  }

  const loadModels = async (usernameText, pathText) => {
    setLoading(true);
    const repos = (pathText !== '') ?`repos/${usernameText}/${repoText}/contents/${pathText}` : `repos/${usernameText}/${repoText}/contents`;
    // const rep = `repos/${username}/${repoText}/contents/${pathText}`;
    if (debug) console.log('131  u', usernameText, 'r', repoText,'p', pathText,'repos', repos)
    const res = await searchModels(repos, pathText);
    if (debug) console.log('133 ', await res.data)
    setLoading(false);
    const filteredDirs = await res.data?.filter(model => 
      model.type === 'dir' 
      && model.name !== 'img' 
      && model.name !== 'imgdocs' 
      && model.name !== '.github' 
      && model.name !== '.gitignore');
    const filteredModels = await res.data?.filter(model => model.name.endsWith('.json'));
    if (debug) console.log('136 ', filteredModels)
    setModels(filteredModels);
    setDirs(filteredDirs);
    setGithubLink(`https://github.com/${usernameText}/${repoText}/tree/${branchText}/${pathText}`)
    setRefresh(!refresh)
  };

  useEffect(() => {
    // setBranchText('')
    if (usernameText?.length > 0) {
      loadRepos(repoText, pathText);
    }
  }, [(modal)]);

  useEffect(() => {
    setModels([]);
    setDirs([]);
    setGithubLink(`https://github.com/${usernameText}/${repoText}/tree/${branchText}/${pathText}`)
  }, [usernameText, repoText, pathText]);

  useEffect(() => {
    if (debug) console.log('170 useEffect 3', model)
    const  refres = () => {
      setRefresh(!refresh)
    }
    setTimeout(refres, 3000);
  } , [model]);

  let modeloptionss = models?.map((mod) => {
    return {
      value: mod.name,
      label: mod.name
    } 
  });

  const label = (models.length > 0) ? ' Select Model - - - ' : ' - - - Click on "LIST MODELS" above! - - - ' ;
  const  modeloptions = [{value: '', label: label}, ...modeloptionss] ;
  // const  modeloptions = (modeloptionss?.length > 1) ? [{value: '', label: 'Select Model...'}, ...modeloptionss] : [{value: '', label: 'No Model to select...'}]
  if (debug) console.log('163 modeloptions', models, modeloptions, modeloptions?.length)

  // console.log('160 githubLink', githubLink)

  function handleSaveAllToFile() {
    const projectname = props.ph.phData.metis.name
    SaveAllToFile(data, projectname, 'Project')
  }


  return  (
    <>
      <span><button className="btn " onClick={toggle}>{buttonLabel}</button> </span>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => {toggle(); }}>GitHub Model Repository</ModalHeader>
        <ModalBody className="pl-1 pt-1 ">
        <div className="bg-light" >
            
          <div className="bg-light square border border-2 border-success p-1" ><strong>Download from a list of Models:</strong>

            {/* ----Repository user name input------------------------------- */}
            <TextInput label="RepoOwner:" value={usernameText} onChange={(value) => onUsernameChange(value)} placeholder="Repos UserName:" />         
            {/* {loading ? 'Loading...' : 
              <div>{models.length > 0 ? <div className="text-success"> Models fond </div> : <div className="text-warning"> No repos found </div>}</div>
            } */}
            {/* ----- Searching repos -------------------------------- */}
            {/* <div className="w-100 mt-1 text-secondary"> {githubLink} </div> */}
            <hr className="bg-primary my-1 mx-4" />
            {loading ? 'Loading...' :  <div className="text-success m-1" > {repos.map((repo) => ( <span className="px-1" key={repo.id} > {repo.full_name}, </span> ))}  </div>  }

            {/* ----- Repository name input ----------------------------------- */}
            <span className=""><TextInput label="Repository:" value={repoText} onChange={(value) => onRepoChange(value)} placeholder="Repo name:" /> </span>
            <hr className="bg-primary my-2 mx-4" />

            {/* ----- Model Path input ------------------------------------ */}
            {(dirs?.length > 0) 
              ? <div >Model paths (folders) found: <span className="text-success m-1"> {dirs?.map((dir) => ( <span className="px-1" key={dir.name} >{dir.name}, </span> ))}</span> </div> 
              : (!pathText) && <div className='text-warning'> 'No model paths (folders) found!'</div>
            } 
            <span className=""> <TextInput label="Path:" value={pathText} onChange={(value) => onPathChange(value)} placeholder="Path to models" /> </span>
            <hr className="bg-light my-1 mx-4" />

            {/* -------- Select model ------------------------------------ */}
            <Button className="btn-primary text-white border-success w-100 float-right mt-2 mb-2 pb-0" onClick = {() => loadModels(usernameText, pathText)}>List Models</Button>
            {(models?.length > 0) 
              ? <div >Models found: <span className="text-success m-1">{models?.map((mod) => ( <span className="px-1" key={mod.name} >{mod.name}, </span>))} </span></div> 
              : <div className='text-warning'> 'No models found!'</div>
            } 
            <hr className="bg-primary px-10 my-1 mx-4" />
            <label className="w-70 d-inline-flex justify-content-left"> 
              <Select label=" Select model : " value={(modeloptions) ? modeloptions[0] : 'no models'} options={(modeloptions) ? modeloptions : []} onChange={(value) => onModelChange(value)} />
            </label>
              <span className="p-5">
                <Button className="btn-primary modal--footer mr-4 py-0 ml-5 pl-5 float-right " color="primary" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
                title="Click here when done!" onClick={() => {toggle(); toggleRefresh()}}>Done
              </Button>
            </span>
            {/* -------------------------------------------------------- */}
  
            {/* <hr /> */}
            {/* {loading ? 'Loading...' : (models?.length > 0) 
              ? <div>Models found:
                {models?.map((mod) => (
                  <li key={mod.name} >{mod.name}</li>
                ))} </div> 
              : 'No models found!'} */}

            </div>

             {/* <hr className="bg-primary m-2" />
             {/* ----- Branch input default main ------------------------------------ */}
             
             {/* <div className="square border border-2 border-white p-1"><strong>Download a patch:</strong> (RepoOwner, Repository and Path must be filled in above)<br />
              <Button className="w-100" onClick={() => loadBranch(repoText, branchText)}> <TextInput label="Download  " value={branchText} onChange={(value) => setBranchText(value)} placeholder="Branch" /> </Button>
             </div> */}
          <hr className="bg-secondary py-1 my-1 mx-4" />
          <div className="bg-light square border border-2 border-primary p-2"><strong>Upload model files:</strong> <br />
            <div className="bg-light square border border-2 border-primary p-2"><strong>First save the project.json file:</strong> (It will be saved to Download folder)
              <button 
                className="btn-primary modal--footer mr-2 py-0 px-1 float-right" 
                data-toggle="tooltip" data-placement="top" data-bs-html="true" 
                title="Click here to Save the Project&#013;(all models and metamodels) to file &#013;(in Downloads folder)"
                onClick={handleSaveAllToFile}>Save
              </button >
              <br /> NB! The file must have the same name as on GitHub.<br /> Rename the file before uploading if necessary.
            </div>
              <a href={githubLink} target="_blank" rel="noopener noreferrer"><strong className='text-primary'> Click here to open GitHub </strong></a> (RepoOwner, Repository and Path must be filled in)<br />(On GitHub: Check the README file for Guidance)
              <div className=" text-secondary">{githubLink} </div>
            </div>
          <hr className="bg-primary my-1 mx-0" />
        </div>
        </ModalBody>
      </Modal>
    </>
  )
}

export default LoadGitHub;

