import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'
import base64 from 'base-64';

import  Search  from './Search';
import TextInput from './utils/TextInput';
import Select from './utils/Select';
import { searchRepos, searchModels, searchModel } from './services/githubService';
import { loadDataModel } from '../actions/actions';

const debug = false

const LoadGitHub = (props: any) => {
  const dispatch = useDispatch();
  // console.log('11', props)
  // const models = props.ph.phData.mtis
  const username = 'SnorreFossland'
  const url = `https://api.github.com/users/${username}/repos/akm-start-models`
  const repository = 'akm-start-models'
  const path = 'StartupModels'
  // console.log('26 url', url)

  const [searchText, setSearchText] = useState('');
  const [urlText, setUrlText] = useState(url);
  const [pathText, setPathText] = useState(path);
  const [repositoryText, setRepositoryText] = useState('');
  const [repos, setRepos] = useState([]);
  const [model, setModel] = useState({});
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);


  const onUrlChange = (text) => {
    setUrlText(text);
    loadRepos(text, model);
  };

  const onPathChange = (text) => {
    setPathText(text);
    // loadRepos(text, model);
  };


  const onModelChange = (modelName) => {
    const rep = `repos/${username}/${repository}/contents/${pathText}`;
    const path = `/${modelName}`;
    loadModel(rep, path);
    if (debug) console.log('52', rep, path, )
  }

  const loadModel = async (rep, path) => {
    setLoading(true);
    const searchtext = `${rep}${path}`;
    const res = await searchModel(searchtext, '')
    const content = res.data.content
    const model = JSON.parse(base64.decode(content));
    if (debug) console.log('60', model)
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
  const onRepoChange = (model) => {
    setModel(model);
    loadRepos(searchText, model);
  };

  const loadRepos = async (repository, pathText) => {
    setLoading(true);
    if (debug) console.log('76 loadRepos', repository, pathText)
    const res = await searchRepos(repositoryText, model);
    setLoading(false);
    setRepos(res.data.items);
    // console.log('58', res.data.items)
    if (debug) console.log('80', urlText, pathText, repositoryText, res.data, res.data.items, res)
    // loadModels(repository, pathText);
  };

  const loadModels = async (urlText, pathText) => {
    setLoading(true);
    const rep = `repos/${username}/${repository}/contents/${pathText}`;
    const path = `${pathText}`
    if (debug) console.log('72', repository, path, rep )
    const res = await searchModels(rep, path);
    if (debug) console.log('74',  res.data, res)
    // console.log('58', urlText, pathText, res.data, res.data.items, res)
    setLoading(false);
    setModels(res.data);
  };

  useEffect(() => {
    setUrlText(url);
    setPathText(path);
    setRepositoryText(repository);
    // const timer = setTimeout(() => {
      loadRepos(repositoryText, pathText);
    // }, 1000);
    // return () => clearTimeout(timer);
    // loadModels(repository, pathText);
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
    const modeloptions = [{value: '', label: 'Select Repp...'}, ...modeloptionss]


  return  (
    <>
      <span><button className="btn-context btn-secondary" onClick={toggle}>{buttonLabel}</button>
      </span>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => {toggle(); }}>GitHub repo</ModalHeader>
        <ModalBody className='pt-0'>
        <div>
          {/* Repository url: <strong> {url} </strong> */}
          <TextInput
            label="Repo url"
            value={urlText}
            onChange={(value) => onUrlChange(value)}
            placeholder="Repository Url:"
          />          
          {loading ? 'Loading...' : (repos.length > 0) 
            ? <div>Repos found: 
              {repos.map((repo) => (
                <li key={repo.id} >{repo.name}</li>
              ))} </div> 
              : 'No repos found!'}
            <hr />
          <TextInput 
            label="Model path"
            value={pathText}
            onChange={(value) => onPathChange(value)}
            placeholder="Path to models"
          />
          <button onClick = {() => loadModels(repositoryText, pathText)}>Load Models</button>
          <Select
            label="Select model "
            value={(models) ? modeloptions[0] : 'no models'}
            options={(models) ? modeloptions : []}
            onChange={(value) => onModelChange(value)}
          />
          {loading ? 'Loading...' : (models?.length > 0) 
            ? <div>Models found: 
              {models?.map((mod) => (
                <li key={mod.id} >{mod.name}</li>
              ))} </div> 
            : 'No models found!'}

            {/* {loading ? 'Loading...' : <div>{JSON.stringify(repos, null, 2)}</div>} */}
        </div>
        </ModalBody>
      </Modal>
    </>
  )
}

export default LoadGitHub;