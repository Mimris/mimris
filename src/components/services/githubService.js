

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
  console.log('15 searchRepos', searchText, path);
  return axios.get(
    `search/repositories?q=${searchText}`,
    axiosConfig
  );
}

export function searchModels(searchText, path) {
  const query = `${searchText}`;
  console.log('31 searchRepos', query);

  return axios.get(
    `${query}`,
    axiosConfig
  );
}
export function searchModel(searchText, path) {
  const query = `${searchText}`;
  // const query =  `${searchText}/${path}`;
  console.log('31 searchRepos', query);

  return axios.get(
    `${query}`,
    axiosConfig
  );
}

// export { searchRepos, searchModels };