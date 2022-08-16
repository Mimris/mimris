import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';

import FS from '@isomorphic-git/lightning-fs';

const LoadSaveGit = (props: any) => {

  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  const { buttonLabel, className } = props;

  const fs = new FS("testfs");

  console.log('14 ', fs);
  return (
    <>
       <span><button className="btn btn-success text-white m-0 p-1" onClick={toggle}>{buttonLabel}</button>
       </span>
       <Modal isOpen={modal} toggle={toggle} className={className} >
         <ModalHeader toggle={() => {toggle(); }}>GitHub repo</ModalHeader>
         <ModalBody className='pt-0'>
         <div></div>
      <div>
        <h1>LoadSaveGit</h1>
        
      </div>

        </ModalBody>
     </Modal>
    </>
  );
}
export default LoadSaveGit;


// import { useState } from 'react';
// import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
// import { useDispatch } from 'react-redux'
// import git, { readTree } from 'isomorphic-git'
// import fs from 'fs'

// import FS from '@isomorphic-git/lightning-fs'
// import http from 'isomorphic-git/http/node'


// import TextInput from './utils/TextInput';
// import Select from './utils/Select';



// const debug = false

// const LoadSaveGit =(props: any) => {

//     const dispatch = useDispatch();

//     console.log('11', window.location.href, window.location.pathname, window?.parent  );
    

//     // if (typeof window !== 'undefined') {
//     // window.fs = new LightningFS('fs')
//     // window.pfs = window.FileSystem.promises
//     // }

//     // const fs = new FS('fs')
//     // const pfs = fs.promises

//     const username = 'SnorreFossland'
//     const url = `/Users/snorrefossland/GitHub/`
//     const repository = 'akm-start-models'
//     const dir = 'akm-start-models'
//     const path = 'StartupModels'
    
//     const [urlText, setUrlText] = useState(url);
//     const [pathText, setPathText] = useState(path);
//     const [repoText, setRepoText] = useState(repository);
//     const [repos, setRepos] = useState([]);
//     const [model, setModel] = useState({});
//     const [models, setModels] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [modal, setModal] = useState(false);
//     const [error, setError] = useState(false);

//     const { buttonLabel, className } = props;
//     const toggle = () => setModal(!modal);

//     const getLocalRepos = async () => {
//         console.log('51 ', git, readTree(fs));
        
//         // const files = await git.listFiles({ fFs, dir: __dirname })
//         const files = await git.listFiles({ fs, dir: '/GitHub/akm-start-models/StartModels' })
//         console.log('46 files', files)
//         // console.log('42', await pfs.stat('/?').then(stats => stats))

//         // let status = await git.status({ fFs, dir: '/akm-start-models', filepath: 'README.md' })
//         // console.log('59', fFs,  status, git)
      

//         // // get Readme.md from repo
//         // const readme = await pfs.readFile(`/${repoText}/README.md`)  // get all repos
//         // console.log('48 readme', readme)
//         // const repoo = await pfs.readFile('/README.md').then(json => {
//         //     console.log('45', json);
//         //     //=> {foo: true} 
//         // } )  // get all repos

//         // const repos0 = await pfs.readFile('README.md')
//         // console.log('50 repos0', repo, repos0, repoo)
//         // const repos = null // await pfs.readdir(`${url}/${dir}`)
//         // setRepos(repos)
//         // console.log('53 repos', repos)
//         // getLocalRepos()
//         // await git.clone({
//         //     fs,
//         //     http,
//         //     dir,
//         //     corsProxy: 'https://cors.isomorphic-git.org',
//         //     url: 'https:
//         //github.com/SnorreFossland/akm-start-models.git',
//         //     ref: 'main',
//         //     singleBranch: true,
//         //     depth: 10
//         // });
//     }
  
//   // Now it should not be empty...
// //   await pfs.readdir(dir);

// //   const onUrlChange = (text) => {
// //     setUrlText(text);
// //     const timer = setTimeout(() => {
// //     loadRepos(text, model);
// //     }, 5000);
// //   };

//   const onPathChange = (text) => {
//     setPathText(text);
//     // loadRepos(text, model);
//   };


//   const onModelChange = (text) => {
//     const rep = `repos/${username}/${repoText}/contents/${pathText}`;
//     const path = `/${text}`; // add slash
//     // loadModel(rep, path);
//     if (debug) console.log('52', rep, path, )
//   }

