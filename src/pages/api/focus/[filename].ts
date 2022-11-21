import { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'

type ResponseError = {
  message: string
}

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
  
  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    // Run the middleware
    await runMiddleware(req, res, cors)
    console.log(req.body, req.query)
    const { filename } = req.query
    console.log(filename)


    // console.log(JSON.parse(JSON.stringify(filename)))

    res.redirect('/modelling')
  }


  // http://localhost:3000/api/focus/{"filename": {"index.ts", "dljfasdf": "asdfasdf"}}
  // http://localhost:3000/api/focus/{"filename": {"index.ts", "dljfasdf": "asdfasdf"}}
  // http://localhost:3000/api/focus/filename={https://github.com/Kavca/kavca-akm-models/blob/main/startmodels/AKM-GENERIC-Startup.json}

 
//    http://localhost:3000/api/focus/?filename="https://github.com/Kavca/kavca-akm-models/blob/main/startmodels/AKM-GENERIC-Startup.json"

// http://localhost:3000/api/focus/?repo=https://raw.githubusercontent.com/Kavca/kavca-akm-models/main/startmodels/&file=AKM-GENERIC-Startup.json
// http://localhost:3000/api/focus/?repo=https://raw.githubusercontent.com/Kavca/kavca-akm-models/main/startmodels/&file=AKM-GENERIC-Startup.json


//    http://localhost:3000/api/focus/?repo=https://github.com/Kavca/kavca-akm-models&file=AKM-GENERIC-Startup.json
//    http://localhost:3000/api/focus/?repo=Kavca/kavca-akm-models&file=AKM-IRTV-Startup.json

// http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&file=AKM-IRTV-Startup.json