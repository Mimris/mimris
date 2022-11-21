'use client';

import { NextApiResponse, NextApiRequest } from 'next'
import Cors from 'cors'
import { connect, useSelector, useDispatch } from 'react-redux';
import {  searchGithub, searchModelRaw } from '../../../components/githubServices/githubService';
import base64 from 'base-64';

type ResponseError = {
  message: string
}

const debug = false
// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
    methods: ['POST', 'GET', 'HEAD'],
  })
  
  // Helper method to wait for a middleware to execute before continuing
  // And to throw an error when an error happens in a middleware
  function runMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    fn: Function
  ) {
    return new Promise((resolve, reject) => {
      fn(req, res, (result: any) => {
        if (result instanceof Error) {
          return reject(result)
        }
  
        return resolve(result)
      })
    })
  }


const loadModel = async (repo, filename) => {
    // const dispatch = useDispatch();
    // const [loading, setLoading] = useState(false);
    // setLoading(true);
    const searchtexttmp = `${repo}`;
    const searchtext = searchtexttmp.replace(/\/\//g, '/');
    if (!debug) console.log('47 ', repo, filename)
    const res = await searchGithub(searchtext, 'startmodels', filename, 'main', 'file');
    const content = res.data.content
    // const sha = await res.data.sha;
    // if (debug) console.log('105 res', res, res.data, sha)
    // const res2 = await searchGithub(searchtext, '', sha, '', 'fileSHA');    
    // const content = res2.data.content
    // if (debug) console.log('113 res', res2, res2.data)

    if (debug) console.log('56 ', searchtext, res)
    if (debug) console.log('57 ', base64.decode(content))
    const model = JSON.parse(base64.decode(content));

    if (debug) console.log('60 ', model)

    // setLoading(false);


    if (model) {
        const data = model.phData
        if (!debug) console.log('67 ', data.metis.name)
        // if (data.phData)    useDispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data })
    }  
}

  export default async function handler(
        req: NextApiRequest,
        res: NextApiResponse
    ) {

        // Run the middleware
        await runMiddleware(req, res, cors)
        console.log(req.body, req.query)

        const { file, repo } = req.query
        console.log('80', repo, file)

        loadModel(repo, file);
    
        // console.log(JSON.parse(JSON.stringify(filename)))


        // res.redirect('/modelling')
        res.status(200).json({ message: 'ok' })
    

    }
