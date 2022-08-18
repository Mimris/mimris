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
  const url = `https://api.github.com/users/`
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

  const [searchText, setSearchText] = useState('');
  const [usernameText, setUsernameText] = useState(username);
  const [pathText, setPathText] = useState(path);
  const [repoText, setRepoText] = useState(repository);
  const [repos, setRepos] = useState([]);
  const [model, setModel] = useState({});
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState(false);

  const { buttonLabel, className } = props;
  const toggle = () => setModal(!modal);


  const onUsernameChange = (text) => {
    setUsernameText(text);
    const timer = setTimeout(() => {
    loadRepos(text, model);
    }, 5000);
    return () => clearTimeout(timer);
  };

  const onPathChange = (text) => {
    setPathText(text);
    // loadRepos(text, model);
  };


  const onModelChange = (text) => {
    const rep = `repos/${username}/${repoText}/contents/${pathText}`;
    const path = `/${text}`; // add slash
    loadModel(rep, path);
    if (debug) console.log('52', rep, path, )
  }

  const loadModel = async (rep, path) => {
    setLoading(true);
    const searchtext = `${rep}${path}`;
    const res = await searchModel(searchtext, '')
    const content = res.data.content
    if (!debug) console.log('70', base64.decode(content))
    const model = JSON.parse(base64.decode(content));
    // const model = JSON.parse(base64.decode(content));
    if (debug) console.log('72', model)
    setLoading(false);

    if (debug) console.log('53 onModelChange', model)
      
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
    setLoading(true);
    if (!debug) console.log('76 loadRepos', repoText, pathText, model)
    const res = await searchRepos(repoText, pathText);
    setLoading(false);
    setRepos(res.data.items);
    console.log('94', res.data.items, res)
    if (debug) console.log('95', usernameText, pathText, repoText, res.data, res.data.items, res)
    // loadModels(repoText, pathText);
  };

  const loadModels = async (urlText, pathText) => {
    setLoading(true);
    const rep = `repos/${usernameText}/contents/`;
    // const rep = `repos/${username}/${repoText}/contents/${pathText}`;
    const path = `${pathText}`
    if (!debug) console.log('72', pathText, rep , path)
    const res = await searchModels(rep, path);
    if (debug) console.log('74',  res.data, res)
    // console.log('58', urlText, pathText, res.data, res.data.items, res)
    setLoading(false);
    setModels(res.data);
  };

  useEffect(() => {
    setUsernameText(username);
    setPathText(path);
    const repoText = `${url}${username}/repos`;
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


  const  modeloptionss = 
     models?.map((mod) => {
      return {
        value: mod.name,
        label: mod.name
      }
    })
    const modeloptions = [{value: '', label: 'Select Model...'}, ...modeloptionss]


  return  (
    <>
      <span><button className="btn-context btn-outline-primary text-dark ml-1" onClick={toggle}>{buttonLabel}</button>
      </span>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => {toggle(); }}>GitHub repo</ModalHeader>
        <ModalBody className='pt-0'>
        <div>
          <TextInput
            label="Repo UserName (i.e. https/:api.github.com/users/'UserName'/repos/):"
            // label="Repos URL (i.e. https/:api.github.com/users/'UserName'/repos/):"
            value={usernameText}
            onChange={(value) => onUsernameChange(value)}
            placeholder="Repos UserName:"
          />          
          {loading ? 'Loading...' : 
             <div> 
              {repos.map((repo) => (
                <li key={repo.id} >{repo.name}</li>
              ))} 
              </div> 
          }
          <hr className="bg-primary" />
          <TextInput
            label="Repository Name (i.e. akm-models):"
            value={repository}
            onChange={(value) => onRepoChange(value)}
            placeholder="Repo name:"
          />          
          Searching repo url: {repoText} <br />
          {loading ? 'Loading...' : 
            <div>{models.length > 0 ? <div> Models fond </div> : <div> No models found </div>}</div>
          }
  
          <hr className="bg-primary" />
          <TextInput 
            label="Model path"
            value={pathText}
            onChange={(value) => onPathChange(value)}
            placeholder="Path to models"
          />
          <hr className="bg-primary" />
          <Button className="btn-primary text-black border-primary w-75 float-right mb-2 pb-0" onClick = {() => loadModels(usernameText, pathText)}>List Models</Button>
            {(models.length > 0) ? <div>Models found!</div> : <div>No models found!</div>}
            <hr className="bg-primary" />

          <div className="w-100">
            <Select 
              label="Select model "
              value={(models) ? modeloptions[0] : 'no models'}
              options={(models) ? modeloptions : []}
              onChange={(value) => onModelChange(value)}
            />
          </div>
          <hr />
          {/* {loading ? 'Loading...' : (models?.length > 0) 
            ? <div>Models found:
              {models?.map((mod) => (
                <li key={mod.name} >{mod.name}</li>
              ))} </div> 
            : 'No models found!'} */}
          <hr className="bg-primary" />
          <a href={url.replace(/repos\//,'').replace(/api.github.com\/users\//,'github.com/')+repoText+'/'} target="_blank" rel="noopener noreferrer"> <strong> Click here to open GitHub</strong></a>
          <p>There you can learn how to upload your Model project.json files. <br />Check the README file for Guidence</p>
        </div>
        </ModalBody>
      </Modal>
    </>
  )
}

export default LoadGitHub;