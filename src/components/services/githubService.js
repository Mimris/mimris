import axios from 'axios';
import { axiosGetCancellable } from './axios.helper';

const axiosConfig = {
  baseURL: 'https://api.github.com/',
  auth: {
    // username: process.env.GITHUB_CLIENT_ID,
    // password: process.env.GITHUB_CLIENT_SECRET
    username: process.env.GITHUB_CLIENT_ID,
    password: process.env.GITHUB_CLIENT_SECRET
  }
};

function searchRepos(searchText, model) {
  const query =  searchText;
  // const query = model ? `${searchText}+language:${model}` : searchText;

  return axios.get(

    `search/repositories?q=${query}`,
    // `search/repositories?q=${query}&sort=stars&order=desc`,
    // {type: 'private'},
    axiosConfig
  );
}

export { searchRepos };