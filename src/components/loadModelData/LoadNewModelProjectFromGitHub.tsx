import { useState, useEffect, useRef } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'
import base64 from 'base-64';

// import  Search  from './Search';
import TextInput from '../utils/TextInput';
import Select from '../utils/Select';
import { searchRepos, searchBranches, searchModels, searchModel, searchGithub, searchModelRaw } from '../githubServices/githubService';
// import { loadDataModel } from '../../actions/actions';

import { SaveAllToFile } from '../utils/SaveModelToFile';
import GenGojsModel from '../GenGojsModel';

const debug = false

const LoadNewModelProjectFromGitHub = (props: any) => {
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(props.refresh);
  const modalRef = useRef(null);
  // const backdropref = useRef(null);

  if (!debug) console.log('23 LoadNewModel....', props)

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
  const [orgnameText, setOrgnameText] = useState('Kavca');
  const [repoText, setRepoText] = useState('kavca-akm-models');
  const [pathText, setPathText] = useState('akm-startups');
  const [branchText, setBranchText] = useState('main');
  const [repos, setRepos] = useState([]);
  const [model, setModel] = useState({});
  const [models, setModels] = useState([]);
  const [dirs, setDirs] = useState([]);
  const [user, setUser] = useState({});
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

  // useEffect(() => {
  //   setGithubLink(`https://github.com/${orgnameText}/${repoText}/tree/main/${pathText}`)
  //   loadModels(orgnameText, pathText)
  // }, [])

  // const onUsernameChange = (text) => {
  //   if (text?.length > 0) {
  //     if (debug) console.log('50 onUsernameChange', text)
  //     setOrgnameText(text);
  //     // setGithubLink(`http://github.com/${text}/${repoText}`);
  //     // if (debug) console.log('55 onUsernameChange', orgnameText)
  //   }
  // };
  //   const onOrgnameChange = (orgnameText) => {
  //   if (orgnameText?.length > 0) {
  //     if (debug) console.log('50 onOrgChange', orgnameText)
  //     setOrgnameText(orgnameText);
  //     setGithubLink(`http://github.com/${orgnameText}/${repoText}`);
  //     if (debug) console.log('55 onOrgChange', orgnameText)
  //   }
  // };

  // const onRepoChange = (text) => {
  //   (text) ? setRepoText(text): setRepoText('');
  // };

  // const onPathChange = (text) => {
  //   if (text?.length < 2) {
  //     setPathText('');
  //   } else {
  //     setPathText(text);
  //   }
  // };

  const onModelChange = (text) => {
    if (debug) console.log('71 onModelChange', text)
    const rep = `${orgnameText}/${repoText}`;
    const filename = `${text}`; // add slash
    loadModel(rep, filename);
    if (debug) console.log('52', rep, filename, )
    const  refres = () => {
      setRefresh(!refresh)
    }
    setTimeout(refres, 3000);
  }

  // const onBranchChange = (text) => {
  //   if (text?.length > 0) {
  //     setBranchText(text);
  //   }
  // };

  // const loadRepos = async (repoText, pathText) => {
  //   if (orgnameText?.length > 0)  { 
  //     setLoading(true);
  //     if (debug) console.log('129 loadRepos', repoText, pathText, model)
  //     if ((!repoText) || repoText.includes('undefined')) return null;
  //     const res = await searchRepos(repoText, pathText);
  //     const repolist = await res.data.items?.filter(repo => repo.name === repoText);
  //     setLoading(false);
  //     if ((debug)) console.log('133 res.data.items: ', await res.data, repos)
  //     setRepos(await repolist);
  //     // setModels(await res.data.items?.filter(repo => repo.name === repoText));
  //     if (debug) console.log('136', orgnameText, pathText, repoText, res.data.items, repos)
  //     // loadModels(repoText, pathText);
  //   }
  // };

  // todo: loadModel should be loadProject or loadModelProject
  const loadModel = async (rep, filename) => {
    setLoading(true);
    const searchtexttmp = `${rep}`;
    console.log('126 searchtexttmp', rep, repoText, pathText, searchtexttmp, filename, filename)
    const searchtext = searchtexttmp.replace(/\/\//g, '/');
    if (debug) console.log('128 ', searchtext, pathText, filename, branchText, 'file')
    if ((!searchtext) || searchtext.includes('undefined')) return null;
    const res = await searchGithub(searchtext, pathText, filename, branchText, 'file');
    const sha = await res.data.sha;
    if ((debug)) console.log('131 res', res, res.data, sha)

    const content = res.data // this is the project file from github
    if (debug) console.log('138 ', searchtext, res, content)

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


    if (debug) console.log('142 ', content, model)
    setModel(model);
    setLoading(false);
    if (debug) console.log('90 onModelChange', model, props) 

    if (model) {
        const data = {
          phData:   model.phData,
          phFocus:  model.phFocus,
          phUser:   model.phUser,
          // phSource: model.phData.metis.name || model.phSource 
          phSource: `GitHub: ${repoText}/${pathText}/${filename}`,
        }
        if ((debug)) console.log('154', data)
        if (data.phData)    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
        if (data.phFocus)   dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data.phFocus })
        if (data.phUser)    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: data.phUser })
        if (data.phSource)  dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data.phSource })
      // }
      // GenGojsModel(data.phData, dispatch)
    }
  }

  const loadModels = async (orgText, pathText) => {
    setLoading(true);
    if ((debug)) console.log('191  ', orgText, pathText)
    const repos = (pathText !== '' && pathText !== undefined ) ?`repos/${orgText}/${repoText}/contents/${pathText}` : `repos/${orgText}/${repoText}/contents`;
    // const rep = `repos/${username}/${repoText}/contents/${pathText}`;
    if ((debug)) console.log('194  ', orgText, repoText, pathText, 'repos', repos)
    const res = await searchModels(repos, pathText);
    if (debug) console.log('196 ', await res.data)
    setLoading(false);
    const filteredDirs = await res?.data?.filter(model => 
      model.type === 'dir' 
      && model.name !== 'img' 
      && model.name !== 'imgdocs' 
      && model.name !== '.github' 
      && model.name !== '.gitignore');
    const filteredModels = await res?.data?.filter(model => model.name.endsWith('.json'));
    setModels(filteredModels);
    setDirs(filteredDirs);
    if (debug) console.log('207 ', filteredModels, filteredDirs)


    if (pathText === undefined || pathText === '') {
      setGithubLink(`https://github.com/${orgnameText}/${repoText}/tree/${branchText}/`)
    } else {
      setGithubLink(`https://github.com/${orgnameText}/${repoText}/tree/${branchText}/${pathText}`)
    }
    if (debug) console.log('224 ', filteredModels, filteredDirs, githubLink)
    setRefresh(!refresh)
  };

  useEffect(() => {
    if (debug) console.log('230 ', orgnameText, repoText, branchText, pathText,  githubLink);
    // (orgnameText) && loadModels(orgnameText, pathText)
  }, [refresh]);

  // useEffect(() => {
  //   setOrgnameText(props.ph.phFocus?.focusProj?.org)
  //   setRepoText(props.ph.phFocus?.focusProj?.repo)
  //   setPathText(props.ph.phFocus?.focusProj?.path) // !== '') ? props.ph.phFocus?.focusProj?.path : 'models')
  //   setBranchText(props.ph.phFocus?.focusProj?.branch)
  //     if ((debug)) console.log('314 LoadGitHub ', orgnameText, repoText, branchText, pathText);
  //     // (repoText) && loadRepos(repoText, pathText);
  //     // (orgnameText) && loadModels(orgnameText, pathText)
  // }, []);

  let modeloptionss = models?.map((mod) => {
    return {
      value: mod.name,
      label: mod.name
    } 
  }) || [];

  const label = (models?.length > 0) ? ' Select Model - - - ' : ' - - - Click on "LIST MODEL TEMPLATES" above! - - - ' ;
  const modeloptions = [{value: '', label: label}, ...modeloptionss] ;
  // const  modeloptions = (modeloptionss?.length > 1) ? [{value: '', label: 'Select Model...'}, ...modeloptionss] : [{value: '', label: 'No Model to select...'}]
  if (debug) console.log('163 modeloptions', models, modeloptions, modeloptions?.length)

  // console.log('160 githubLink', githubLink)

  function handleSaveAllToFile() {
    const projectname = props.ph.phData.metis.name
    SaveAllToFile(data, projectname, 'Project')
  }

  return  (
    <>
    <button className="btn bg-transparent py-0 my-0 pe-2 ps-1" onClick={toggle}><i className="fab fa-github fa-lg my-0 py-0 me-1 "></i>{buttonLabel}</button>
     <Modal isOpen={modal}  toggle={toggle} className={className}  innerRef={modalRef}  >
        <ModalHeader toggle={() => {toggle(); }}><i className="fab fa-github fa-lg mx-2"></i>GitHub Model Repository</ModalHeader>
        <ModalBody className="pl-1 pt-1 d-fle">
          <div className="bg-secondary" >
            <div className="bg-light square border py-2 border-2 border-success p-1 " ><strong>Download from a list of Model templates:</strong>
              {/* ----Repository user name input------------------------------- */}
              {/* <TextInput label="Repo owner :" value={orgnameText} onChange={(value) => onOrgnameChange(value)} placeholder="Repo Owners Name " />          */}
             {/* {loading ? 'Loading...' : 
                <div>{models.length > 0 ? <div className="text-success"> Models fond </div> : <div className="text-warning"> No repos found </div>}</div>
              } */}
              {/* ----- Searching repos -------------------------------- */}
              {/* <div className="w-100 mt-1 text-secondary"> {githubLink} </div> */}
              {/* <hr className="bg-primary my-1 mx-4" /> */}
              {/* {loading ? 'Loading...' :  <div className="text-success m-1" > {repos.map((repo) => ( <span className="px-1" key={repo.id} > {repo.full_name}, </span> ))}  </div>  } */}

              {/* ----- Repository name input ------------------------------ */}
              {/* <span ><TextInput  label="Repository:" value={repoText} onChange={(value) => onRepoChange(value)} placeholder="Repo name:" /> </span> */}
              {/* <hr className="bg-primary my-2 mx-4" /> */}

              {/* ----- Model Path input ---------------------------------- */}
              {/* {(dirs?.length !== 0) 
                ? <div >Model paths (folders) found: (blank out the Path content and return, to see alternative paths)<span className="text-success m-1"> {dirs?.map((dir) => ( <li className="px-1" key={dir.name} >{dir.name}, </li> ))}</span> </div> 
                : (!pathText) && <div className='text-warning'> 'No model paths (folders) found!'</div>
              }  */}
              {/* <span className=""> <TextInput label="Path:" value={pathText} onChange={(value) => onPathChange(value)} placeholder="Path to models" /> </span>
              <hr className="bg-light my-1 mx-4" /> */}

              {/* -------- Select model ----------------------------------- */}
              <Button className="btn-secondary bg-secondary text-white border-dark  mt-2 mb-2 pb- w-100" 
                onClick = {() => loadModels(orgnameText, pathText)}
              ><i className="fab fa-github fa-lg me-2"></i>List Model Templates
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
                  title="Click here when done!" onClick={() => {toggle(); }}>Done
                </Button>
              </span>

            <hr className="bg-secondary py-0 my-1 mx-4" />
          </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  )
}

export default LoadNewModelProjectFromGitHub;

