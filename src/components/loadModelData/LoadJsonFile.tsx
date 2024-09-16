// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { ReadConvertJSONFromFileToAkm } from '../utils/ConvertJSONToAkmModel';
import { ConnectImportedTopEntityTypes } from '../utils/ConnectImportedTopOSDUTypes';
import { SaveModelToFile, SaveAllToFile, SaveAllToFileDate, ReadModelFromFile, ReadMetamodelFromFile } from '../utils/SaveModelToFile';
import { ImportModelFromFile, ImportMetamodelFromFile } from '../utils/ImportModelFromFile';

const LoadJsonFile = (props: any) => {
  if (!props.ph.phData?.metis.models) return <></>;

  const debug = false;
  const dispatch = useDispatch();

  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  const [inclMasterdata, setInclMasterdata] = useState(true);
  const [inclWorkProductComponent, setInclWorkProductComponent] = useState(true);
  const [inclReference, setInclReference] = useState(true);
  const [inclAbstract, setInclAbstract] = useState(true);
  const [inclProps, setInclProps] = useState(false);
  const [inclPropLinks, setInclPropLinks] = useState(false);
  const [inclArrayProperties, setInclArrayProperties] = useState(false);
  const [inclAbstractPropLinks, setInclAbstractPropLinks] = useState(false);
  const [inclXOsduProperties, setInclXOsduProperties] = useState(false);
  const [inclDeprecated, setInclDeprecated] = useState(false);
  const [inclGeneric, setInclGeneric] = useState(false);
  const [gitLabUrl, setGitLabUrl] = useState('');

  const handleInclProps = () => setInclProps(!inclProps);
  const handleInclPropLinks = () => setInclPropLinks(!inclPropLinks);
  const handleInclArrayProperties = () => setInclArrayProperties(!inclArrayProperties);
  const handleInclAbstractPropLinks = () => setInclAbstractPropLinks(!inclAbstractPropLinks);
  const handleInclXOsduProperties = () => setInclXOsduProperties(!inclXOsduProperties);
  const handleInclMasterdata = () => setInclMasterdata(!inclMasterdata);
  const handleInclWorkProductComponent = () => setInclWorkProductComponent(!inclWorkProductComponent);
  const handleInclReference = () => setInclReference(!inclReference);
  const handleInclAbstract = () => setInclAbstract(!inclAbstract);
  const handleInclDeprecated = () => setInclDeprecated(!inclDeprecated);
  const handleInclGeneric = () => setInclGeneric(!inclGeneric);

  const [selectAllEntityTypes, setSelectAllEntityTypes] = useState(false);
  const [selectAllProperties, setSelectAllProperties] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setInclMasterdata(selectAllEntityTypes);
    setInclWorkProductComponent(selectAllEntityTypes);
    setInclReference(selectAllEntityTypes);
    setInclAbstract(selectAllEntityTypes);
  }, [selectAllEntityTypes]);

  useEffect(() => {
    setInclProps(selectAllProperties);
    setInclPropLinks(selectAllProperties);
    setInclArrayProperties(selectAllProperties);
    setInclAbstractPropLinks(selectAllProperties);
    setInclXOsduProperties(selectAllProperties);
    setInclDeprecated(selectAllProperties);
  }, [selectAllProperties]);

  const fetchJsonFromGitLab = async (url) => {
    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();
      setData(data);
      return data; // Ensure data is returned
    } catch (error) {
      setError(error.message);
      return null; // Return null in case of error
    }
  };

  const importJsonFromGitLab = async (url) => {
    const data = await fetchJsonFromGitLab(url); // data is returned as js object not json string
    if (debug) console.log('80 importJsonFromGitLab', data, url);
    if (data) {
      ReadConvertJSONFromFileToAkm(
        data,
        dispatch,
        props.ph,
        inclProps,
        inclPropLinks,
        inclXOsduProperties,
        inclAbstractPropLinks,
        inclArrayProperties,
        inclGeneric,
        inclAbstract,
        inclReference,
        inclMasterdata,
        inclWorkProductComponent,
        inclDeprecated,
        "AKM"
      );
    }
  };

  const handleImportFromGitLab = () => {
    importJsonFromGitLab(gitLabUrl);
  };

  const importFile = async (e) => {
    // Convert the FileList into an array and iterate
    let files = Array.from(e.target.files)
    if (debug) console.log('125', files);
    let filess = files.map(file => {
      if (debug) console.log('126 file', file);
      let reader = new FileReader();
      // return new Promise((resolve) => {
      //   reader.onload = () => resolve(reader.result);
      //   reader.readAsText(file);
      // });
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          try {
            const result = JSON.parse(reader.result);
            resolve(result);
          } catch (error) {
            reject(new Error("Failed to parse JSON"));
          }
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        reader.readAsText(file);
      });
    });
    if (debug) console.log('120 filess', filess);
    let res = await Promise.all(filess);
    if (debug) console.log('122 res', res);
    res.map(r => {
      ReadConvertJSONFromFileToAkm(
        r,
        dispatch,
        props.ph,
        inclProps,
        inclPropLinks,
        inclXOsduProperties,
        inclAbstractPropLinks,
        inclArrayProperties,
        inclGeneric,
        inclAbstract,
        inclReference,
        inclMasterdata,
        // inclWorkProduct,
        inclWorkProductComponent,
        inclDeprecated,
        "AKM",
      )
    })
  }

  const importDirectories = async (dir) => {

    const getSubDir = Array.from(dir.target.files).filter(file => file.isDirectory);
    if (getSubDir.length === 0) {
      await importDirectory(dir);
      return;
    } else {

      for (const directory of subDir) {
        await importDirectory(directory);
        const subDirectories = await getSubDirectories(directory); // Replace 'getSubDirectories' with the actual function to get subdirectories
        await importDirectories(subDirectories);
      }
    }
  }

  const importDirectory = async (fileOrDirectory) => {
    const files = Array.from(fileOrDirectory.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = async () => {
          const fileContent = reader.result;
          ReadConvertJSONFromFileToAkm(
            fileContent,
            dispatch,
            props.ph,
            inclProps,
            inclPropLinks,
            inclXOsduProperties,
            inclAbstractPropLinks,
            inclArrayProperties,
            inclGeneric,
            inclAbstract,
            inclReference,
            inclMasterdata,
            // inclWorkProduct,
            inclWorkProductComponent,
            inclDeprecated,
            "AKM",
          );
        };
        reader.readAsText(file);
      } else {
        console.log("File is not a JSON file.");
      }
    }
  }



  const curModel = props.ph.phData?.metis?.models?.find(m => m.id === props.ph.phFocus?.focusModel?.id);
  const curMetamodel = props.ph.phData?.metis?.metamodels?.find(m => m.id === curModel?.metamodelRef);

  const modalDiv = (
    <Modal size="lg" isOpen={modal} toggle={toggle}>
      <ModalHeader toggle={() => { toggle(); props.setRefresh(!props.refresh); }}>Import OSDU Schema:</ModalHeader>
      {curMetamodel?.name !== 'AKM-OSDU_MM' && modal ? (
        <ModalBody className="d-flex flex-column">
          <div className="source bg-warning p-5 m-5 fs-3">
            <div>Current metamodel is not an AKM-OSDU_MM metamodel!</div>
            <br />
            <div>Please select a model with an AKM-OSDU_MM metamodel to import OSDU JSON files.</div>
          </div>
        </ModalBody>
      ) : (
        <ModalBody className="d-flex flex-column bg-success">
          <div className="source bg-light p-2">
            <div className="loadsave--JsonToFile select bg-light mb- p-2 border border-dark">
              <h5>Import JSON-Schema files:</h5>
              <p>(This will import the Schema EntityTypes with Properties as OSDUTypes, Relationship Proxies, PropertyArrays, Items and Properties)</p>
              <div className="selectbox3 mb-1 border">
                <div className='mt-2'> Include EntityTypes:</div>
                <div className="d-flex justify-content-between align-items-center my-2 border label-input-container">
                  <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }}>
                    <label className="flex-grow-1 text-secondary" htmlFor="selectAllEntityTypes">Select All</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Select All EntityTypes" checked={selectAllEntityTypes} onChange={() => setSelectAllEntityTypes(!selectAllEntityTypes)} />
                  </span>
                  <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }}>
                    <label className="flex-grow-1 text-secondary" htmlFor="inclMasterdata">Master_data</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Include master-data" checked={inclMasterdata} onChange={handleInclMasterdata} />
                  </span>
                  <span className="bg-light d-flex align-items-center m-1 pe-1" style={{ height: "100%" }}>
                    <label className="flex-grow-1 text-secondary" htmlFor="inclWorkProductComp">Work_Product_Components</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Include work-product-component" checked={inclWorkProductComponent} onChange={handleInclWorkProductComponent} />
                  </span>
                  <span className="bg-light d-flex align-items-center m-2 pe-1" style={{ height: "100%" }}>
                    <label className="flex-grow-1 text-secondary" htmlFor="inclReference">Reference_Components</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Include reference-data" checked={inclReference} onChange={handleInclReference} />
                  </span>
                  <span className="bg-light d-flex align-items-center m-1 pe-1" style={{ height: "100%" }}>
                    <label className="flex-grow-1 text-secondary" htmlFor="inclAbstract">Abstract_Components</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Include Abstract Types" checked={inclAbstract} onChange={handleInclAbstract} />
                  </span>
                </div>
                <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", marginTop: "3px", marginBottom: "3px" }} />
                <div className='mt-2'> Include Properties and relationships Proxies:</div>
                <div className="d-flex justify-content-between align-items-center my-2 border label-input-container">
                  <span className="bg-light d-flex align-items-center" style={{ height: "100%" }}>
                    <label className="flex-grow-1" htmlFor="selectAllProperties">Select All</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Select All Properties" checked={selectAllProperties} onChange={() => setSelectAllProperties(!selectAllProperties)} />
                  </span>
                  <span className="bg-light d-flex align-items-center" style={{ height: "100%" }}>
                    <label className="flex-grow-1" htmlFor="inclProps">Properties</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Include Props" checked={inclProps} onChange={handleInclProps} />
                  </span>
                  <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }}>
                    <label className="flex-grow-1 text-secondary" htmlFor="inclPropLinks">Relationship_Proxies</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Include Proxy" checked={inclPropLinks} onChange={handleInclPropLinks} />
                  </span>
                  <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }}>
                    <label className="flex-grow-1 text-secondary" htmlFor="inclAbstractPropLinks">Abstract_Proxies</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Include Abstract Proxy" checked={inclAbstractPropLinks} onChange={handleInclAbstractPropLinks} />
                  </span>
                  <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }}>
                    <label className="flex-grow-1 text-secondary" htmlFor="inclArrayProperties">Arrays</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Include Array" checked={inclArrayProperties} onChange={handleInclArrayProperties} />
                  </span>
                  <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }}>
                    <label className="flex-grow-1 text-secondary" htmlFor="inclXOsduProperties">x_osdu_Properties</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Include XOsdu Properties" checked={inclXOsduProperties} onChange={handleInclXOsduProperties} />
                  </span>
                  <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }}>
                    <label className="flex-grow-1 text-secondary" htmlFor="inclDeprecated">Incl_DEPRECATED</label>
                    <input className="checkbox-input ms-1" type="checkbox" title="Include Deprecated" checked={inclDeprecated} onChange={handleInclDeprecated} />
                  </span>
                </div>
              </div>
              <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", marginTop: "3px", marginBottom: "3px" }} />
              <label className="pt-1" htmlFor="gitLabUrl">GitLab URL - Open Raw URL in OSDU community (see link at the bottom) and Copy paste the URL below</label>
              <input className="select-input w-100" type="text" title="Enter GitLab URL" value={gitLabUrl} onChange={(e) => setGitLabUrl(e.target.value)} />
                <Button className="modal--footer m-0 py-1 px-2 w-100" color="primary" data-toggle="tooltip" data-placement="top" data-bs-html="true"
                  title="Find Proxies that refers to EntityTypes and convert to relationships!"
                onClick={handleImportFromGitLab}>
                Import JSON URL from GitLab
              </Button>
              <label className="pt-1" htmlFor="directory">File(s)</label>
              <input className="select-input w-100" type="file" title="Select Directory" accept=".json" onChange={importFile} multiple />
              <label className="pt-3" htmlFor="directory">or Directory</label>
              <input
                className="select-input w-100"
                type="file"
                title="Select Directory"
                accept=".json"
                onChange={importDirectories}
                webkitdirectory="true"
                directory="true"
              />
              <div className="selectbox3 mb-2">
                <h6>Connect imported OSDU Types</h6>
                <Button className="modal--footer m-0 py-1 px-2 w-100" color="primary" data-toggle="tooltip" data-placement="top" data-bs-html="true"
                  title="Find Proxies that refers to EntityTypes and convert to relationships!"
                  onClick={() => { ConnectImportedTopEntityTypes("JSON", props.ph, dispatch, inclDeprecated) }}
                >
                  Convert temporary Proxy-objects to Relationships
                </Button>
              </div>
            </div>
            <div className="loadsave--JsonToFile border border-dark">
              <div className="selectbox">
                <h5>Export OSDUType object with attributes to OSDU Excel file :</h5>
                <p className="selectbox3 mb-0">Select the OsduType you want to export. Then click on "OBJECT DETAIL" in the upper right corner of the modelling area, then select the "Export" tab.</p>
              </div>
            </div>
            <div className="selectbox2 mb-1 border bg-light">
              <h6>Link to the OSDU Open Subsurface Data Universe - Data Definitions</h6>
              <h6>(This will open a new tab in your browser)</h6>
              <a className="text-primary" href="https://community.opengroup.org/osdu/data/data-definitions/-/tree/master/Generated" target="_blank" rel="noopener">https://community.opengroup.org/osdu/data/data-definitions/-/tree/master/Generated</a>
            </div>
          </div>
        </ModalBody>
      )}
      <ModalFooter>
        <Button className="modal--footer m-0 py-0 px-2" data-toggle="tooltip" data-placement="top" data-bs-html="true"
          title="Click here when done!" onClick={() => { toggle(); props?.setRefresh(!props?.refresh) }}>Done
        </Button>
      </ModalFooter>
    </Modal>
  );

  return (
    <>
      <span><button className="btn bg-success text-white py-1 ps-0 px-0" onClick={toggle}>OSDU Imp <i className="fa fa-file-import fa-lg "></i></button></span>
      {modalDiv}
      <style jsx>{`
        .selectbox2 {
            background-color: rgba(0, 0, 0, 0.3) ;
            border: 20px;
            border-color: tomato;
            padding: 1%;
        }
        .selectbox3 {
            background-color: rgba(100, 100, 100, 0.1) ;
            border: 20px;
            border-color: tomato;
            padding: 1%;
        }  
      `}</style>
    </>
  );
};

export default LoadJsonFile;