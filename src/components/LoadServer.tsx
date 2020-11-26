// @ts-snocheck
import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
// import { useSelector, useDispatch } from 'react-redux'
import { useDispatch } from 'react-redux'
import Select from 'react-select'
import { loadData, loadDataModelList, loadDataModel } from '../actions/actions'
import Selector from './utils/Selector'
import SaveModelData from './utils/SaveModelData'
// import GetStoreFromHtml from './utils/GetStoreFromHtml'
// import { FaJoint } from 'react-icons/fa';
const debug = false

const SelectSource = (props: any) => {
  // console.log('15 LoadServer', props);
  // let state = useSelector((state: any) => state) // Selecting the whole redux store

  const dispatch = useDispatch()
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }
  
  const modellist = props.ph.phList.modList
  // let selmodellist = (modellist) && modellist?.map(ml => (ml) &&  {value: ml.id, label: ml.name})
  let selmodellist = (modellist) && modellist?.map(ml => (ml) &&  {value: ml.id, label: ml.name})
  console.log('26', props, props.ph.phList.modList, selmodellist);

  const modelNames = props.ph?.phData?.metis?.models.map(mn => <span key={mn.id}>{mn.name} | </span>)
  const metamodelNames = props.ph?.phData?.metis?.metamodels.map(mn => (mn) && <span key={mn.id}>{mn.name} | </span>)
  // console.log('20 LoadLocal', modelNames, metamodelNames);

  function handleLoadModelStore() { 
    const data = props.ph.phFocus.focusModel
    dispatch({ type: 'LOAD_DATAMODEL', data }) 
    // dispatch(loadDataModel());
    console.log('48 LoadServer', data);
  }

  function handleSaveModelStore() {
    // saving current model and metamodel
    const focusmodel = props.ph.phFocus.focusModel
    const model = props.ph.phData.metis.models.find(m => m.id === focusmodel.id)
    const metamodel = props.ph.phData.metis.metamodels.find(mm => mm.id === model.metamodelRef)
    const currentTargetMetamodel = (model.targetMetamodelRef) && props.ph.phData.metis.metamodels.find(mm => mm.id === model.targetMetamodelRef)
    const currentTargetModel = (model.targetModelRef) && props.ph.phData.metis.models.find(mm => mm.id === model.targetModelRef)
    // const phData = props.phData
    const data = {
      metis: {
        metamodels: [
          metamodel,
          (currentTargetMetamodel) && currentTargetMetamodel,
        ],
        models: [
          model,
          (currentTargetModel) && currentTargetModel,
        ]
      }
    }
    // console.log('72 LoadServer', data);
    SaveModelData(data)
  }
 
  const models = props.ph.phData?.metis?.models
  const focusModel = props.ph.phFocus?.focusModel
  const model = models?.find((m: any) => m?.id === focusModel?.id) // || models[0]
  const selmodels = models?.map((m: any) => m) 
  const selmodelviews = model?.modelviews?.map((mv: any) => mv)
  
  // console.log('42 LoadServer', selmodels, selmodelviews);
  
  const frameId = 'myFrame'
  // let iframe = {}
  // console.log('67 LoadServer', selmodels, selmodelviews);
  // console.log('68 LoadServer', props.ph.phSource);
  // console.log('45 LoadServer', frames[frameId]?.documentElement.innerHTML)
  const selectorDiv = (props.ph?.phSource === 'Model server') && (selmodels) &&
  // const selectorDiv = (props.ph?.phSource === 'Model server') && (selmodels && selmodelviews) &&
  <div className="modeller-selection p-2 " >
      <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focustype='focusModel' refresh={refresh} setRefresh={setRefresh} /> <br /><hr />
      <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelviews' focustype='focusModelview' refresh={refresh} setRefresh={setRefresh} />  <br />
    </div> 
  // console.log('75 selectorDiv', selectorDiv);

  let selectedOption = null

  const handleChange = (selectedOption) => {
    console.log('111 LoadServer', selectedOption);
    const data = {id: selectedOption.value, name: selectedOption.label}
    console.log('114 LoadServer', data);
    dispatch({ type: 'SET_FOCUS_MODEL', data }) ;  


  };
  console.log('94', props.ph.phFocus);
  
  const selectedOptionDiv =  <span className="bg-light p-1 pl-1 pr-5 w-100 " >{focusModel.name}</span>
  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  
  const buttonSaveModelStoreDiv = <button className="btn-primary btn-sm mx-2 float-right" onClick={handleSaveModelStore} > Save current to Server</button >
  const buttonLoadModelStoreDiv = <button className="btn-link btn-sm mr-2" onClick={handleLoadModelStore} > Load a model from Server </button >
    
  const buttonDiv = 
      <>
        <div className="store-div pb-1 mb-0">
          <div className="select px-2" style={{ paddingTop: "4px" }}>
            {buttonSaveModelStoreDiv}  {buttonLoadModelStoreDiv}
          </div>
          {/* {selectorDiv} */}
        </div>
      </>


  return (
    <>
      <span><button className="btn-context btn-primary float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button> </span>
 
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>Model Server: </ModalHeader>
        <ModalBody className="pt-0">
          Current Source: <strong>{props.ph?.phSource}</strong>
          <div className="source bg-light py-2 "> Metamodels:<br /> <strong> {metamodelNames}</strong></div>
          <div className="source bg-light py-2 "> Models:<br /> <strong> {modelNames}</strong></div>
          <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "2px" }} />
          <h6>Model repository (Firebase) </h6>
          <Select 
            options={selmodellist} 
            name='Model'
            value={selectedOption}
            onChange={handleChange}
          /> 
          Selected: {selectedOptionDiv}
          <div className="source bg-light pt-2 ">
             {buttonDiv}
          </div>
        </ModalBody>
        <ModalFooter>
          <div style={{ fontSize: "smaller" }}>
            NB! Clicking "Load a model from Server" will add the model to current store (redux memory).
          </div>
          {/* <Button color="primary" onClick={toggle}>Set</Button>{' '} */}
          <Button className="modal-footer m-0 py-1 px-2" color="link" onClick={() => { toggle(); toggleRefresh() }}>Done</Button>
        </ModalFooter>
      </Modal>
      <style jsx>{`
            .list-obj {
              min-Width: 90px;
            }
            /*******************************
            * MODAL AS LEFT/RIGHT SIDEBAR
            * Add "left" or "right" in modal parent div, after className="modal".
            * Get free snippets on bootpen.com
            *******************************/
            .modal {
                z-index: 1;
                margin-top: 8%;
            }
            .modal.right .modal-dialog {
              position: fixed;
              margin: 150px auto 200px auto;
              width: 380px;
              height: 80%;
              color: black;
              -webkit-transform: translate3d(0%, 0, 0);
              -ms-transform: translate3d(0%, 0, 0);
              -o-transform: translate3d(0%, 0, 0);
              transform: translate3d(0%, 0, 0);
            }

            .modal.right .modal-content {
              height: 100%;
              overflow-y: auto;
            }

            .modal.right .modal-body {
              padding: 15px 15px 80px;
              color: #444;
              
            }

            .modal.right.fade .modal-dialog {
              right: 320px;
              -webkit-transition: opacity 0.3s linear, left 0.3s ease-out;
              -moz-transition: opacity 0.3s linear, left 0.3s ease-out;
              -o-transition: opacity 0.3s linear, left 0.3s ease-out;
              transition: opacity 0.3s linear, left 0.3s ease-out;
            }
            .modal.fade.in {
              opacity: 1;
            }
            .modal.right.fade.show .modal-dialog {
              right: 0;
              transform: translate(0,0);
            }

            /* ----- MODAL STYLE ----- */
            .modal-content {
              border-radius: 0;
              border: none;
            }

            .modal-header {
              border-bottom-color: #eeeeee;
              background-color: #fafafa;
            }
            .modal-body {
              // width: 400px;
            }
            .modal-backdrop .fade .in {
              /* display: none; */
              /* opacity: 0; */
              /* opacity: 0.5; */
              /* filter: alpha(opacity=50) !important; */
              /* background: #fff; */
                    }
            .modal-background {
              display: none;
            }
            .btn-context {
              // font-size: 80%;
              font-weight: bold;
            }
            `}</style>
    </>
  )
  
}

export default SelectSource


