import { useEffect, useState } from "react";
import { useSelector } from 'react-redux'
import { saveAs } from "file-saver";
import Markdown from 'markdown-to-jsx';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { FormGroup, Label, Input, Button } from 'reactstrap';

import ObjDetailToMarkdown from "./MdFocusObject";
import FocusParametersForm from "./EditFocusParameter";

const debug = false

function MarkdownEditor({ value, props }: MarkdownEditorProps) {
  // const [markdownString, setMarkdownString] = useState('# My Markdown Document\n\nThis is a paragraph of text.');
  console.log('18 MarkdownEditor.tsx', props);
  const ph = props
  const [mdHeaderString, setMdHeaderString] = useState('');
  const [mdString, setMdString] = useState('');
  const [mdFooterString, setMdFooterString] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [githubPath, setGithubPath] = useState('my-markdown-file.md');

  const [selectedId, setSelectedId] = useState('');
  const [objview, setObjview] = useState(null);

  const metamodels = useSelector(state => props.phData?.metis?.metamodels)  // selecting the models array
  const focusModel = useSelector(state => props.phFocus?.focusModel) 
  const focusUser = useSelector(state => props.phUser?.focusUser)
  const focusModelview = useSelector(state => props.phFocus?.focusModelview)
  const focusObjectview = useSelector(state => props.phFocus?.focusObjectview)
  const focusObject = useSelector(state => props.phFocus?.focusObject)

  const models = useSelector(state => props.phData?.metis?.models)  // selecting the models array
  const curmodel = models?.find((m: any) => m?.id === focusModel?.id) || models[0]
  const modelviews = curmodel?.modelviews //.map((mv: any) => mv)
  const objects = curmodel?.objects //.map((o: any) => o)
  const curobjectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews 
  const currelshipviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.relshipviews 
  const currelationships = curmodel?.relships.filter(r => currelshipviews?.find(crv => crv.relshipRef === r.id))
  if (!debug) console.log('38 Context', focusModelview?.id, curobjectviews,  modelviews,  modelviews?.find(mv => mv.id === focusModelview?.id),currelshipviews, currelationships, curobjectviews, focusModelview.id, modelviews);
  const curmodelview = modelviews?.find(mv => mv.id === focusModelview?.id)
  const curmetamodel = metamodels?.find(mm => (mm) && mm.id === (curmodel?.metamodelRef))

  let curobject = objects?.find(o => o.id === focusObject?.id)
  let objectviewChildren = []
  let objectChildren = []
  console.log('45 Context',  curobjectviews, focusModelview.id, );
  const curobjectview = curobjectviews?.find(ov => ov.id === focusObjectview?.id) //|| modelviews.find(mv => mv.id === focusModelview?.id)
  if (!debug) console.log('47 Context',  curobjectviews, curobjectview.id, focusModelview);
  console.log('48 Context', curobjectviews?.filter(ov => ov.group === curobjectview?.id) )

  function findObjectviewsWithCurrentObjectview(objectviews: any[], currentObjectviewId: string): any[] {
    return objectviews?.filter((objectview) => objectview.group === currentObjectviewId) || [];
  }

  function findObjectsForObjectviews(objectviews: any[], objects: any[]): any[] {
    return objectviews?.map((objectview) => objects.find((object) => object.id === objectview.objectRef)) || [];
  }

  objectviewChildren = findObjectviewsWithCurrentObjectview(curobjectviews, curobjectview?.id);
  objectChildren = findObjectsForObjectviews(objectviewChildren, objects);
  if (!debug) console.log('75 Context', curobjectview?.name, objectviewChildren, objectChildren);

  const title = 'children'


  const handleAddObjectHeader = () => {
    setMdHeaderString(` ${props.phFocus.focusProj?.name} \n\n --- \n\n`);
  };

  let markdownString = `Markdown Report from AKM Modeller \n\n --- \n\n
 ***Organisation:*** ${props.phFocus.focusProj?.org|| props.phFocus.focusOrg?.name} |
 ***Repository:***${props.phFocus.focusProj?.repo} |
 ***Path:*** ${props.phFocus.focusProj?.path} |
 ***Project file:*** ${props.phFocus.focusProj?.file}\n
 ***Branch:***${props.phFocus.focusProj?.branch} | `
  
  markdownString += `\n\n --- \n\n Focus object: \n\n #### ${curobject?.name}\n\n`
  markdownString += 'Name: ' + curobject?.name + ' \n\n'
  markdownString += '***Description:*** ***'+ curobject?.description +'*** \n\n'
  if (!debug) console.log('82 MarkdownEditor.tsx', markdownString)

  const mdFocusObjectProps = {
    title: 'My Object Details',
    curRelatedObjsRels: objectChildren,
    curmodelview: curmodelview,
    curmetamodel: curmetamodel,
    selectedId,
    setSelectedId,
    curobject: curobject,
    objects: objects,
    includedKeys: [ 'name', 'description'],
    setObjview,
    markdownString,
  };

  // console.log('97 MarkdownEditor.tsx', mdFocusObjectProps )

  let markdownStringChildren = ObjDetailToMarkdown(mdFocusObjectProps)

  // console.log('101 MarkdownEditor.tsx', markdownString )
  const handleAddFooter = () => {
    setMdFooterString(`\n\n---\n\n  ---  
  <hr style="background: gray" />  
  <hr style="background: green" />  
  <span style="color: green">  
  Keep striving for progress over perfection! A little progress every day will go a very long way!" :)   
  </span>  
  
  [( Dave Gray )](https://youtube.com/@DaveGrayTeachesCode)
  
  <hr style="background: green" /> 

  ---

# Test Markdown

---

This is a paragraph of text.

| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| test 1 | Row 1 | --- |
| test 1 | Row 2 | --- |

---

Here's an image:

![Alt text](https://via.placeholder.com/150 "Optional title")

`)};

  const CodeBlock = ({ language, value }) => {
    return (
      <pre>
        <code className={`language-${language}`}>{value}</code>
      </pre>
    );
  };

  const LinkRenderer = ({ href, children }) => {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  };

  const ImageRenderer = ({ src, alt }) => {
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
    element.download = "my-markdown-file.md";
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



  useEffect(() => {
    setMdString(markdownStringChildren )
  }, [markdownStringChildren])
  
  useEffect(() => {
    setMdString( mdHeaderString + mdString )
  }, [mdHeaderString])
  
  useEffect(() => {
    setMdString( mdString + mdFooterString)
  }, [mdFooterString])
  
  return (
    
    <div className="App" >

      <Tabs >
        <TabList style={{ borderRight: '1px solid gray', borderLeft: '1px solid gray', margin: '0px' }}>
          <Tab>Preview</Tab>
          <Tab>MarkDownCode</Tab>
          <Tab>GitHub</Tab>
        </TabList>

        <TabPanel style={{ borderRight: '1px solid gray', borderLeft: '1px solid gray' }}>
          <div className="container">
            <Markdown options={options}>
              {mdString}
            </Markdown>
          </div>
        </TabPanel>

        <TabPanel style={{ borderRight: '1px solid gray', borderLeft: '1px solid gray' , overflowX: 'hidden' }}>
          <textarea style={{ margin: '4px', padding: '4px', border: 'none', height: "76vh",  width: '100%' }} value={mdString} onChange={(e) => setMdString(e.target.value)} />
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
              <Label for="githubBranch">GitHub Branch:</Label>
              <Input type="text" id="githubBranch" value={githubBranch} onChange={(e) => setGithubBranch(e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label for="githubPath">GitHub Path:</Label>
              <Input type="text" id="githubPath" value={githubPath} onChange={(e) => setGithubPath(e.target.value)} />
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