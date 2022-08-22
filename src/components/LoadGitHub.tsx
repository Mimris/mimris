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

  // const username = 'kavca'
  // const url = `https://api.github.com/users/${username}/repos/`
  // const repository = 'akm-models'
  // const path = 'models'


  // const username = 'josmiseth'
  // const url = `https://api.github.com/users/${username}/repos/`
  // const repository = 'cumulus-akm-pocc'
  // const path = 'Cumulus'

  const [githubLink, setGithubLink] = useState('http://github.com/');
  // const [searchText, setSearchText] = useState('');
  const [usernameText, setUsernameText] = useState('Kavca');
  const [repoText, setRepoText] = useState('akm-models');
  const [pathText, setPathText] = useState('StartupModels');
  const [repos, setRepos] = useState([]);
  const [model, setModel] = useState({});
  const [models, setModels] = useState([]);
  const [dirs, setDirs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState(false);

  const { buttonLabel, className } = props;
  const toggle = () => setModal(!modal);

  useEffect(() => {
    setGithubLink(`https://github.com/${usernameText}/${repoText}/tree/main/${pathText}`)
  }, [])

  const onUsernameChange = (text) => {
    if (text?.length > 0) {
      console.log('50 onUsernameChange', text)
      setUsernameText(text);
      setGithubLink(`http://github.com/${text}/${repoText}`);
      console.log('55 onUsernameChange', usernameText)
    }
  };

  const onPathChange = (text) => {
    if (text?.length < 2) {
      setPathText('');
    } else {
      setPathText(text);
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
    (text) ? setRepoText(text): setRepoText('');
    // loadRepos(searchText, model);
  };

  const loadRepos = async (repoText, pathText) => {
    if (usernameText?.length > 0)  { 
      setLoading(true);
      if (!debug) console.log('76 loadRepos', repoText, pathText, model)
      const res = await searchRepos(repoText, pathText);
      const repolist = await res.data.items?.filter(repo => repo.name === repoText);
      setLoading(false);
      console.log('118 res.data.items: ', await res.data.items, repos)
      setRepos(await repolist);
      setModels(await res.data.items?.filter(repo => repo.name === repoText));
      if (!debug) console.log('122', usernameText, pathText, repoText, res.data.items, repos)
      // loadModels(repoText, pathText);
    }
  };

  const loadModels = async (usernameText, pathText) => {
    setLoading(true);
    const repos = (pathText !== '') ?`repos/${usernameText}/${repoText}/contents/${pathText}` : `repos/${usernameText}/${repoText}/contents`;
    // const rep = `repos/${username}/${repoText}/contents/${pathText}`;
    if (!debug) console.log('131  u', usernameText, 'r', repoText,'p', pathText,'repos', repos)
    const res = await searchModels(repos, pathText);
    if (!debug) console.log('133 ', await res.data)
    setLoading(false);
    const filteredDirs = await res.data?.filter(model => model.type === 'dir' && model.name !== 'img');
    const filteredModels = await res.data?.filter(model => model.name.endsWith('.json'));
    console.log('136 ', filteredModels)
    setModels(filteredModels);
    setDirs(filteredDirs);
    setGithubLink(`https://github.com/${usernameText}/${repoText}/tree/main/${pathText}`)
  };

  useEffect(() => {
    if (usernameText?.length > 0) {
      loadRepos(repoText, pathText);
    }
  }, [(modal)]);

  useEffect(() => {
    setModels([]);
    setDirs([]);
    setGithubLink(`https://github.com/${usernameText}/${repoText}/tree/main/${pathText}`)
  }, [usernameText, repoText, pathText]);



  let modeloptionss = models?.map((mod) => {
    return {
      value: mod.name,
      label: mod.name
    } 
  });
  const  modeloptions = [{value: '', label: 'Select Model...'}, ...modeloptionss] ;
  // const  modeloptions = (modeloptionss?.length > 1) ? [{value: '', label: 'Select Model...'}, ...modeloptionss] : [{value: '', label: 'No Model to select...'}]
  if (!debug) console.log('163 modeloptions', models, modeloptions, modeloptions?.length)

  // console.log('160 githubLink', githubLink)

  return  (
    <>
      <span><button className="btn-context btn-outline-primary text-dark ml-1" onClick={toggle}>{buttonLabel}</button>
      </span>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => {toggle(); }}>GitHub repo</ModalHeader>
        <ModalBody className="pl-1 pt-1 ">
        <div>
          {/* ----Repository user name input------------------------------- */}
          <TextInput // 
            label="Repo UserName:"
            value={usernameText}
            onChange={(value) => onUsernameChange(value)}
            placeholder="Repos UserName:"
          />         
          {/* {loading ? 'Loading...' : 
            <div>{models.length > 0 ? <div className="text-success"> Models fond </div> : <div className="text-warning"> No repos found </div>}</div>
          } */}
          {/* ----- Searching repos -------------------------------- */}
          <div className="w-100 mt-1">Searching repos in: {githubLink} </div>
          <hr className="bg-primary my-1 mx-4" />
          {loading ? 'Loading...' : 
             <div className="text-success m-1" > 
              {repos.map((repo) => (
                <span className="px-1" key={repo.id} > {repo.full_name}, </span>
                ))} 
              </div> 
          }
          {/* ----- Repository name input ----------------------------------- */}
          <span className="">
          <TextInput 
            label="Repository Name:"
            value={repoText}
            onChange={(value) => onRepoChange(value)}
            placeholder="Repo name:"
            />      
          </span>
          <hr className="bg-primary my-1 mx-4" />
            {/* ----- Path input ------------------------------------ */}
          <span className="">  
          <TextInput  // pathText input
            label="Model path:"
            value={pathText}
            onChange={(value) => onPathChange(value)}
            placeholder="Path to models"
            />
          </span>
          <hr className="bg-light my-1 mx-4" />
          <div className="w-100">Models found in: {githubLink} </div>
            {/* -------- Select model ------------------------------------ */}
          {/* <hr className="bg-primary" /> */}
          <Button className="btn-primary text-black border-primary w-100 float-right mt-2 mb-2 pb-0" onClick = {() => loadModels(usernameText, pathText)}>List Models</Button>
          {(dirs?.length > 0) 
            ? <div >Model paths found:
              <span className="text-success m-1">
                {dirs?.map((dir) => (
                  <span className="px-1" key={dir.name} >{dir.name}, </span>
                  ))}
              </span>
              </div> 
            : <div className='text-warning'> 'No model paths found!'</div>
          } 
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

          {/* -------------------------------------------------------- */}
          <div className="w-50">
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
          {/* githubLink: {githubLink} <br /> repoText: {repoText} <br />pathText: {pathText} <br /> usernameText: {usernameText}  <br /> */}
          <a href={githubLink} target="_blank" rel="noopener noreferrer"> <strong> Click here to open GitHub</strong></a>
          <p>You can learn how to upload your Model project.json files. <br />Check the README file for Guidence</p>
        </div>
        </ModalBody>
      </Modal>
    </>
  )
}

export default LoadGitHub;
