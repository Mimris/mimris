// ts-nocheck

import { useEffect, useState } from "react";
import { useSelector } from 'react-redux'
import { saveAs } from "file-saver";
import Markdown from 'markdown-to-jsx';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { FormGroup, Label, Input, Button } from 'reactstrap';

import ObjDetailToMarkdown from "./ObjDetailToMarkdown";
import FocusParametersForm from "./EditFocusParameter";

const debug = false

// function MarkdownEditor( props: any ) {
const MarkdownEditor = ({ ph, reportType, modelInFocusId, edit }: { ph: any, reportType: any, modelInFocusId: any, edit: any }) => {
  // const [markdownString, setMarkdownString] = useState('# My Markdown Document\n\nThis is a paragraph of text.');
  console.log('18 MarkdownEditor.tsx', ph);

  const [mdHeaderString, setMdHeaderString] = useState('');
  const [mdString, setMdString] = useState(``);
  const [mdFooterString, setMdFooterString] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('Main');
  const [githubPath, setGithubPath] = useState('My-markdown-file.md');

  const [selectedId, setSelectedId] = useState('');
  const [objview, setObjview] = useState(null);

  const metamodels = useSelector(state => ph.phData?.metis?.metamodels)  // selecting the models array
  const focusModel = useSelector(state => ph.phFocus?.focusModel)
  const focusUser = useSelector(state => ph.phUser?.focusUser)
  const focusModelview = useSelector(state => ph.phFocus?.focusModelview)
  const focusObjectview = useSelector(state => ph.phFocus?.focusObjectview)
  const focusObject = useSelector(state => ph.phFocus?.focusObject)

  if (debug) console.log('37 Context', focusModel, focusModelview, focusObjectview, ph);

  const models = useSelector(state => ph.phData?.metis?.models)  // selecting the models array

  const curmodel = models?.find((m: any) => m?.id === focusModel?.id) //|| models[0]
  const modelviews = curmodel?.modelviews //.map((mv: any) => mv)
  const curmodelview = modelviews?.find((mv: any) => mv?.id === curmodel.modelviews.find((mv: any) => mv.id === focusModelview.id)?.id)
  const curmetamodel = metamodels?.find((mm: any) => (mm) && mm.id === (curmodel?.metamodelRef))
  const objects = curmodel?.objects //.map((o: any) => o)
  const curobjectviews = modelviews?.objectviews
  const currelshipviews = modelviews?.relshipviews
  const currelationships = curmodel?.relships.filter((r: any) => r && currelshipviews?.find((crv: any) => crv.relshipRef === r.id))
  if (debug) console.log('38 Context', focusModelview?.id, curobjectviews, modelviews, modelviews?.find((mv: any) => mv.id === focusModelview?.id), currelshipviews, currelationships, curobjectviews, focusModelview.id, modelviews);


  let curobject = (focusObject?.id === 'no objects selected') ? curmodelview : objects?.find((o: any) => o.id === focusObject?.id) || curmodelview
  const curobjectview = (focusObjectview?.id === 'no objectview selected') ? curmodelview : modelviews?.find((mv: any) => mv.id === focusModelview?.id)?.objectviews?.find((ov:any) => ov.id === focusObjectview?.id)
    // console.log('51 Context', curobject, curobjectview, focusObjectview?.id, focusObject?.id, focusModelview?.id, curobjectviews, objects, curobjectviews?.filter(ov: any => ov.group === curobjectview?.id));

  let objectviewChildren = []
  let objectChildren = []
  console.log('45 Context', curobjectviews, focusModelview?.id,);

  if (debug) console.log('47 Context', curobjectviews, curobjectview?.id, focusModelview);
  console.log('48 Context', curobjectviews?.filter((ov: any) => ov.group === curobjectview?.id))

  function findObjectviewsWithCurrentObjectview(objectviews: any[], currentObjectviewId: string): any[] {
    return objectviews?.filter((objectview) => objectview.group === currentObjectviewId) || [];
  }

  function findObjectsForObjectviews(objectviews: any[], objects: any[]): any[] {
    return objectviews?.map((objectview) => objects.find((object) => object.id === objectview.objectRef)) || [];
  }

  function findToobjectsForCurobject(curobject: any, currelationships: any[]): any[] {
    return currelationships?.map((relship) => relship.toobjectRef === curobject.id ? relship.fromobjectRef : null) || [];
  }

  objectviewChildren = findObjectviewsWithCurrentObjectview(curobjectviews, curobjectview?.id);
  objectChildren = findObjectsForObjectviews(objectviewChildren, objects);
  if (debug) console.log('75 Context', curobjectview?.name, objectviewChildren, objectChildren);

  const title = 'children'

  let orgLength = ph.phFocus.focusProj?.org?.length || 0;
  let repoLength = ph.phFocus.focusProj?.repo?.length || 0;
  let pathLength = ph.phFocus.focusProj?.path?.length || 0;
  let fileLength = ph.phFocus.focusProj?.file?.length || 0;
  let branchLength = ph.phFocus.focusProj?.branch?.length || 0;

  let userLength = ph.phFocus.focusUser?.name.length || 0;
  let dateLength = new Date().toLocaleDateString().length;
  let timeLength = new Date().toLocaleTimeString().length;

  const handleAddObjectHeader = () => {
    setMdHeaderString(` ${ph.phFocus.focusProj?.name} \n\n --- \n\n`);
  };

  const fileName = `${ph.phFocus.focusProj?.name}_${ph.phFocus.focusModel?.name}_${ph.phFocus.focusModelview?.name}`.replace(/ /g, '-');
  const svgFileName = `${fileName}.svg`
  const pngFileName = `${fileName}.png`
  const mdFileName = `${fileName}.md`

  console.log('91 svgFileName', svgFileName);



  let markdownString = `Markdown Report from AKM Modeller \n\n --- \n\n
  Project file: ${ph.phFocus.focusProj?.file}

  <details>
  <summary>More about the project ... </summary>
  <nobr>
    | ***Organisation:*** | ***Repository:*** | ***Path:*** | ***Project file:*** | ***Branch:*** |
    |  ${"-".repeat(orgLength + 4)} | ${"-".repeat(repoLength + 4)} | ${"-".repeat(pathLength + 4)} | ${"-".repeat(fileLength + 4)} | ${"-".repeat(branchLength + 4)} |
    |  "${ph.phFocus.focusProj?.org?.padEnd(2)}"  |  "${ph.phFocus.focusProj?.repo?.padEnd(2)}"  |  "${ph.phFocus.focusProj?.path}"  |  "${ph.phFocus.focusProj?.file}"  |  "${ph.phFocus.focusProj?.branch}"  |
    </nobr>
    <nobr> --- \n\n
    | user | date${" ".repeat(dateLength - 4)} | time${" ".repeat(timeLength - 4)} |
    | ${"-".repeat(userLength + 2)} | ${"-".repeat(dateLength + 2)} | ${"-".repeat(timeLength + 2)} |
    | "${ph.phFocus.focusUser?.name || 'no user defined'}" | "${new Date().toLocaleDateString()}" | "${new Date().toLocaleTimeString()}" |
    </nobr>
  </details>
  `

  markdownString += `\n\n---\n\n---\n\n*Focus object:*\n\n---\n\n`
  markdownString += `## ${curobject?.name}\n\n`
  markdownString += 'Name: ' + curobject?.name + '\n\n'
  markdownString += 'Description: ' + curobject?.description + '\n\n'
  markdownString += '***Modelview :***\n\n'

  markdownString += `![${svgFileName}](/Users/snorrefossland/Downloads/${svgFileName})\n\n`
  markdownString += `\n\n#### Children:\n\n---\n\n`


  if (debug) console.log('82 MarkdownEditor.tsx', markdownString)

  const mdFocusObjectProps = {
    title: 'My Object Details',
    curRelatedObjsRels: objectChildren,
    curmodelview: curmodelview,
    curmetamodel: curmetamodel,
    selectedId,
    setSelectedId,
    curobject: curobject || curmodelview,
    curtoobjects: objectChildren,
    objects: objects,
    includedKeys: ['name', 'description'],
    setObjview,
    markdownString,
  };

  // console.log('97 MarkdownEditor.tsx', mdFocusObjectProps )

  let markdownStringChildren = ObjDetailToMarkdown(mdFocusObjectProps)


  if (debug) console.log('101 MarkdownEditor.tsx', markdownStringChildren)

  const handleAddFooter = () => {
    setMdFooterString(
      `
      \n\n --- \n\n  ---  

      <hr style="background: gray" />  

      <hr style="background: green" />  

      <span style="color: green">  
        Keep striving for progress over perfection! A little progress every day will go a very long way!" :)   
      </span>  
      
      [( Dave Gray )](https://youtube.com/@DaveGrayTeachesCode)
      
      <hr style="background: green" /> 

     Here's an image:

      ![Alt text](https://via.placeholder.com/150 "Optional title")
    `
    )
  };

  const CodeBlock = ({ language, value }: { language: string, value: string }) => {
    return (
      <pre>
        <code className={`language-${language}`}>{value}</code>
      </pre>
    );
  };

  const LinkRenderer = ({ href, children }: { href: string, children: React.ReactNode }) => {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  };

  const ImageRenderer = ({ src, alt }: { src: string, alt: string }) => {
    return <img src={src} alt={alt} />;
  };

  const options = {
    overrides: {
      code: CodeBlock,
      a: LinkRenderer,
      img: ImageRenderer,
    },
  };

  const handleSaveToFile = () => {
    const element = document.createElement("a");
    const file = new Blob([mdString], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = mdFileName;
    document.body.appendChild(element);
    element.click();
  };

  const handleSaveToGithub = async () => {
    const url = `https://api.github.com/repos/${githubRepo}/contents/${githubPath}`;
    const content = btoa(mdString);
    const message = `Add ${githubPath}`;
    const branch = githubBranch;
    const token = githubToken;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        content,
        branch,
      }),
    });

    if (response.ok) {
      alert('File saved to GitHub!');
    } else {
      alert('Error saving file to GitHub.');
    }
  };

  // useEffect (() => {
  //  curobject = curmodelview
  // }, [])

  useEffect(() => {
    setMdString(markdownString)
  }, [curobject])

  useEffect(() => {
    setMdString(markdownStringChildren)
    if (debug) console.log('222 MarkdownEditor.tsx', markdownStringChildren)
  }, [markdownStringChildren])

  useEffect(() => {
    setMdString(mdHeaderString + mdString)
  }, [mdHeaderString])

  useEffect(() => {
    setMdString(mdString + mdFooterString)
  }, [mdFooterString])

  return (
    <div className="App" >
      <Tabs >
        <TabList style={{ borderRight: '1px solid gray', borderLeft: '1px solid gray', margin: '0px' }}>
          <Tab>Preview</Tab>
          <Tab>MarkDownCode</Tab>
          <Tab>GitHub</Tab>
        </TabList>
        <TabPanel style={{ borderRight: '1px solid gray', borderLeft: '1px solid gray', overflowX: 'auto' }}>
          <div className="container bg-white" style={{ borderRight: '1px solid gray', borderLeft: '1px solid gray', maxHeight: "70vh", overflowX: 'auto' }}>
            <Markdown options={options}>
              {mdString}
            </Markdown>
          </div>
        </TabPanel>
        <TabPanel style={{ borderRight: '1px solid gray', borderLeft: '1px solid gray', overflowX: 'auto' }}>
          <textarea style={{ margin: '4px', padding: '4px', border: 'none', height: "68vh", maxHeight: "64vh", width: '100%' }} value={mdString} onChange={(e) => setMdString(e.target.value)} />
          <hr />
          <button className="btn btn-sm mx-2" onClick={handleAddObjectHeader}>Add Header</button>
          <button className="btn btn-sm mx-2 me-5" onClick={handleAddFooter}>Add Footer</button>
          <button className="btn btn-sm mx-2 ms-5" onClick={handleSaveToFile}>Save to File</button>
        </TabPanel>
        <TabPanel style={{ borderRight: '1px solid gray', borderLeft: '1px solid gray' }}>
          <div className="container">
            <FormGroup>
              <Label for="githubToken">GitHub Token:</Label>
              <Input type="text" id="githubToken" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label for="githubRepo">GitHub Repository:</Label>
              <Input type="text" id="githubRepo" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label for="githubPath">GitHub Path:</Label>
              <Input type="text" id="githubPath" value={githubPath} onChange={(e) => setGithubPath(e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label for="githubPath">GitHub Filename:</Label>
              <Input type="text" id="githubPath" value={githubPath} onChange={(e) => setGithubPath(e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label for="githubBranch">GitHub Branch:</Label>
              <Input type="text" id="githubBranch" value={githubBranch} onChange={(e) => setGithubBranch(e.target.value)} />
            </FormGroup>
            <div className="d-flex justify-content-end">
              <Button className="btn btn-sm m-2" color="primary" onClick={handleSaveToGithub}>Save to GitHub</Button>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}

export default MarkdownEditor;