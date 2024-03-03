

import axios from 'axios';
// import { axiosGetCancellable } from './axios.helper';
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

export async function searchGithub(repo, path, filename, branch = 'main', searchtype = 'paramfile') { // searchtype: 'repo', 'branches', 'models' or 'files'
  if ((!repo) || repo.includes('undefined')) return null
  try {
    if ((debug)) console.log('46 searchGithub', repo, path, branch, filename, searchtype);
    // search/repositories?q=akm-models
    let query = ''
    if (searchtype == 'repos') {
      query = `search/repositories?q=${repo}`
    } else if (searchtype == 'branches') {
      query = `repos/${repo}/branches`
    } else if (searchtype == 'models') {
      query = `repos/${repo}/contents/${path}`
    } else if (searchtype == 'file') {
      if (!path) {
        query = `${repo}/${branch}/${filename}`
      } else {
        query = `${repo}/${branch}/${path}/${filename}`
      }
    } else if (searchtype == 'paramfile') {
      query = `${repo}/${branch}/${path}/${filename}`
    } else if (searchtype == 'fileSHA') {
      query = `repos/${repo}/git/blobs/${filename}`
    } else if (searchtype == 'modelfile') {
      query = `${repo}${filename}`
    } else if (searchtype == 'issues') {
      console.log('50 searcGithub issues', repo);
      query = `${repo}/issues`
    } else if (searchtype == 'user') {
      console.log('50 searcGithub user', repo);
      query = `users/${repo}`
      await axios.get(
        `${query}`,
        axiosConfig
      );
    } else {
      // geting the complete url
      query = `filename`
    }
    if (debug) console.log('75 searcGithub ', query);
    const searchres = await axios.get(
      `${query}`,
      axiosConfigRaw2
    );
    if (debug) console.log('81 searcGithub searchres', searchres);
    return searchres;
  } catch (error) {
    console.error('Error in searchGithub:', error);
    // throw error;
  }
}
export async function searchRepos(repo, path) {  // search/repositories?q=akm-models
  if ((!repo) || repo.includes('undefined')) return null
  try {
    if ((debug)) console.log('93 searchRepos search/repositories', repo, path);
    return await axios.get(
      `search/repositories?q=${repo}`,
      axiosConfig
    );
  } catch (error) {
    console.error('Error in searchRepos:', error);
    throw error;
  }
}

// export async function searchUser(repo) {  
//   try {
//     if (debug) console.log('74 searchUser', repo);
//     return await axios.get(
//       `users/${repo}`,
//       axiosConfig
//     );
//   } catch (error) {
//     console.error('Error in searchUser:', error);
//     throw error;
//   }
// }

export async function searchBranches(ownerRepo, path) { // ownerRepo Kavca/kavca-akm-models
  if ((!ownerRepo) || ownerRepo.includes('undefined')) return null
  try {
    if (debug) console.log('34 searchBranches', ownerRepo, path);
    // https://api.github.com/repos/kavca/kavca-akm-models/contents/StartupModels 
    // https://api.github.com/repos/Kavca/kavca-akm-models/branches/SnorreFossland-patch-2
    // https://raw.githubusercontent.com/Kavca/kavca-akm-models/21387823876733/StudyDementia/Study-Dementia-Project%20(2).json
    const query = `${ownerRepo}`;
    if (debug) console.log('36 searchRepos', ownerRepo, 'p', path);
    if (debug) console.log('37 searchRepos https://api.github.com/', query);
    const response = await axios.get(
      `repos/${query}/branches`,
      axiosConfig
    );
    return response;
  } catch (error) {
    console.error('Error in searchBranches:', error);
    throw error;
  }
}

export function searchModels(repo, path) {
  if ((!repo) || repo.includes('undefined')) return null
  // https://api.github.com/repos/Kavca/kavca-akm-models/branches
  repo = repo.replace('https://api.github.com/repos/', '')
  const query = `${repo}`;
  if (debug) console.log('48 searchRepos https://api.github.com/', query);
  return axios.get(
    `${query}`,
    axiosConfig
  );
}
export async function searchModelRaw(repo, sha) {
  if ((!repo) || repo.includes('undefined')) return null
  try {
    // https://raw.githubusercontent.com/Kavca/equinor-osdu-akmpoc/main/
    const query = `repos/${repo}/commits/${sha}`;
    if (debug) console.log('68 searchRepos', query);
    const response = await axios.get(
      `${query}`,
      axiosConfig
    );
    return response;
  } catch (error) {
    console.error('Error in searchModelRaw:', error);
    throw error;
  }
}


export async function searchModel(repo, path) {
  if ((!repo) || repo.includes('undefined')) return null
  try {
    const query = `${repo}`;
    // const query =  `${repo}/${path}`;
    if (debug) console.log('44 searchRepos', query);
    return await axios.get(
      `${query}`,
      axiosConfig
    );
  } catch (error) {
    console.error('Error in searchModel:', error);
    throw error;
  }
}

