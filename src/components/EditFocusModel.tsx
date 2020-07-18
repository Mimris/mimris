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

  const models = props.ph.phData.metis?.models
  const focusModel = props.ph.phFocus?.focusModel
  const focusModelview = props.ph.phFocus?.focusModelview
  const focusObjectview = props.ph.phFocus?.focusObjectview
  const curmodel = models?.find((m: any) => m?.id === focusModel?.id)
  const curmodelview = curmodel?.modelviews?.find((m: any) => m?.id === focusModelview?.id)
  const curobjview = curmodelview?.objectviews?.find((ov: any) => ov?.id === focusObjectview?.id)
  const curobj = curmodel?.objects?.find(o => o.id === curobjview?.objectRef)
  // console.log('25 EditFocusModel', models, curmodel, curobj);
  
  const focusObjecttype = props.ph.phFocus?.focusObjecttype
  const metamodels = props.ph.phData.metis?.metamodels
  const curmetamodel = metamodels?.find(mm => mm.id === curmodel?.metamodelRef)
  const curmmobj = curmetamodel?.objecttypes?.find((ov: any) => ov?.id === focusObjecttype?.id)
  const curmmotypegeos = curmetamodel?.objecttypegeos?.find(otg => otg.typeRef === curmmobj?.id)
  const curmmotypeview = curmetamodel?.objecttypeviews?.find(tv => tv.id === curmmobj?.typeviewRef)
  // console.log('34 EditFocusModel', metamodels, curmetamodel, curmmobj);
  const curotypeview = curmetamodel?.objecttypeviews?.find(tv => tv.id === curobjview?.typeviewRef)
  console.log('33 EditFocusModel', curotypeview, curmmobj, curmmotypeview);
  
  
  
  const editovpropertyDiv = (props.modelType === 'model') 
    ? (curobjview) && <EditProperties item={curobjview} curobj={curobj} type={'UPDATE_OBJECTVIEW_PROPERTIES'} />
    : (curmmobj) && <EditProperties item={curmmobj} curobj={curobj} type={'UPDATE_OBJECTTYPE_PROPERTIES'} />

  const editopropertyDiv = (props.modelType === 'model') 
    ? (curobj) && <EditProperties item={curobj} type={'UPDATE_OBJECT_PROPERTIES'} />
    : (curmmotypegeos) && <EditProperties item={curmmotypegeos} type={'UPDATE_OBJECTTYPEGEOS_PROPERTIES'} />

  const editotpropertyDiv = (props.modelType === 'model') 
    // ? (curotypeview.id !== curmmotypeview?.id) 
    //   ? <div className="helptext p-4 text-info">This Objectview has no local typeview.<br /> Right-Click the object's icon and select "Add local typeview" to create a local Typevew</div>
    //   : (curotypeview) && <EditProperties item={curotypeview} type={'UPDATE_OBJECTTYPEVIEW_PROPERTIES'} />
    ? (curotypeview) && <EditProperties item={curotypeview} type={'UPDATE_OBJECTTYPEVIEW_PROPERTIES'} />
    : (curmmotypeview) && <EditProperties item={curmmotypeview} type={'UPDATE_OBJECTTYPEVIEW_PROPERTIES'} />

  const idNameDiv = (props.modelType === 'model') 
    ?
    <div className="title  mb-1 pb-1 px-2" >
      <div >Id : <span className="font-weight-bolder ml-5">{props.ph.phFocus.focusObjectview?.id} </span></div>
      <div> Name :<span className="titlename font-weight-bolder ml-4" >{curobjview?.name}</span></div>
    </div> 
    :
    <div className="title  mb-1 pb-1 px-2" >
      <div >Id : <span className="font-weight-bolder ml-5">{props.ph.phFocus.focusObjecttype?.id} </span></div>
      <div> Name :<span className="titlename font-weight-bolder ml-4" >{curmmobj?.name}</span></div>
    </div> 

  const modalheader = (props.modelType === 'model') ? 'Edit Objectview:' : 'Edit Objecttype'
  const objectviewheader = (props.modelType === 'model') ? 'Objectview:' : 'Objecttype'
  const objectheader = (props.modelType === 'model') ? 'Object:' : 'Objecttypegeos'
  const typeviewheader = (props.modelType === 'model') ? 'Typeview:' : 'Typeview'

  // console.log('34 EditFocusModel', curmmobj, curmmotypegeos, curmmotypeview);

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  return (
    <>
      <button className="btn-focus btn-link btn-sm float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}
      </button>
      <Modal isOpen={modal} toggle={toggle} className={className} style={{ marginTop: "90px" }} >
        <ModalHeader toggle={toggle}>{modalheader}</ModalHeader>
        <ModalBody >
          <div className="select bg-light pt-0 ">
            {idNameDiv}
            {/* <hr style={{ backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} /> */}
            <div className="propview bg-light mt-1 p-1 border border-dark">
              <div className="title bg-light mb-1 pb-1 px-2" >{objectviewheader}:</div>
              {editovpropertyDiv}
            </div>
            <div className="propview bg-light mt-1 p-1 border border-dark">
              <div className="title bg-light mb-1 pb-1 px-2" >{objectheader}:</div>
             {editopropertyDiv}
            </div>
            <div className="propview bg-light mt-1 p-1 border border-dark">
              <div className="title bg-light mb-1 pb-1 px-2" >{typeviewheader}:</div>
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
