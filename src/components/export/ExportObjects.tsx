// This is a React component that displays details of a selected object in a tabbed interface.
// It allows the user to edit the object's properties and view related objects.
import React, { useRef,useContext, useState, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useSelector, useDispatch } from 'react-redux'
import Markdown from 'markdown-to-jsx';

import {ObjDetailTable} from '../forms/ObjDetailTable';
import ObjectDetails from '../forms/ObjectDetails';
// import { RelatedFromObjects } from './RelatedFromObjects';
import { ObjectToCsv } from './ObjectCsv';

import { FaPlaneArrival, FaCompass } from 'react-icons/fa';
import Selector from '../utils/Selector'
import 'react-tabs/style/react-tabs.css';
// import PopupAMsg from '../utils/PopupAMsg';

const debug = false

const ExportObjects = (props) => {
    if (debug) console.log('17 context', props, props.props.reportType, props.props.modelInFocusId)
    // let props.= useSelector((props.any) => props. // Selecting the whole redux store
    const dispatch = useDispatch()

    const [mdString, setMdString] = useState('Your markdown string here');
    const [isCopied, setIsCopied] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const handleClose = () => setShowModal(false);

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
  };


    const ph = props.props.props || props.props
    const reportType = props.props.reportType  // if reportType = 'task' then focusObject is a task focusTask
    const modelInFocusId = props.props.modelInFocusId // if reportType = 'task' then focusObject.id is a focusTask.id
    if (debug) console.log('25 Context:', reportType, modelInFocusId, ph?.phData);

    if (!ph?.phData?.metis?.models) return <></>

    const [value, setValue] = useState("");
    // const [visibleContext, setVisibleContext] = useState(true);
    const [formValues, setFormValues] = useState({});


    const models = ph.phData?.metis?.models  // selecting the models array

    const metamodels = ph.phData?.metis?.metamodels  // selecting the models array
    const curmetamodel = metamodels?.find(mm => mm.id === models?.find(m => m.id === modelInFocusId)?.metamodelRef)

    // const curmodel = modelInFocus
    const curmodel = models?.find((m: any) => m?.id === modelInFocusId)

    if (debug) console.log('53 Context:', curmodel, curmodel.objects)

    const modelviews = curmodel?.modelviews //.map((mv: any) => mv)
    const objects = curmodel?.objects //.map((o: any) => o)

    const focusModel =  (reportType === 'task') ?  models.find(m => m.id === modelInFocusId) :  ph?.phFocus.focusModel    // selecting the models array current model or task model (generated from model)
    const focusUser = ph.phUser?.focusUser
    const focusModelview =  ph.phFocus?.focusModelview // if task we use the first modelview (it should be generated with the generatedFrom)
    const focusObjectview = ph.phFocus?.focusObjectview
    const focusTask = ph.phFocus?.focusTask
    const focusObject = (reportType === 'task') ? ph.phFocus.focusTask :  ph.phFocus?.focusObject

    const curobjectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews 
    const currelshipviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.relshipviews 
    const currelationships = curmodel?.relships.filter(r => currelshipviews?.find(crv => crv.relshipRef === r.id))
    if (debug) console.log('62 Context:', focusModelview?.id, curobjectviews,  modelviews,  modelviews?.find(mv => mv.id === focusModelview?.id),currelshipviews, currelationships, curobjectviews, focusModelview.id, modelviews);
    const curmodelview = modelviews?.find(mv => mv.id === focusModelview?.id)
    if (debug) console.log('64 Context:', curmodel, modelviews, objects, curobjectviews, currelshipviews, currelationships, curmodelview, focusModelview?.id, focusModelview, focusObjectview?.id, focusObjectview, focusObject?.id, focusObject, focusTask?.id, focusTask);

    const curobject = objects?.find(o => o.id === focusObject?.id) 
    // const curobject = (props.reportType === 'task') ? objects?.find(o => o.id === focusTask?.id) : objects?.find(o => o.id === focusObject?.id) 
    if (debug) console.log('67 Context:', curobject, objects, focusObject?.id, focusObject, focusTask?.id, focusTask);

    // add refersTo relationship as a propLink
    // find refersTo relationship type
    const refersTo = curmetamodel?.relshiptypes?.find(ot => ot.name === 'refersTo')
    const refersTorelships = currelationships.filter(r => r.typeRef === refersTo?.id) // find all relships with type refersTo
    // filter out the fromTo as current object
    const fromRefersToObectRels = refersTorelships.filter(r => r.fromobjectRef === curobject.id)
    const refersToObjects = fromRefersToObectRels.map(r => objects.find(o => o.id === r.toobjectRef)) // find objects in the other end of the relationship
    const propLinkTemp = refersToObjects.map(o => ({...o, refGroupType: o.name, type: 'PropLink'}))
    if (debug) console.log('73 Context:', currelationships ,refersTo ,refersTorelships, fromRefersToObectRels, refersToObjects, propLinkTemp);

  
    // useEffect(() => {
    // }, []);

    // const handlePopupAMsg = () => {
    //   // setMdString('Your markdown string here');
    //   setShowModal(true);
    //   if (debug) console.log('88 popupAMsg', mdString, showModal);
    // }
    
    // const MDEditor = dynamic(
    //   () => import("@uiw/react-md-editor"),
    //   { ssr: false }
    // );

    // remove duplicate objects
    const uniqueovs = curobjectviews?.filter((ov, index, self) =>
      index === self.findIndex((t) => (
        t.place === ov.place && t.id === ov.id
      ))
    ) || []

    const curmm = metamodels?.find(mm => (mm) && mm.id === (curmodel?.metamodelRef))
    
    // find object with type
    const type = (metamodels, model, objects, curov) => {                                                                                                                                                                                          
      const mmod = metamodels?.find(mm => (mm) && mm.id === model.metamodelRef)
      const o = objects.find(o => o.id === curov.objectRef)
      // if (debug) console.log('37 SelectContext :', curov.objectRef, objects, o, mmod.objecttypes.find(ot => ot.id === o?.typeRef === ot.id));
      const type = mmod?.objecttypes?.find(ot => ot.name && o?.typeRef === ot.id)?.name
      // if (debug) console.log('43 SelectContext', mmod.objecttypes.name, o, type);
      return type
    }
    
    // if (!curobject) curobject = curmodelview
    const curobjModelviews = curmodel.modelviews.filter(cmv => cmv.objectviews?.find(cmvo => (cmvo)) &&  ({id: cmv.id, name: cmv.name}))
    if (debug) console.log('115 Context',  curobjModelviews, curmodel.modelviews, curobjectviews, curobject);
    // const curobjviewModelviews = curmodel.modelviews.filter(cmv => cmv.objectRef === curobject.id).map(vmv => ({id: vmv.id, name: vmv.name}))
    // find parent object

    const curobjectview = curobjectviews?.find(ov => ov.id === focusObjectview?.id) //|| modelviews.find(mv => mv.id === focusModelview?.id)
    if (debug) console.log('123 Context', curobjectview, curobjectviews, focusObjectview, focusModelview);
    const parentobjectview = curobjectviews?.find(ov => ov.id === curobjectview?.group) || null
    let parentobject =  objects?.find(o => o.id === parentobjectview?.objectRef)
    parentobject = objects?.find(o => o.id === parentobjectview?.objectRef)
    if (debug) console.log('58 Context', parentobjectview);
    if (debug) console.log('58 Context', parentobject);

    // functions to find objects and objectviews etc ----------------------------------------------------------------------
    function findObjectviewsWithCurrentObjectview(objectviews: any[], currentObjectviewId: string): any[] {
      return objectviews?.filter((objectview) => objectview.group === currentObjectviewId) || [];
    }
  
    function findObjectsForObjectviews(objectviews: any[], objects: any[]): any[] {
      return objectviews?.map((objectview) => objects?.find((object) => object.id === objectview.objectRef)) || [];
    }

    function findObjectTypesForObjectviews(objectviews: any[], objects: any[], metamodels: any[], curmodel: any): any[] {
      return objectviews?.map((objectview) => {
        const object = objects?.find((object) => object.id === objectview.objectRef)
        const metamodel = metamodels.find((mm) => mm.id === curmodel.metamodelRef)
        const objecttype = metamodel.objecttypes.find((ot) => ot.id === object?.typeRef)
        return objecttype
      }) || [];
    }

    function findRelationshipsForObjectviews(objectviews: any[], relationships: any[]): any[] {
      return objectviews?.map((objectview) => relationships.find((relationship) => relationship.id === objectview.relationshipRef)) || [];
    }

    function findTypeviewForcurrentObjecttype(objecttype: any, objecttypeviews: any[]): any[] {
      return objecttypeviews?.find((tv) => tv.typeRef === objecttype?.id) || [];
    }
  
    let objectviewChildren = (curobjectview) ? findObjectviewsWithCurrentObjectview(curobjectviews, curobjectview?.id) : curmodelview?.objectviews; 
    let objectChildren = findObjectsForObjectviews(objectviewChildren, objects);
    if (debug) console.log('227 Context',  curobjectview, curmodelview?.objectviews);
    if (debug) console.log('228 Context', objectviewChildren);
    if (debug) console.log('229 Context', objectChildren);

    // find related objects
    const curRelatedFromObectRels = currelationships?.filter(r => r?.fromobjectRef === curobject?.id)
    const curRelatedToObectRels = currelationships?.filter(r => r?.toobjectRef === curobject?.id)
    if (debug) console.log('211 Context', currelationships, curRelatedFromObectRels, curRelatedToObectRels);

    const curobjecttype = findObjectTypesForObjectviews(curobjectviews, objects, metamodels, curmodel).find(ot => ot?.id === curobject?.typeRef)
    if (debug) console.log('216 Context', curobjecttype);
    const curobjtypeview = findTypeviewForcurrentObjecttype(curobjecttype, curmm.objecttypeviews) 
    if (debug) console.log('237 Context', curobjtypeview, curobjecttype, curmm);

    const [activeTab, setActiveTab] = useState(0);
    const [activeTab2, setActiveTab2] = useState(0);

    const setObjview = (o) => {
      let ovdata =  (o) ? curobjectviews.find(ov => ov?.objectRef === o?.id) : {id: '', name: 'no objectview selected'}
      let odata = (o) ? {id: o.id, name: o.name} : {id: '', name: 'no object selected'}
      if (debug) console.log('246 setObjview', ovdata, odata )
      dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: ovdata })
      dispatch({ type: 'SET_FOCUS_OBJECT', data: odata })
    }

    const includedKeysAllTypeview = (curobjtypeview) && Object.keys(curobjtypeview).reduce((a, b) => a.concat(b), [])
    const includedKeysAllObjType = (curobjecttype) && Object.keys(curobjecttype).reduce((a, b) => a.concat(b), [])
    const includedKeysAllObjview = (curobjectview) && Object.keys(curobjectview).reduce((a, b) => a.concat(b), [])
    const includedKeysAllExept = (curobjectview) && Object.keys(curobjectview).filter(key => ![ 'name', 'description', 'typeName', 'typeDescription', 'objectRef', ].includes(key))
    const includedKeysMain = [ 'name', 'description', '$id', '$schema', '$ref', 'x-osdu-license', 'x-osdu-review-status', 'x-osdu-schema-source', 
      '----','externalID', 'groupType', 'osduId', 'osduType','id', 'proposedType', 'typeName', 'typeDescription',
      'fillcolor', 'fillcolor2', 'strokecolor','icon', 'image'
    ];
    const includedKeyskOSDU = [ 'version', 'name', 'title', 'description', 'groupType','governanceModel', 'governaceAuthorities', 'fileFormats'];
    const includedKeysMore = ['category', 'generatedTypeId', 'nameId', 'copedFromId', 'abstract',  'ports', 'propertyValues', 'valueset',
        'markedAsDeleted', 'modified',  'sourceUri',  'relshipkind','Associationvalueset','copiedFromId', 'typeRef','typeName', 'typeDescription']
    // const includedKeysMain = ['id', 'name', 'description', 'proposedType', 'typeName', 'typeDescription'];
    // , $id, $schema, $ref, externalID, groupType, osduId, osduType, x-osdu-license, x-osdu-review-status, x-osdu-schema-source

    const objectPropertiesMain = (curobject) && Object.keys(curobject).filter(key => includedKeysMain.includes(key)).sort((a, b) => includedKeysMain.indexOf(a) - includedKeysMain.indexOf(b));
    const objectPropertiesOsdu = (curobject) && Object.keys(curobject).filter(key => includedKeyskOSDU.includes(key)).sort((a, b) => includedKeyskOSDU.indexOf(a) - includedKeyskOSDU.indexOf(b));

    const objectPropertiesMore = (curobject) && Object.keys(curobject).filter(key => includedKeysMore.includes(key));

    const csvheader1 = 'Version	Object Name	Title	Description	Group Type	Governance Model	Governance Authorities	Supported File Formats	Superseding Kind											Action	Priority				State	Object Name	Title	Description	Group Type	Governance Model	Governance Authorities	Supported File Formats'.split('\t');
    const csvheader3 = '	Properties								Attribution			References				Behaviors			Proposals						Final Output													'.split('\t');
    const csvheader4 = 'No	Name	Title	Description	Type	Format	Frame of Reference	Constant	Example	Authority	Publication	Revision	Referenced Object	RO Version	RO Group Type	Existing Standard	Is Required?	Is Derived?	Is Indexed?	Action	Priority	Proposal	Operators	Additional Comments	State	Name	Title	Description	Type	Format	Frame of Reference	Constant	Example	Referenced Object	RO Version	RO Group Type	Is Required?	Is Derived?	Is Indexed?'.split('\t');
 
    const titles = (objectPropertiesOsdu) && Object.values(objectPropertiesOsdu);
    const values = titles?.map(v => curobject[v]);
    if (debug) console.log('214 keys1', values);

    const valueList = ObjectToCsv({obj: csvheader3}).valueList

    if (debug) console.log('194 objecstodiv', valueList);
    const lineNo = 5;

    const relatedToObjects = curRelatedFromObectRels.map((objrel: any) => objects.find((o: any) => o.id === objrel.toobjectRef));

    // escape semicolon in values of relatedToObjects

  
    if (!debug) console.log('229 relatedToObjects', curRelatedFromObectRels,  curRelatedToObectRels, relatedToObjects, currelationships);

    const relatedObjList = relatedToObjects.map((toObj: any, index) => (
      `\n ${index+1
      };${toObj.name
      };${(toObj.title) ? toObj.title : ""
      };${(toObj.description) ? `"${toObj.description}"` : ""
      };${(toObj.type) ? toObj.dataType : ""
      };${(toObj.pattern) ? toObj.pattern : ""
      };${(toObj.frameOfReference) ? toObj['x-osdu-frame-of-reference'] : ""
      };${(toObj.constant) ? toObj.constant : ""
      };${(toObj.example) ? toObj.example : ""
      // };${(toObj.example) ? toObj.example : ""
      };${(toObj.Authority) ? toObj.Authority : ""
      };${(toObj.Publication) ? toObj.Publication : ""
      };${(toObj.Revision) ? toObj.Revision : ""
      };${(toObj.referenceObject) ? toObj.referenceObject : (toObj.typeName === 'OSDUType') ? toObj.name.split('.')[0] : ""
      };${(toObj.ROVersion) ? toObj.ROVersion : toObj.name.split('.').slice(1).join('.')
      };${(toObj.referenceObject && toObj.refGroupType) ? toObj.refGroupType : (toObj.typeName === 'OSDUType') ? toObj.groupType : ""
      };${(toObj.ExistingStandard) ? toObj.ExistingStandard : ""
      };${(toObj.IsRequired) ? toObj.IsRequired : ""
      };${(toObj.IsDerived) ? toObj.IsDerived : ""
      };${(toObj.IsIndexed) ? toObj.IsIndexed : ""
      };${(toObj.Action) ? toObj.Action : ""
      };${(toObj.Priority) ? toObj.Priority : ""
      };${(toObj.Proposal) ? toObj.Proposal : ""
      };${(toObj.Operators) ? toObj.Operators : ""
      };${(toObj.AdditionalComments) ? `"${toObj.AdditionalComments}"` : ""
      };${(toObj.State) ? toObj.State : ""
      };"=IF(ISBLANK(B${lineNo + index});"""";B${lineNo + index
      })";"=IF(ISBLANK(C${lineNo + index});"""";C${lineNo + index
      })";"=IF(ISBLANK(D${lineNo + index});"""";D${lineNo + index
      })";"=IF(ISBLANK(E${lineNo + index});"""";E${lineNo + index
      })";"=IF(ISBLANK(F${lineNo + index});"""";F${lineNo + index
      })";"=IF(ISBLANK(G${lineNo + index});"""";G${lineNo + index
      })";"=IF(ISBLANK(H${lineNo + index});"""";H${lineNo + index
      })";"=IF(ISBLANK(J${lineNo + index});"""";J${lineNo + index
      })";"=IF(ISBLANK(K${lineNo + index});"""";K${lineNo + index
      })";"=IF(ISBLANK(L${lineNo + index});"""";L${lineNo + index
      })";"=IF(ISBLANK(M${lineNo + index});"""";M${lineNo + index
      })";"=IF(ISBLANK(N${lineNo + index});"""";N${lineNo + index
      })";"=IF(ISBLANK(O${lineNo + index});"""";O${lineNo + index
      })";"=IF(ISBLANK(P${lineNo + index});"""";P${lineNo + index
      })"`
      )
    );
    // const relatedObjList = relatedObjListtmp.map(l => l.replace(/semicolon/g, ';'));

     


    if (debug) console.log('222 relatedToObjects', relatedObjList);
    
    let csvString = `${ObjectToCsv({obj: csvheader1}).valueList}\n`;
    csvString += `${ObjectToCsv({obj: values}).valueList}\n`;
    csvString += `${ObjectToCsv({obj: csvheader3}).valueList}\n`;
    csvString += `${ObjectToCsv({obj: csvheader4}).valueList}`;
    csvString += relatedObjList;
    csvString += "\n";

    // Add a Byte Order Mark (BOM) to the beginning of the CSV string
    // csvString = "\uFEFF" + csvString;



    // console.log('214 keys1', setMdString, contentDiv);
    const tabsDiv = (
      <>
      <Tabs  onSelect={index => setActiveTab(index)}>
        <TabList className="">
          <Tab>CSV</Tab>
        </TabList>
        <TabPanel className="main-properties bg-light p-2 m-0" > {/* Main properties */}
        EntityType:
        <div className="d-flex adjust-content-between align-items-center"><span className="fs-4">{curobject.name}</span><span className="ms-auto me-4">version:</span>
        </div> 
        <pre className=" text-white p-2 m-1" style={{maxHeight: "50vh", backgroundColor: "#666"}} >
            <code>
            {csvString}
            </code>
        </pre>
        <CopyToClipboard text={csvString} onCopy={handleCopy}>
            <button className="btn btn-sm bg-secondary text-white mx-1 px-3">
                {isCopied ? 'Copied!' : 'Copy csv to clipboard'}
            </button>
        </CopyToClipboard>
        <button className="btn btn-sm bg-light border border-dark text-dark px-3 ms-4" 

              onClick={() => setShowModal(true)}
          >? How to paste the csv into a Spreadsheet</button>
          {/* {(showModal) && <PopupAMsg showModal={!showModal} />} */}
        </TabPanel>
      </Tabs>
      <div>
        <Modal show={showModal} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>How to paste CSV into a spreadsheet</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-light m-2 p-2">
            <h5>Paste the data into the spreedsheet</h5>
            <div>1. Open a new spreadsheet in Microsoft Excel.</div>
            <div>3. Click on the first cell (A1), and then paste (Ctrl+V or Command+V) <br /> (It should be pased as text.
             If all text is on only one line, press (Ctrl+Z) to undo the paste  <br /> and then paste again (Ctrl+V or Command+V and then press T) to paste as text. 
            </div>
            <div>4. Your csv data should now be populated into the spreadsheet.</div>
            .
            <h5>Format the spreadsheet</h5>
            <div>If you have access to the OSDU-standard formattet spreadsheet,<br />  you can use the following procedure to copy paste the format.<br /> <br /> </div>
            <div>1. Open a standard OSDU-spreadsheet.</div>
            <div>2. (Right-click the small square in upper left corner and select "Copy") 
             <br />  - It is the small square left of col A and above row no. 1 </div>
            <div>3. Return to your new spreadsheet and (Right-click the same upper left corner area) </div>
            <div>5. Select "Paste Special" and then "Formatting"</div>
            <div>6. Select the whole line 4 (Click on the no. 4)</div>
            <div>7. In the menu "Data" select "Filter"</div>
            <div>You can also freeze the upper 4 rows and the left 4 columns</div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
      </>
    )

    return (
        <div className="context m-0" style={{ maxHeight: '78vh', minWidth: '686px', maxWidth: '800px', width: 'auto', height: '78vh', overflowY: 'auto' }} >
          <div className="context-tabs border border-dark rounded bg-transparent mx-1" style={{ height: 'auto'}}>
            {tabsDiv} 
          </div>
        </div>
    )
}
export default ExportObjects 