// //   const loadModel = async (rep, path) => {
// //     setLoading(true);
// //     const searchtext = `${rep}${path}`;
// //     const res = await searchModel(searchtext, '')
// //     const content = res.data.content
// //     if (!debug) console.log('70', base64.decode(content))
// //     const model = JSON.parse(base64.decode(content));
// //     // const model = JSON.parse(base64.decode(content));
// //     if (debug) console.log('72', model)
// //     setLoading(false);

// //     if (debug) console.log('53 onModelChange', model)
      
// //       const data = {
// //         phData:   model.phData,
// //         phFocus:  model.phFocus,
// //         phUser:   model.phUser,
// //         phSource: model.phSource,
// //       }

// //       if (data.phData)    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
// //       if (data.phFocus)   dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data.phFocus })
// //       if (data.phUser)    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: data.phUser })
// //       if (data.phSource)  dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data.phSource })
   
// //   }
//   const onRepoChange = (text) => {
//     setRepoText(text);
//     // loadRepos(searchText, model);
//   };

// //   const loadRepos = async (repoText, pathText) => {
// //     setLoading(true);
// //     if (!debug) console.log('76 loadRepos', repoText, pathText)
// //     const res = await searchRepos(repoText, model);
// //     setLoading(false);
// //     setRepos(res.data.items);
// //     console.log('94', res.data.items, res)
// //     if (debug) console.log('95', urlText, pathText, repoText, res.data, res.data.items, res)
// //     // loadModels(repoText, pathText);
// //   };

//   const  modeloptionss = 
//   models?.map((mod) => {
//     return {
//       value: mod.name,
//       label: mod.name
//     }
//   })
//   const modeloptions = [{value: '', label: 'Select Model...'}, ...modeloptionss]



//   return  (
//     <>
//       <span><button className="btn btn-success text-white m-0 p-1" onClick={toggle}>{buttonLabel}</button>
//       </span>
//       <Modal isOpen={modal} toggle={toggle} className={className} >
//         <ModalHeader toggle={() => {toggle(); }}>GitHub repo</ModalHeader>
//         <ModalBody className='pt-0'>
//         <div>
//           <TextInput
//             label="Repositories URL (i.e. https/:api.github.com/users/'UserName'/repos/):"
//             value={urlText}
//             onChange={(value) => onUrlChange(value)}
//             placeholder="Repos Url:"
//           />          
//           {loading ? 'Loading...' : (repos?.length > 0) 
//             ? <div>Repos found: 
//               {repos.map((repo) => (
//                 <li key={repo.id} >{repo.name}</li>
//               ))} 
//               </div> 
//               : 'No repos found!'}
//             <hr className="bg-primary" />
//           <TextInput
//             label="Repository Name (i.e. akm-start-models):"
//             value={repoText}
//             onChange={(value) => onRepoChange(value)}
//             placeholder="Repo name:"
//           />          
//           {loading ? 'Loading...' : (repos?.length > 0) 
//             ? <div>Repo found! 
//               {/* {repos.map((repo) => (
//                 <li key={repo.id} >{repo.name}</li>
//               ))}  */}
//               </div> 
//               : 'No repo found!'}
//           Full url: {url+repoText}
//           <hr className="bg-primary" />
//           <TextInput 
//             label="Model path"
//             value={pathText}
//             onChange={(value) => onPathChange(value)}
//             placeholder="Path to models"
//           />
//             <hr className="bg-primary" />
//           <Button className="btn-primary text-black border-primary w-75 float-right mb-2 pb-0" onClick = {() => getLocalRepos()}>Load Models</Button>
//           {/* <Button className="btn-primary text-black border-primary w-75 float-right mb-2 pb-0" onClick = {() => loadModels(repoText, pathText)}>Load Models</Button> */}
//             <div>Models found!</div>
//             <hr className="bg-primary" />

//           <div className="w-100">
//             <Select 
//               label="Select model "
//               value={(models) ? modeloptions[0] : 'no models'}
//               options={(models) ? modeloptions : []}
//               onChange={(value) => onModelChange(value)}
//             />
//           </div>
//           <hr />
//           {loading ? 'Loading...' : (models?.length > 0) 
//             ? <div>Models found:
//               {models?.map((mod) => (
//                 <li key={mod.name} >{mod.name}</li>
//               ))} </div> 
//             : 'No models found!'}

//             {/* {loading ? 'Loading...' : <div>{JSON.stringify(repos, null, 2)}</div>} */}
//         </div>
//         </ModalBody>
//       </Modal>
//     </>
//   )

// }

// export default LoadSaveGit;