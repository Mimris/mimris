import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
// import { useSelector, useDispatch } from 'react-redux'

// import { FaJoint } from 'react-icons/fa';
// import { setFocusObject } from '../actions/actions';
import EditProperties  from './forms/EditProperties'

const EditFocusModel = (props) => {

  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }
  
  const metamodels = props.ph.phData.metis?.metamodels
  const models = props.ph.phData.metis?.models
  const focusModel = props.ph.phFocus?.focusModel
  const focusModelview = props.ph.phFocus?.focusModelview
  const focusObjectview = props.ph.phFocus?.focusObjectview
  const curmodel = models?.find((m: any) => m?.id === focusModel?.id)
  const curmetamodel = metamodels?.find(mm => mm.id === curmodel.metamodelRef)
  const curmodelview = curmodel.modelviews?.find((m: any) => m?.id === focusModelview?.id)
  const curobjview = curmodelview?.objectviews.find((ov: any) => ov?.id === focusObjectview?.id)
  const curtypeview = curmetamodel.objecttypeviews.find(otv => otv.id === curobjview?.typeviewRef)
  const curobj = curmodel.objects.find(o => o.id === curobjview?.objectRef)

  // console.log('18 EditFocusModel', curobjview, curobj, curtypeview);
  
  const editovpropertyDiv = (curobjview) && <EditProperties item={curobjview} curobj={curobj} type={'UPDATE_OBJECTVIEW_PROPERTIES'} />
  const editopropertyDiv = (curobj) && <EditProperties item={curobj} type={'UPDATE_OBJECT_PROPERTIES'} />
  const editotpropertyDiv = (curtypeview) && <EditProperties item={curtypeview} type={'UPDATE_OBJECTTYPEVIEW_PROPERTIES'} />
  // console.log('34 EditFocusModel', editovpropertyDiv, editopropertyDiv, editotpropertyDiv);

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  return (
    <>
      <button className="btn-focus btn-link btn-sm float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}
      </button>
      <Modal isOpen={modal} toggle={toggle} className={className} style={{ marginTop: "90px" }} >
        <ModalHeader toggle={toggle}>Edit Focus Objectview: </ModalHeader>
        <ModalBody >
          <div className="select bg-light pt-0 ">
            <div className="title  mb-1 pb-1 px-2" >
              <div >Id : <span className="font-weight-bolder ml-5">{props.ph.phFocus.focusObjectview?.id} </span></div>
              <div> Name :<span className="titlename font-weight-bolder ml-4" >{curobjview?.name}</span></div>
            </div> 
            {/* <hr style={{ backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} /> */}
            <div className="propview bg-light mt-1 p-1 border border-dark">
              <div className="title bg-light mb-1 pb-1 px-2" >Objectview:</div>
              {editovpropertyDiv}
            </div>
            <div className="propview bg-light mt-1 p-1 border border-dark">
              <div className="title bg-light mb-1 pb-1 px-2" >Object:</div>
             {editopropertyDiv}
            </div>
            <div className="propview bg-light mt-1 p-1 border border-dark">
              <div className="title bg-light mb-1 pb-1 px-2" >Typeview:</div>
              {editotpropertyDiv}
            </div>
          </div>
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
                margin-top: 50%;
            }
            .modal.right .modal-dialog {
              position: fixed;
              top: 50%;
              margin: 150px auto 200px auto;
              width: 380px;
              height: 60%;
              color: black;
              -webkit-transform: translate3d(0%, 0, 0);
              -ms-transform: translate3d(0%, 0, 0);
              -o-transform: translate3d(0%, 0, 0);
              transform: translate3d(0%, 0, 0);
            }

            .modal.right .modal-content {
              height: 80%;
              overflow-y: auto;
            }

            .modal.right .modal-body {
              padding: 15px 15px 80px;
              color: #444;
            }

            .modal.right.fade .modal-dialog {
              position: abolute;
              top: 100px;
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
               width: 400px;
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

export default EditFocusModel
