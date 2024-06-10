// This is a React component that displays details of a selected object in a tabbed interface.
// It allows the user to edit the object's properties and view related objects.
import React, { useRef, useContext, useState, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useSelector, useDispatch } from 'react-redux'
import Markdown from 'markdown-to-jsx';

import { ObjDetailTable } from '../forms/ObjDetailTable';
import ObjectDetails from '../forms/ObjectDetails';
// import { RelatedFromObjects } from './RelatedFromObjects';
import { ObjectToCsv } from './ObjectCsv';

import { FaPlaneArrival, FaCompass } from 'react-icons/fa';
import Selector from '../utils/Selector'
import 'react-tabs/style/react-tabs.css';
// import PopupAMsg from '../utils/PopupAMsg';

const debug = false

const ExportObjects = ({ ph, reportType, modelInFocusId, edit }: { ph: any, reportType: any, modelInFocusId: any, edit: any }) => {
  if (debug) console.log('17 context', ph, reportType, modelInFocusId)
  // let props.= useSelector((props.any) => props. // Selecting the whole redux store
  const dispatch = useDispatch()

  const [mdString, setMdString] = useState('Your markdown string here');
  const [isCopied, setIsCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
  };

  console.log('20 context', ph);

  if (debug) console.log('25 Context:', reportType, modelInFocusId, ph?.phData);


  const [value, setValue] = useState("");
  // const [visibleContext, setVisibleContext] = useState(true);
  const metamodels = ph?.phData?.metis?.metamodels
  const models = ph?.phData?.metis?.models
  const model = (reportType === 'task') ? models?.find((m: any) => m.id === modelInFocusId) : models?.find((m: any) => m.id === ph.phFocus.focusModel.id)
  const curmodel = models?.find((m: any) => m.id === modelInFocusId)
  const objects = curmodel?.objects
  const modelviews = curmodel?.modelviews

  const relationships = curmodel?.relships
  const curmetamodel = metamodels?.find((mm: any) => mm.id === model.metamodelRef)
  const curobjectviews = modelviews?.filter((mv: any) => mv.modelRef === modelInFocusId)

  const focusObjectview = ph.phFocus.focusObjectview
  const focusObject = ph.phFocus.focusObject
  const focusTask = ph.phFocus.focusTask
  const focusModelview = ph.phFocus.focusModelview

  // const focusObjectview = useSelector((state: any) => state.focusObjectview)
  // const focusObject = useSelector((state: any) => state.focusObject)
  // const focusTask = useSelector((state: any) => state.focusTask)
  // const focusModelview = useSelector((state: any) => state.focusModelview)


  const curmodelview = modelviews?.find((mv: any) => mv.id === focusModelview?.id)
  
  const currelationships = curmodelview?.relshipviews.map((rv: any) => relationships?.find((r: any) => r.id === rv.relshipRef) )
  const curmm = metamodels?.find((mm: any) => mm.id === model.metamodelRef)
  const curobject = (reportType === 'task') ? objects?.find((o: any) => o.id === focusTask?.id) : objects?.find((o: any) => o.id === focusObject?.id)

  const refersTo = curmetamodel?.relshiptypes?.find((ot: any) => ot.name === 'refersTo');

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
  // const uniqueovs = curobjectviews?.filter((ov, index, self) =>
  //   index === self.findIndex((t) => (
  //     t.place === ov.place && t.id === ov.id
  //   ))
  // ) || []

  const type = (metamodels: any[], model: any, objects: any[], curov: any) => {
    const mmod = metamodels?.find((mm: any) => (mm) && mm.id === model.metamodelRef)
    const o = objects.find((o: any) => o.id === curov.objectRef)
    const type = mmod?.objecttypes?.find((ot: any) => ot.name && o?.typeRef === ot.id)?.name
    return type
  }
  // const curobjviewModelviews = curmodel.modelviews.filter(cmv => cmv.objectRef === curobject.id).map(vmv => ({id: vmv.id, name: vmv.name}))
  // find parent object

  const curobjectview = curobjectviews?.find((ov: any) => ov.id === focusObjectview?.id) //|| modelviews.find(mv => mv.id === focusModelview?.id)
  if (debug) console.log('123 Context', curobjectview, curobjectviews, focusObjectview, focusModelview);
  const parentobjectview = curobjectviews?.find((ov: any) => ov.id === curobjectview?.group) || null
  const parentobject = objects?.find((o: any) => o.id === parentobjectview?.objectRef)
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
      const objecttype = metamodel.objecttypes.find((ot: any) => ot.id === object?.typeRef)
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
  if (debug) console.log('227 Context', curobjectview, curmodelview?.objectviews);
  if (debug) console.log('228 Context', objectviewChildren);
  if (debug) console.log('229 Context', objectChildren);

  // find related objects
  const curRelatedFromObjectRels = currelationships?.filter((r: any) => r?.fromobjectRef === curobject?.id)
  const curRelatedToObjectRels = currelationships?.filter((r: any) => r?.toobjectRef === curobject?.id)
  if (debug) console.log('211 Context', currelationships, curRelatedFromObjectRels, curRelatedToObjectRels);

  const curobjecttype = findObjectTypesForObjectviews(curobjectviews, objects, metamodels, curmodel).find((ot: any) => ot?.id === curobject?.typeRef)
  const curobjtypeview = findTypeviewForcurrentObjecttype(curobjecttype, curobjectviews)
  if (debug) console.log('216 Context', curobjecttype);
  const includedKeysAllTypeview = (curobjtypeview) && Object.keys(curobjtypeview).reduce((a, b) => a.concat([b]), [] as string[])
  const includedKeysMore = ['category', 'generatedTypeId', 'nameId', 'copedFromId', 'abstract', 'ports', 'propertyValues', 'valueset',
    'markedAsDeleted', 'modified', 'sourceUri', 'relshipkind', 'Associationvalueset', 'copiedFromId', 'typeRef', 'typeName', 'typeDescription']
  const includedKeysMain = ['id', 'name', 'description', 'proposedType', 'typeName', 'typeDescription'];
  // , $id, $schema, $ref, externalID, groupType, osduId, osduType, x-osdu-license, x-osdu-review-status, x-osdu-schema-source
  const includedKeyskOSDU = ['id', 'name', 'description', 'proposedType', 'typeName', 'typeDescription', '$id', '$schema', '$ref', 'externalID', 'groupType', 'osduId', 'osduType', 'x-osdu-license', 'x-osdu-review-status', 'x-osdu-schema-source'];

  // const objectPropertiesMain = (curobject) && Object.keys(curobject).filter(key => includedKeysMain.includes(key)).sort((a, b) => includedKeysMain.indexOf(a) - includedKeysMain.indexOf(b));
  const objectPropertiesOsdu = (curobject) && Object.keys(curobject).filter(key => includedKeyskOSDU.includes(key)).sort((a, b) => includedKeyskOSDU.indexOf(a) - includedKeyskOSDU.indexOf(b));

  const objectPropertiesMore = (curobject) && Object.keys(curobject).filter(key => includedKeysMore.includes(key));

  const csvheader1 = 'Version	Object Name	Title	Description	Group Type	Governance Model	Governance Authorities	Supported File Formats	Superseding Kind											Action	Priority				State	Object Name	Title	Description	Group Type	Governance Model	Governance Authorities	Supported File Formats'.split('\t');
  const csvheader3 = '	Properties								Attribution			References				Behaviors			Proposals						Final Output													'.split('\t');
  const csvheader4 = 'No	Name	Title	Description	Type	Format	Frame of Reference	Constant	Example	Authority	Publication	Revision	Referenced Object	RO Version	RO Group Type	Existing Standard	Is Required?	Is Derived?	Is Indexed?	Action	Priority	Proposal	Operators	Additional Comments	State	Name	Title	Description	Type	Format	Frame of Reference	Constant	Example	Referenced Object	RO Version	RO Group Type	Is Required?	Is Derived?	Is Indexed?'.split('\t');

  const titles = (objectPropertiesOsdu) && Object.values(objectPropertiesOsdu);
  const values = titles?.map((v: string) =>  (v === 'name') ? (curobject.groupType === 'abstract') ? 'Abstract'+curobject[v]: curobject[v] : curobject[v]);
  if (debug) console.log('214 keys1', values);

  const valueList = ObjectToCsv({ obj: csvheader3 }).valueList

  if (debug) console.log('194 objecstodiv', valueList);
  const lineNo = 5;

  const relatedToObjects = curRelatedFromObjectRels?.map((objrel: any) => objects.find((o: any) => o.id === objrel.toobjectRef));

  // escape semicolon in values of relatedToObjects


  if (debug) console.log('229 relatedToObjects', curRelatedFromObjectRels, curRelatedToObjectRels, relatedToObjects, currelationships);

  const relatedObjList = relatedToObjects.map((toObj: any, index: number) => (
    `\n ${index + 1
    };${(toObj.groupType === 'abstract') ? 'Abstract' + toObj.name.split('.')[0] : toObj.name.split('.')[0]
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

  let csvString = `${ObjectToCsv({ obj: csvheader1 }).valueList}\n`;
  csvString += `${ObjectToCsv({ obj: values }).valueList}\n`;
  csvString += `${ObjectToCsv({ obj: csvheader3 }).valueList}\n`;
  csvString += `${ObjectToCsv({ obj: csvheader4 }).valueList}`;
  csvString += relatedObjList;
  csvString += "\n";

  // Add a Byte Order Mark (BOM) to the beginning of the CSV string
  // csvString = "\uFEFF" + csvString;

  if (!ph?.phData?.metis?.models) return <></>

  // console.log('214 keys1', setMdString, contentDiv);
  const tabsDiv = (
    <>
      <Tabs onSelect={index => setActiveTab(index)}>
        <TabList className="">
          <Tab>CSV</Tab>
        </TabList>
        <TabPanel className="main-properties bg-light p-2 m-0" > {/* Main properties */}
          EntityType:
          <div className="d-flex adjust-content-between align-items-center"><span className="fs-4">{curobject?.name}</span><span className="ms-auto me-4">version:</span>
          </div>
          <pre className=" text-white p-2 m-1" style={{ maxHeight: "50vh", backgroundColor: "#666" }} >
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
      <div className="context-tabs border border-dark rounded bg-transparent mx-1" style={{ height: 'auto' }}>
        {tabsDiv}
      </div>
    </div>
  )
}
export default ExportObjects 
