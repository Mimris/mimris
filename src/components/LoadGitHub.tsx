import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'

import  Search  from './Search';
import { searchRepos } from './services/githubService';


const LoadGitHub = (props: any) => {

  console.log('11', props)
  // const models = props.ph.phData.mtis

  const [searchText, setSearchText] = useState('');
  const [repos, setRepos] = useState([]);
  const [model, setModel] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`https://api.github.com/users/${props.username}/repos`);
      const data = await response.json();
      setRepos(data);
      setModel(data[0]);
    } catch (error) {
      setError(true);
    }
    setLoading(false);
  }

  const onSearchTextChange = (text) => {
    setSearchText(text);
    loadRepos(text, model);
  };

  const onModelChange = (model) => {
    setModel(model);
    loadRepos(searchText, model);
  };

  const loadRepos = async (searchText, model) => {
    setLoading(true);
    const res = await searchRepos(searchText, model);
    setLoading(false);
    setRepos(res.data.items);
  };

  return  (
    <>
      <span><button className="btn-context btn-secondary" onClick={toggle}>{buttonLabel}</button>
      </span>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => {toggle(); }}>GitHub repo</ModalHeader>
        <ModalBody className='pt-0'>
        <div>
          <Search
            searchText={searchText}
            language={model}
            onSearchTextChange={onSearchTextChange}
            onLanguageChange={onModelChange}
          />
          {loading ? 'Loading...' : <div>{JSON.stringify(repos, null, 2)}</div>}
        </div>
        </ModalBody>
      </Modal>
    </>
  )
}

export default LoadGitHub;