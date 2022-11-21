

import axios from 'axios';
import { axiosGetCancellable } from './axios.helper';
import Cors from 'cors'

const cors = Cors({
  methods: ['POST', 'GET', 'HEAD'],
})

const debug = false
const axiosConfig = {
  baseURL: 'https://api.github.com/',
  auth: {
    username: process.env.GITHUB_CLIENT_ID,
    password: process.env.GITHUB_CLIENT_SECRET
    // username: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
    // password: process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET
  }
};
const axiosConfigRaw = {
  baseURL: 'https://raw.githubusercontent.com/',
  auth: {
    username: process.env.GITHUB_CLIENT_ID,
    password: process.env.GITHUB_CLIENT_SECRET
  },
  headers: {
    'Content-Type': 'application/vnd.github.v3.raw',
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"

    // 'Content-Type': 'application/json',
    // 'Authorization': 'Token +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'
  }
};

// PersonalToken   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
// GITHUB_CLIENT_ID=1904e9f7308632ae2ade
// GITHUB_CLIENT_SECRET=1d72f2c53b60dd0f1166cf05e0f468279f663565

const axiosConfigRaw2 = {
  baseURL: 'https://raw.githubusercontent.com/',
}

export function searchGithub(searchText, path, filename, branch='main', searchtype='paramfile') { // searchtype: 'repo', 'branches', 'models' or 'files'
  if (debug) console.log('36 searchGithub', searchText, path, filename, searchtype);
  // search/repositories?q=akm-models
  let query = ''
  if (searchtype == 'repos') {
    query = `search/repositories?q=${searchText}`
  } else if (searchtype == 'branches') {
    query = `repos/${searchText}/branches`
  } else if (searchtype == 'models') {
    query = `repos/${searchText}/contents/${path}`
  } else if (searchtype == 'file') {
    query = `${searchText}/${branch}/${path}/${filename}`
  } else if (searchtype == 'paramfile') {
    query = `${searchText}/${branch}/${path}/${filename}`
  } else if (searchtype == 'fileSHA') {
    query = `repos/${searchText}/git/blobs/${filename}`
  } else if (searchtype == 'modelfile') {
    query = `${searchText}${filename}`
  }
  console.log('50 searcGithub ', query);
  return axios.get(
    `${query}`,
    axiosConfigRaw2
  );
}
export function searchRepos(searchText, path) {  // search/repositories?q=akm-models
  if (debug)  console.log('1 7searchRepos search/repositories', searchText, path);
  return axios.get(
    `search/repositories?q=${searchText}`,
    axiosConfig
  );
}

export function searchBranches(ownerRepo, path) { // ownerRepo Kavca/kavca-akm-models
  console.log('34 searchBranches', ownerRepo, path);
  // https://api.github.com/repos/kavca/kavca-akm-models/contents/StartupModels 
  // https://api.github.com/repos/Kavca/kavca-akm-models/branches/SnorreFossland-patch-2
  // https://raw.githubusercontent.com/Kavca/kavca-akm-models/21387823876733/StudyDementia/Study-Dementia-Project%20(2).json
  const query = `${ownerRepo}`;
  console.log('36 searchRepos', ownerRepo, 'p', path);
  console.log('37 searchRepos https://api.github.com/', query);
  return axios.get(
    `repos/${query}/branches`,
    axiosConfig
  );
}

export function searchModels(searchText, path) {
  // https://api.github.com/repos/Kavca/kavca-akm-models/branches
  const query = `${searchText}`;
  console.log('48 searchRepos https://api.github.com/', query);
  return axios.get(
    `${query}`,
    axiosConfig
  );
}
export function searchModelRaw(searchText, sha) {
  // https://raw.githubusercontent.com/Kavca/equinor-osdu-akmpoc/main/
  const query = `repos/${searchText}/commits/${sha}`;
  console.log('68 searchRepos', query);
  return axios.get(
    `${query}`,
    axiosConfig
  );
}


export function searchModel(searchText, path) {

  const query = `${searchText}`;
  // const query =  `${searchText}/${path}`;
  console.log('44 searchRepos', query);
  return axios.get(
    `${query}`,
    axiosConfig
  );
}

