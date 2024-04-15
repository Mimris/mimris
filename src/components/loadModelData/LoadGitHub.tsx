import { useState, useEffect, useRef } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'
// import base64 from 'base-64';

// import  Search  from './Search';
import TextInput from '../utils/TextInput';
import Select from '../utils/Select';
import { searchRepos, searchBranches, searchModels, searchModel, searchGithub, searchModelRaw } from '../githubServices/githubService';
// import { loadDataModel } from '../../actions/actions';

import { SaveAllToFile } from '../utils/SaveModelToFile';
// import { load } from 'cheerio';

const debug = false

const LoadGitHub = (props: any) => {
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(true);
  const modalRef = useRef(null);
  const backdropref = useRef(null);
  if(debug) console.log('11 LoadGithub', props)

  // const username = 'kavca'
  // const url = `https://api.github.com/users/${username}/repos/`
  // const repository = 'akm-models'
  // const path = 'models'
  // const username = 'josmiseth'
  // const url = `https://api.github.com/users/${username}/repos/`
  // const repository = 'cumulus-akm-pocc'
  // const path = 'Cumulus'

  let phFocus = props.ph.phFocus;
  let phData = props.ph.phData
  let phUser = props.ph.phUser
  let phSource = props.ph.phSource

  const [githubLink, setGithubLink] = useState('http://github.com/');
  
  // const [searchText, setSearchText] = useState('');
  // const [usernameText, setUsernameText] = useState('Kavca');
  const [orgText, setOrgText] = useState(props.ph.phFocus?.focusProj?.org);
  const [repoText, setRepoText] = useState(props.ph.phFocus?.focusProj?.repo);
  const [pathText, setPathText] = useState(props.ph.phFocus?.focusProj?.path);
  const [branchText, setBranchText] = useState(props.ph.phFocus?.focusProj?.branch);
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

  // if (props.path !== '') setPathText(props.path);

  const data = {
    phData:   props.ph.phData,
    phFocus:  props.ph.phFocus,
    phUser:   props.ph.phUser,
    // phSource: props.phSource,
    phSource: (phSource === "") && phData.metis.name  || phSource,
    lastUpdate: new Date().toISOString()
  }

  const onOrgChange = (orgText) => {
    if (orgText?.length > 0) {
      if (debug) console.log('50 onOrgChange', orgText)
      setOrgText(orgText);
      setGithubLink(`http://github.com/${orgText}/${repoText}`);
      if (debug) console.log('55 onOrgChange', orgText)
    }
  };

  const onRepoChange = (text) => {
    (text) ? setRepoText(text): setRepoText('');
  };
  
  const onPathChange = (text) => {
    (text) ? setPathText(text) : setPathText('models');  
  };

  const onBranchChange = (text) => {
    (text) ? setBranchText(text) : setBranchText('');  
  }

  const onModelChange = (text) => {
    if (debug) console.log('71 onModelChange', text)
    const rep = `${orgText}/${repoText}`;
    const filename = `${text}`; // add slash
    loadModel(rep, filename);
    if (debug) console.log('52', rep, filename, )
    const  refres = () => {
      setRefresh(!refresh)
    }
    setTimeout(refres, 3000);
  }

  // const loadRepos = async (repoText, pathText) => {
  //   if (orgText?.length > 0)  { 
  //     setLoading(true);
  //     if (debug) console.log('76 loadRepos', repoText, pathText, model)
  //     if ((!repoText) || repoText.includes('undefined')) return null;
  //     const res = await searchRepos(repoText, pathText);
  //     const repolist = await res.data.items?.filter(repo => repo.name === repoText);
  //     setLoading(false);
  //     if (debug) console.log('123 res.data.items: ', await res.data.items, repos)
  //     setRepos(await repolist);
  //     // setModels(await res.data.items?.filter(repo => repo.name === repoText));
  //     if (debug) console.log('126', orgText, pathText, repoText, res.data.items, repos)
  //     // loadModels(repoText, pathText);
  //   }
  // };

  // todo: loadModel should be loadProject or loadModelProject
  const loadModel = async (rep, filename) => {
    setLoading(true);
    const searchtexttmp = `${rep}`;
    console.log('135 searchtexttmp', rep, repoText, pathText, searchtexttmp, filename, filename)
    const searchtext = searchtexttmp.replace(/\/\//g, '/');
    if (debug) console.log('128 ', searchtext, pathText, filename, branchText, 'file')
    if (searchtext.includes('undefined')) return null;
    const res = await searchGithub(searchtext, pathText, filename, branchText, 'file');
    const sha = await res.data.sha;
    if (debug) console.log('140 res', res, res.data, sha)

    const content = res.data // this is the project file from github
    if (debug) console.log('143 ', searchtext, res, content)

    const model = content // the content from github

    // const model = { // take model from content and split repository into organisation and repository ad insert into phData
    //   ...content,
    //   phData: {
    //     ...content.phData,
    //     organisation: rep.split('/')[0],
    //     repository: rep.split('/')[1],
    //     path: pathText,
    //   }
    // }

    if (debug) console.log('157 ', content, model)
    setModel(model);
    setLoading(false);
    if (debug) console.log('160 onModelChange', model, props) 

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
      } else if (filename.includes('_MO.json')) { // Todo: check if it is only model  
        const newmodel = model; // model is a metamodel
        let  newmindex = props.ph.phData?.metis?.models?.findIndex(m => m.id === newmodel?.id) // current mmodel index
        const newmlength = props.ph.phData?.metis?.models.length
        if ( newmindex < 0) { newmindex = newmlength } // ovindex = -1, i.e.  not fond, which means adding a new mmodel
        const data = {
          phData: {
              ...props.ph.phData,
              metis: {
                  ...props.ph.phData.metis,
                  metamodels: props.ph.phData.metis.metamodels,   
                  models: [
                      ...props.ph.phData.metis.metamodels.slice(0, newmindex),  
                      // oldmodel,
                      newmodel,
                      ...props.ph.phData.metis.models.slice(newmindex + 1, props.ph.phData.metis.models.length),
                  ],
              },
          }, 
        };
        if (debug) console.log('166 ', data)
        if (data.phData)    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
      } else {// it is a Project file
        const data = {
          phData: {
              ...model.phData,
              metis: {
                  ...model.phData.metis,
                  name: model.phData.metis.name,
                  description: model.phData.metis.description,
              },
          },
          phFocus:  {
            ...model.phFocus,
            focusProj: {
              ...model.phFocus.focusProj,
              org: orgText,
              repo: repoText,
              path: pathText,
              branch: branchText,
              username: orgText,
              filename: filename,
              // sha: sha,
            }
          },
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
    const repos = (pathText !== '' && pathText !== undefined ) ?`repos/${usernameText}/${repoText}/contents/${pathText}` : `repos/${usernameText}/${repoText}/contents`;
    // const rep = `repos/${username}/${repoText}/contents/${pathText}`;
    if (debug) console.log('131  u', usernameText, 'r', repoText,'p', pathText,'repos', repos)
    if (repos.includes('undefined')) return null;
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
    setModels(filteredModels);
    setDirs(filteredDirs);
    if (debug) console.log('218 ', filteredModels, filteredDirs)


    if (pathText === undefined || pathText === '') {
      setGithubLink(`https://github.com/${orgText}/${repoText}/tree/${branchText}/`)
    } else {
      setGithubLink(`https://github.com/${orgText}/${repoText}/tree/${branchText}/${pathText}`)
    }
    if (debug) console.log('224 ', filteredModels, filteredDirs, githubLink)
    setRefresh(!refresh)
  };

  // useEffect(() => {
  //   function handleClickOutside(event: any) {
  //     if (modalRef.current && !modalRef.current.contains(event.target) && backdropref) {
  //       toggle();
  //     } 
  //     if (backdropref || !modalRef) {
  //       toggle();
  //     }
  //   }
  //   window.addEventListener('click', handleClickOutside);
  //   return () => {
  //     window.removeEventListener('click', handleClickOutside);
  //     toggle();
  //   };
  // }, [toggle]);

  // useEffect(() => {
  //   setGithubLink(`https://github.com/${orgText}/${repoText}/tree/main/${pathText}`)
  //   loadModels(orgText, pathText)
  //   console.log('70 useEffect 1', orgText, repoText, branchText, pathText,  githubLink, model)
  // }, []);

  useEffect(() => {
    setOrgText(props.ph.phFocus?.focusProj?.org)
    setRepoText(props.ph.phFocus?.focusProj?.repo)
    if (pathText === undefined || pathText === '') {
      setPathText('/')
    } else {
      setPathText(props.ph.phFocus?.focusProj?.path) // !== '') ? props.ph.phFocus?.focusProj?.path : 'models')
    } 
    setBranchText(props.ph.phFocus?.focusProj?.branch)
    // setUsernameText(props.ph.phFocus?.focusProj?.username)
    // const orgText = props.ph.phFocus?.focusProj?.org
    // const repoText = props.ph.phFocus?.focusProj?.repo
    // const pathText = props.ph.phFocus?.focusProj?.path
    // const branchText = props.ph.phFocus?.focusProj?.branch
    // const refres = () => {
      if (debug) console.log('314 LoadGitHub ', orgText, repoText, branchText, pathText)
    // if (false)

    // if (pathText === undefined || pathText === '') {
    //   setGithubLink(`https://github.com/${orgText}/${repoText}/tree/${branchText}/`)
    // } else {
    //   setGithubLink(`https://github.com/${orgText}/${repoText}/tree/${branchText}/${pathText}`)
    // }
    // const timer = setTimeout(() => {
      // this is loading to often when testing and we run out of requests available on github
      // loadRepos(repoText, pathText);
      // loadModels(orgText, pathText)
    // }, 60000);
    // return () => clearTimeout(timer);
  }, []);


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
    SaveAllToFile(data, projectname, '_PR')
  }

  return  (
    <>
      <button className="btn bg-transparent py-0 my-0 pe-2 ps-1" onClick={toggle}><i className="fab fa-github fa-lg my-0 py-0 me-1 "></i>{buttonLabel}</button>
      <Modal isOpen={modal}  toggle={toggle} className={className}  innerRef={modalRef}  backdropref={backdropref} style={{zIndex: "9999"}}>
        <ModalHeader toggle={() => {toggle(); }}><i className="fab fa-github fa-lg mx-2"></i>GitHub Model Repository</ModalHeader>
        <ModalBody className="p-1">
          <div className="bg-light" > 
            <div className="bg-light square border py-2 border-2 border-success p-2 " ><strong>Download from a list of Models:</strong>
              <div className="d-flex w-100">
                {/* ----Repository user name input------------------------------- */}
                  <TextInput label="Repo owner :" value={orgText} onChange={(value) => onOrgChange(value)} placeholder="Repo Owners Name " />         
                {/* {loading ? 'Loading...' : 
                  <div>{models.length > 0 ? <div className="text-success"> Models fond </div> : <div className="text-warning"> No repos found </div>}</div>
                } */}
                {/* ----- Searching repos -------------------------------- */}
                {/* <div className="w-100 mt-1 text-secondary"> {githubLink} </div> */}
                {/* <hr className="bg-primary my-1 mx-4" /> */}
                {/* ----- Repository name input ------------------------------ */}
                <span >
                  {(props.path !== '')
                    ? <TextInput  label="Repository :" value={'kavca-akm-models'} onChange={(value) => onRepoChange(value)} placeholder="Repo name " /> 
                    : <TextInput  label="Repository :" value={repoText} onChange={(value) => onRepoChange(value)} placeholder="Repo name " /> 
                  }
                </span>
                <hr className="bg-primary my-2 mx-4" />
                {/* ----- Model Path input ---------------------------------- */}
                {/* <hr className="bg-secondary my-1 mx-4" /> */}
                <span style={{maxWidth: "180px"}}>
                  {(props.path !== '') ?  
                    <TextInput label="Path :" value={props.path} onChange={(value) => onPathChange(value)} placeholder="Path to models " /> 
                    : <TextInput label="Path :" value={pathText} onChange={(value) => onPathChange(value)} placeholder="Path to models " /> 
                  }
                </span>
                {(dirs?.length !== 0) 
                  ? <div>Model paths (folders) found:<span className="text-success m-1"> {dirs?.map((dir) => ( <li className="px-1" key={dir.name} >{dir.name}, </li> ))}</span> </div> 
                  : (!pathText) && <div className='text-warning min-vh-500'> 'No model paths (folders) found!'</div>
                } 
              </div>
                {/* {loading ? 'Loading...' :  <div className="text-success my-2 " > {repos.map((repo) => ( <span className="text-nowrap" key={repo.id} > {repo.full_name}/{pathText} </span> ))}  </div>  } */}
              {/* -------- Select model ----------------------------------- */}
              <Button className="btn-secondary bg-secondary text-white border-dark mt-2 mb-2 pb- w-100" 
                onClick = {() => loadModels(orgText, pathText)}
              ><i className="fab fa-github fa-lg me-2"></i>List Models
              </Button>
              {(models?.length > 0) 
                ? <div className="" >Models found:<span className="text-success m-1 ">{models?.map((mod) => ( <li className="px-2" key={mod.name} >{ mod.name },   </li>))} </span></div> 
                : <div className='text-warning'> 'No models found!'</div>
              } 
              <hr className="bg-primary px-10 my-1 mx-4" />
              <label className=" d-inline-flex justify-content-left"> 
                <Select label=" Select model : " value={(modeloptions) ? modeloptions[0] : 'no models'} options={(modeloptions) ? modeloptions : []} onChange={(value) => onModelChange(value)} />
              </label>
                <span className="p-5">
                  <Button className="btn-primary modal--footer mr-4 py-0 ml-5 pl-5 float-end " color="primary" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
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
            <hr className="bg-secondary py-0 my-1 mx-4" />
            <div className="bg-light square border border-2 border-primary p-2"><strong>Upload model files:</strong> <br />
              <div className="bg-light square border border-2 border-primary p-2"><strong>First save the project.json file:</strong>  
                <button 
                  className="btn-primary modal--footer ms-4 mr-2 py-0 px-1 float-end " color="primary" 
                  data-toggle="tooltip" data-placement="top" data-bs-html="true" 
                  title="Click here to Save the Project&#013; to file &#013;(Default in Downloads folder)"
                  onClick={handleSaveAllToFile}>Save
                </button >
                <hr className="bg-secondary py-0 my-1 mx-0" />
                 <a href={githubLink} target="_blank" rel="noopener noreferrer"><strong className='text-primary'> Click here to open GitHub to upload the saved file to GitHub </strong></a> <br />
                 In GitHub: <strong>Click "Add file" in upper right corner and then "Upload files" and select the file to upload.</strong>  
                 <br /> NB! Existing files must be uploaded with the same name. If necessary: Rename the file before uploading.
 
              </div>
                {/* <a href={githubLink} target="_blank" rel="noopener noreferrer"><strong className='text-primary'> Click here to open GitHub </strong></a> (RepoOwner, Repository and Path must be filled in)<br />(On GitHub: Check the README file for Guidance)
                <div className=" text-secondary">{githubLink} </div> */}
              </div>
            <hr className="bg-primary my-1 mx-0" />
          </div>
        </ModalBody>
      </Modal>
    </>
  )
}

export default LoadGitHub;

