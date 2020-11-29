// @ts-snocheck
import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
// import { useSelector, useDispatch } from 'react-redux'
import { useDispatch } from 'react-redux'
import Select from 'react-select'
import { loadData, loadDataModelList } from '../actions/actions'
import Selector from './utils/Selector'
import SaveModelData from './utils/SaveModelData'
// import GetStoreFromHtml from './utils/GetStoreFromHtml'
// import { FaJoint } from 'react-icons/fa';
const debug = false

const LoginServer = (props: any) => {
  if (!debug) console.log('15 LoginServer', props);
  // let state = useSelector((state: any) => state) // Selecting the whole redux store

  const dispatch = useDispatch()
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }
  
  const modellist = (props.ph.phList) && props.ph.phList.modList
  const selmodellist = (modellist) && modellist?.map(ml => (ml) &&  {value: ml.id, label: ml.name})
  console.log('27 LoginServer', props.ph.phList.modList, selmodellist);

  const modelNames = props.ph?.phData?.metis?.models.map(mn => <span key={mn.id}>{mn.name} | </span>)
  const metamodelNames = props.ph?.phData?.metis?.metamodels.map(mn => (mn) && <span key={mn.id}>{mn.name} | </span>)
  // console.log('20 LoadLocal', modelNames, metamodelNames);
 
  const models = props.phData?.metis?.models
  const focusModel = props.phFocus?.focusModel
  const model = models?.find((m: any) => m?.id === focusModel?.id) // || models[0]
  const selmodels = models?.map((m: any) => m) 
  const selmodelviews = model?.modelviews?.map((mv: any) => mv)

  useEffect(() => {
    dispatch(loadDataModelList())
  }, [])
  
  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  
  const frameId = 'myFrame'

  // if (!selmodellist) 
  return (
    <>
      <span><button className="btn-context btn-primary float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button> </span>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>Model Server login: </ModalHeader>
        <ModalBody className="pt-0">
            <br />
            <p>   
            If you are already logged in, you will see a Model list 
            of all models in the repository below.(in JSON format)
            <br /><br />
            (It may take some time for the list to appear!)</p>
              {/* <iframe style={{width:"100%", height:"33vh"}} src="http://localhost:4000/profile" name="myFrame"></iframe> */}
            <iframe style={{width:"100%", height:"33vh"}} src="http://localhost:4000/akm-model-list" name={frameId}></iframe>
              {/* {GetStoreFromHtml} */}
              {/* <IframeHelper /> */}
              <a href="http://localhost:4000/profile" target="myFrame" >Click here to Logout</a>
              {/* <p><a href="http://localhost:4000/profile" target="myFrame" >Click to Login</a></p> */}
          {/* <Button className="modal-footer m-0 py-1 px-2" color="link" onClick={modeldata} >Load</Button> */}
        </ModalBody>
        <ModalFooter>
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

export default LoginServer




  