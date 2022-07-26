import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'

import  Search  from './Search';
import { searchRepos } from './services/githubService';


const LoadGitHub = (props: any) => {

  // console.log('11', props)
  // const models = props.ph.phData.mtis

  const [searchText, setSearchText] = useState('');
  const [repos, setRepos] = useState([]);
  const [model, setModel] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  const username = 'SnorreFossland'
  const url = `https://api.github.com/users/${username}/repos`
  console.log('26 url', url)

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(url);
      const data = await response.json();
      setRepos(data);
      setModel(data[0]);
      console.log('32 data', await data)
    } catch (error) {
      console.log('38 error', error)
      setError(true);
    }
    console.log('41 ', repos)
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
    console.log('58', res.data.items.name)
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
            // model={model}
            onSearchTextChange={onSearchTextChange}
            // onModelChange={onModelChange}
          />
          {loading ? 'Loading...' : <div>{JSON.stringify(repos, null, 2)}</div>}
        </div>
        </ModalBody>
      </Modal>
    </>
  )
}

export default LoadGitHub;