import { useState, useEffect, useRef } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux';
import axios from 'axios';
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
  if (debug) console.log('11 LoadGithub', props)

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

  const [projFile, setProjFile] = useState({});
  const [projFiles, setProjFiles] = useState([]);

  // const [searchText, setSearchText] = useState('');
  // const [usernameText, setUsernameText] = useState('Kavca');
  const [orgText, setOrgText] = useState(props.ph.phFocus?.focusProj?.org);
  const [repoText, setRepoText] = useState(props.ph.phFocus?.focusProj?.repo);
  const [pathText, setPathText] = useState(props.ph.phFocus?.focusProj?.path);
  const [branchText, setBranchText] = useState(props.ph.phFocus?.focusProj?.branch);
  const [repos, setRepos] = useState([]);
  const [model, setModel] = useState({});
  const [models, setModels] = useState<{ phData: any, phFocus: any, phUser: any, phSource: any }[]>([]);
  const [dirs, setDirs] = useState<{ length: number; name: string }[]>([]);


  // Rest of the code remains unchanged
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState(false);

  const { buttonLabel, className } = props;
  const toggle = () => setModal(!modal);
  function toggleRefresh() { setRefresh(!refresh); }

  // if (props.ph.path !== '') setPathText(props.ph.path);

  const data = {
    phData: props.ph.phData,
    phFocus: props.ph.phFocus,
    phUser: props.ph.phUser,
    // phSource: propsSource,
    phSource: (phSource === "") && phData.metis.name || phSource,
    lastUpdate: new Date().toISOString()
  }

  const onOrgChange = (orgText: string) => {
    if (orgText?.length > 0) {
      if (debug) console.log('50 onOrgChange', orgText)
      setOrgText(orgText);
      setGithubLink(`http://github.com/${orgText}/${repoText}`);
      if (debug) console.log('55 onOrgChange', orgText)
    }
  };

  const onRepoChange = (text: string) => {
    (text) ? setRepoText(text) : setRepoText('');
  };

  const onPathChange = (text: string) => {
    (text) ? setPathText(text) : setPathText('models');
  };

  const onBranchChange = (text: string) => {
    (text) ? setBranchText(text) : setBranchText('');
  }

  const onModelChange = (text: string) => {
    if (debug) console.log('71 onModelChange', text)
    const rep = `${orgText}/${repoText}`;
    const filename = `${text}`; // add slash
    loadModel(rep, filename);
    if (debug) console.log('52', rep, filename,)
    const refres = () => {
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
  const loadModel = async (rep: string, filename: string) => {
    let impProjFile = null;
    setLoading(true);

    try { 
      if (debug) console.log('133 LoadGitHub', rep, repoText, pathText, filename);
      if (debug) console.log('128', pathText, filename, branchText, 'file');
      let url = `https://raw.githubusercontent.com/${rep}/${branchText}/${pathText}/${filename}`;
      if (pathText ===  '/') {
        url = `https://raw.githubusercontent.com/${rep}/${branchText}/${filename}`; // this is the project file
      } 
      const res = await axios.get(url);
      if (res?.data?.content) {
        // const sha = res?.data?.sha;
        if (debug) console.log('140 res', res, res.data);
        const content = res.data.content; // this is the project file from github
        if (debug) console.log('143', res, content);
        const decodedContent = atob(content); // decode Base64 to string
        impProjFile = JSON.parse(decodedContent); // parse the decoded content as JSON
        if (debug) console.log('146', impProjFile, content, decodedContent);
      } else {
        if (debug) console.log('149', res);
        impProjFile = res?.data;
      }
    } catch (error) {
      console.error('Error loading impProjFile:', error);
    } finally {
      setLoading(false);
    }


    // const model = { // take model from content and split repository into organisation and repository ad insert into phData
    //   ...content,
    //   phData: {
    //     ...content.phData,
    //     organisation: rep.split('/')[0],
    //     repository: rep.split('/')[1],
    //     path: pathText,
    //   }
    // }

    setModel(impProjFile);
    setLoading(false);
    if (debug) console.log('160 onModelChange', impProjFile, props)

    if (impProjFile != null) {
      if (filename.includes('_MM.json')) { // Todo: check if it is only metamodel and not just a namecheck : Metamodel and will be loaded into current project
        const mmodel = projFile as { id: string }; // Add type assertion to specify that mprojFile is of type { id: string }
        let mmindex = props.ph.phData?.metis?.metamodels?.findIndex((mm: { id: string }) => (mmodel != null) && mm.id === mmodel?.id) // current mmodel index
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
        if (mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new mmodel
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
        if (data.phData) dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
      } else if (filename.includes('_MO.json')) { // Todo: check if it is only model  
        const newmodel = projFile as { id: string };; // model is a metamodel
        let newmindex = props.ph.phData?.metis?.models?.findIndex((m: any) => (newmodel != null) && (m as { id: string }).id === newmodel?.id) // current mmodel index
        const newmlength = props.ph.phData?.metis?.models.length
        if (newmindex < 0) { newmindex = newmlength } // ovindex = -1, i.e.  not fond, which means adding a new mmodel
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
        if (debug) console.log('226 ', data)
        if (data.phData) dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
      } else {// it is a Project file
        const data = {
          phData: {
            ...impProjFile.phData,
            metis: {
              ...impProjFile.phData.metis,
              name: impProjFile.phData.metis.name,
              description: impProjFile.phData.metis.description,
            },
          },
          phFocus: {
            ...impProjFile.phFocus,
            focusProj: {
              ...impProjFile.phFocus.focusProj,
              org: orgText,
              repo: repoText,
              path: pathText,
              branch: branchText,
              username: orgText,
              filename: filename,
              // sha: sha,
            }
          },
          phUser: impProjFile.phUser,
          phSource: impProjFile.phData.metis.name || impProjFile.phSource
          // phSource: `GitHub: ${repoText}/${pathText}/${filename}`,
        }
        if (!debug) console.log('255', data)
        if (data.phData) dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
        if (data.phFocus) dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data.phFocus })
        if (data.phUser) dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: data.phUser })
        if (data.phSource) dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data.phSource })
      }
    }
  }

  const loadModels = async (usernameText: string, pathText: string) => {
    setLoading(true);
    const repos = (pathText !== '' && pathText !== undefined) ? `repos/${usernameText}/${repoText}/contents/${pathText}` : `repos/${usernameText}/${repoText}/contents`;
    // const rep = `repos/${username}/${repoText}/contents/${pathText}`;
    if (debug) console.log('268  u', usernameText, 'r', repoText, 'p', pathText, 'repos', repos)
    if (repos.includes('undefined')) return null;
    const reposclean = repos.replace(/\/\//g, '/');

    const res = await searchModels(reposclean, pathText);
    const filteredModels = await res?.data?.filter((model: any) => model.name.endsWith('.json'));
    if (debug) console.log('256 ', reposclean, res, filteredModels)
    let filteredDirs: any[] = []; // Declare filteredDirs variable
    if (res?.data) {
      filteredDirs = res.data.filter((model: any) => model.type === 'dir');
    }
    if (debug) console.log('261 ', filteredModels, filteredDirs)
    setDirs(filteredDirs);
    setModels(filteredModels);

    if (pathText === undefined || pathText === '') {
      setGithubLink(`https://github.com/${orgText}/${repoText}/tree/${branchText}/`)
    } else {
      setGithubLink(`https://github.com/${orgText}/${repoText}/tree/${branchText}/${pathText}`)
    }
    // if (debug) console.log('224 ', filteredModels, filteredDirs, githubLink)
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
    if (debug) console.log('291 Modeller useEffect 1 [] ');
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


  let modeloptionss = (models as any[])?.map((mod: any) => {
    return {
      value: mod.name,
      label: mod.name
    }
  });

  const label = (models.length > 0) ? ' Select Model - - - ' : ' - - - Click on "LIST MODELS" above! - - - ';
  const modeloptions = [{ value: '', label: label }, ...modeloptionss];
  // const  modeloptions = (modeloptionss?.length > 1) ? [{value: '', label: 'Select Model...'}, ...modeloptionss] : [{value: '', label: 'No Model to select...'}]
  if (debug) console.log('163 modeloptions', models, modeloptions, modeloptions?.length)

  // console.log('160 githubLink', githubLink)

  function handleSaveAllToFile() {
    const projectname = props.ph.phData.metis.name
    SaveAllToFile(data, projectname, '_PR')
  }

  return (
    <>
      <button className="btn bg-transparent py-0 my-0 pe-2 ps-1" onClick={toggle}><i className="fab fa-github fa-lg my-0 py-0 me-1 "></i>{buttonLabel}</button>
      <Modal isOpen={modal} toggle={toggle} className={className} innerRef={modalRef} backdropref={backdropref} style={{ zIndex: "9999" }}>
        <ModalHeader toggle={() => { toggle(); }}><i className="fab fa-github fa-lg mx-2"></i>GitHub Model Repository</ModalHeader>
        <ModalBody className="p-1">
          <div className="bg-light" >
            <div className="bg-light square border py-2 border-2 border-success p-2 " ><strong>Download from a list of Models:</strong>
              <div className="d-flex w-100">
                {/* ----Repository user name input------------------------------- */}
                <TextInput label="Repo owner :" value={orgText} onChange={(value: string) => onOrgChange(value)} placeholder="Repo Owners Name " />
                {/* {loading ? 'Loading...' : 
                  <div>{models.length > 0 ? <div className="text-success"> Models fond </div> : <div className="text-warning"> No repos found </div>}</div>
                } */}
                {/* ----- Searching repos -------------------------------- */}
                {/* <div className="w-100 mt-1 text-secondary"> {githubLink} </div> */}
                {/* <hr className="bg-primary my-1 mx-4" /> */}
                {/* ----- Repository name input ------------------------------ */}
                <span >
                  {(props.ph.path !== '')
                    ? <TextInput label="Repository :" value={'kavca-akm-models'} onChange={(value: string) => onRepoChange(value)} placeholder="Repo name " />
                    : <TextInput label="Repository :" value={repoText} onChange={(value: string) => onRepoChange(value)} placeholder="Repo name " />
                  }
                </span>
                <hr className="bg-primary my-2 mx-4" />
                {/* ----- Model Path input ---------------------------------- */}
                {/* <hr className="bg-secondary my-1 mx-4" /> */}
                <TextInput label="Path :" value={props.ph.path} onChange={(value: string) => onPathChange(value)} placeholder="Path to models " />
                {(Array.isArray(dirs) && dirs.length !== 0)
                  ? <div>Model paths (folders) found: <span className="text-success m-1"> {dirs?.map((dir) => (<li className="px-1" key={dir.name} >{dir.name}, </li>))}</span> </div>
                  : (!pathText) && <div className='text-warning min-vh-500'> &apos;No model paths (folders) found!&apos;</div>
                }
              </div>
              {/* {loading ? 'Loading...' :  <div className="text-success my-2 " > {repos.map((repo) => ( <span className="text-nowrap" key={repo.id} > {repo.full_name}/{pathText} </span> ))}  </div>  } */}
              {/* -------- Select model ----------------------------------- */}
              <Button className="btn-secondary bg-secondary text-white border-dark mt-2 mb-2 pb- w-100"
                onClick={() => loadModels(orgText, pathText)}
              ><i className="fab fa-github fa-lg me-2"></i>List Models
              </Button>
              {(models?.length > 0)
                ? <div className="" >Models found:<span className="text-success m-1 ">{models?.map((mod: any) => (<li className="px-2" key={mod.name} >{mod.name},   </li>))} </span></div>
                : <div className='text-warning'> &apos;No models found!&apos; </div>
              }
              <hr className="bg-primary px-10 my-1 mx-4" />
              <label className=" d-inline-flex justify-content-left">
                <Select label=" Select model : " value={(modeloptions) ? modeloptions[0] : 'no models'} options={(modeloptions) ? modeloptions : []} onChange={(value: any) => onModelChange(value)} />
              </label>
              <span className="p-5">
                <Button className="btn-primary modal--footer mr-4 py-0 ml-5 pl-5 float-end " color="primary" data-toggle="tooltip" data-placement="top" data-bs-html="true"
                  title="Click here when done!" onClick={() => { toggle(); toggleRefresh() }}>Done
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
                In GitHub: <strong>Click &quot;Add file&quot; in upper right corner and then &quot;Upload files&quot; and select the file to upload.</strong>
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

