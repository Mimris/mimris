

import axios from 'axios';
import { axiosGetCancellable } from './axios.helper';

const axiosConfig = {
  baseURL: 'https://api.github.com/',
  auth: {
    // username: process.env.GITHUB_CLIENT_ID,
    // password: process.env.GITHUB_CLIENT_SECRET
    username: process.env.PUBLIC_GITHUB_CLIENT_ID,
    password: process.env.PUBLIC_GITHUB_CLIENT_SECRET
  }
};

export function searchRepos(searchText, path) {
  // const query = (searchText === '') ? `${path}` : `${searchText}/${path}`;
  // const query =  searchText;
  console.log('15 searchRepos', searchText, path);
  // const query = model ? `${searchText}+language:${model}` : searchText;

  return axios.get(
    `search/repositories?q=${searchText}`,
    // `search/repositories?q=${query}&sort=stars&order=desc`,
    // {type: 'private'},
    axiosConfig
  );
}

export function searchModels(searchText, path) {
  const query = `${searchText}`;
  // const query =  `${searchText}/${path}`;
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