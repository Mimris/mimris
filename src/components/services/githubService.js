

import axios from 'axios';
import { axiosGetCancellable } from './axios.helper';

const axiosConfig = {
  baseURL: 'https://api.github.com/',
  auth: {
    username: process.env.GITHUB_CLIENT_ID,
    password: process.env.GITHUB_CLIENT_SECRET
    // username: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
    // password: process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET
  },
  // headers: {
  //   'Content-Type': 'application/vnd.github.v3.raw',
  //   'Content-Type': 'application/json', 
  //   'Authorization': 'Token +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'
  // }
};
// PersonalToken   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
// GITHUB_CLIENT_ID=1904e9f7308632ae2ade
// GITHUB_CLIENT_SECRET=1d72f2c53b60dd0f1166cf05e0f468279f663565

export function searchRepos(searchText, path) {
    // search/repositories?q=akm-models
  console.log('15 searchRepos', searchText, path);
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
  console.log('47 searchRepos', searchText, 'p', path);
  console.log('48 searchRepos https://api.github.com/', query);
  return axios.get(
    `${query}`,
    axiosConfig
  );
}


export function searchModel(searchText, path) {
  const query = `${searchText}`;
  // const query =  `${searchText}/${path}`;
  // console.log('44 searchRepos', query);
  return axios.get(
    `${query}`,
    axiosConfig
  );
}

export function searchCommit(searchText, path) {
  const query = `${searchText}`;
  // const query =  `${searchText}/${path}`;
  // console.log('62 searchRepos', query);
  console.log('63 searchRepos https://api.github.com/', `repos/${query}/commits/${path}`);
  return axios.get(
    `repos/${query}/commits/${path}`,
    axiosConfig
  );
}

export function searchRaw(searchText, path) {
  const query = `${searchText}`;
  // const query =  `${searchText}/${path}`;
  // console.log('62 searchRepos', query);
  console.log('63 searchRepos https://api.github.com/', `repos/${query}/commits/${path}`);
  return axios.get(
    `${query}`,
    axiosConfig
  );
}


// export { searchRepos, searchModels };





// export function searchRepos(searchText, path) {
//   console.log('15 searchRepos', searchText, path);
//   return axios.get(
//     `search/repositories?q=${searchText}`,
//     axiosConfig
//   );
// }

// export function searchModels(searchText, path) {
//   const query = `${searchText}`;
//   console.log('31 searchRepos', query);

//   return axios.get(
//     `${query}`,
//     axiosConfig
//   );
// }