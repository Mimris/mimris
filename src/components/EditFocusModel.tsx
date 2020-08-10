import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
// import { useSelector, useDispatch } from 'react-redux'

// import { FaJoint } from 'react-icons/fa';
// import { setFocusObject } from '../actions/actions';
import EditProperties  from './forms/EditProperties'

const EditFocusModel = (props) => {
  console.log('10 EditFocusModel', props);
  
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const models = props.ph.phData.metis?.models
  const focusModel = props.ph.phFocus?.focusModel
  const focusModelview = props.ph.phFocus?.focusModelview
  const focusObjectview = props.ph.phFocus?.focusObjectview
  const focusRelshipview = props.ph.phFocus?.focusRelshipview

  const curmodel = models?.find((m: any) => m?.id === focusModel?.id)
  const curmodelview = curmodel?.modelviews?.find((m: any) => m?.id === focusModelview?.id)
  const curobjview = curmodelview?.objectviews?.find((ov: any) => ov?.id === focusObjectview?.id)
  const curobj_tmp = curmodel?.objects?.find(o => o.id === curobjview?.objectRef)
  const curobj = (curobj_tmp) && {...curobj_tmp, name: curobjview?.name, description: curobjview?.description}
  const currelview = curmodelview?.relshipviews?.find((rv: any) => rv?.id === focusRelshipview?.id)
  const currel_tmp= curmodel?.relships?.find((r: any) => r.id === currelview?.relshipRef)
  const currel = (currel_tmp) && {...currel_tmp, name: currelview?.name, description: currelview?.description}
  // console.log('25 EditFocusModel', models, curmodel, currelview, curobjview?.relshipRef, currel);
  
  const focusObjecttype = props.ph.phFocus?.focusObjecttype
  const focusRelshiptype = props.ph.phFocus?.focusRelshiptype
  const metamodels = props.ph.phData.metis?.metamodels
  const curmetamodel = metamodels?.find(mm => mm.id === curmodel?.metamodelRef)
  const curmmobj = curmetamodel?.objecttypes?.find((ov: any) => ov?.id === focusObjecttype?.id)
  const curmmotypegeos = curmetamodel?.objecttypegeos?.find(otg => otg.typeRef === curmmobj?.id)
  const curmmotypeview = curmetamodel?.objecttypeviews?.find(tv => tv.id === curmmobj?.typeviewRef)
  
  const curmmrel = curmetamodel?.relshiptypes?.find((ov: any) => ov?.id === focusRelshiptype?.id)
  const curmmrtypeview = curmetamodel?.relshiptypeviews?.find(tv => tv.id === curmmrel?.typeviewRef)
  // console.log('34 EditFocusModel', metamodels, curmetamodel, curmmobj);
  const curotypeview = curmetamodel?.objecttypeviews?.find(tv => tv.id === curobjview?.typeviewRef)
  const currtypeview = curmetamodel?.relshiptypeviews?.find(tv => tv.id === currelview?.typeviewRef)
  
  // console.log('42 EditFocusModel', curmetamodel?.relshiptypeviews, currtypeview);
  
  
  
  const editovpropertyDiv = (props.modelType === 'model') 
    ? (props.buttonLabel === 'O')
      ? (curobjview) && <EditProperties item={curobjview} curobj={curobj} type={'UPDATE_OBJECTVIEW_PROPERTIES'} />
      : (currelview) && <EditProperties item={currelview} curobj={currel} type={'UPDATE_RELSHIPVIEW_PROPERTIES'} />
    : (props.buttonLabel === 'O')
      ? (curmmobj) && <EditProperties item={curmmobj} curobj={curobj} type={'UPDATE_OBJECTTYPE_PROPERTIES'} />
      : (curmmrel) && <EditProperties item={curmmrel} curobj={curmmrel} type={'UPDATE_RELSHIPTYPE_PROPERTIES'} />

  const editopropertyDiv = (props.modelType === 'model') 
    ? (props.buttonLabel === 'O')
      ? (curobj) && <EditProperties item={curobj} type={'UPDATE_OBJECT_PROPERTIES'} />
      : (currel) && <EditProperties item={currel} type={'UPDATE_RELSHIP_PROPERTIES'} />
    : (props.buttonLabel === 'O')
      ? (curmmotypegeos) && <EditProperties item={curmmotypegeos} type={'UPDATE_OBJECTTYPEGEOS_PROPERTIES'} />
      : <></>
  const editotpropertyDiv = (props.modelType === 'model') 
    // ? (curotypeview.id !== curmmotypeview?.id) 
    //   ? <div className="helptext p-4 text-info">This Objectview has no local typeview.<br /> Right-Click the object's icon and select "Add local typeview" to create a local Typevew</div>
    //   : (curotypeview) && <EditProperties item={curotypeview} type={'UPDATE_OBJECTTYPEVIEW_PROPERTIES'} />
    ? (props.buttonLabel === 'O')
      ? (curotypeview) && <EditProperties item={curotypeview} type={'UPDATE_OBJECTTYPEVIEW_PROPERTIES'} />
      : (currtypeview) && <EditProperties key={currtypeview.id} item={currtypeview} type={'UPDATE_RELSHIPTYPEVIEW_PROPERTIES'} />
    : (props.buttonLabel === 'O')
      ? (curmmotypeview) && <EditProperties item={curmmotypeview} type={'UPDATE_OBJECTTYPEVIEW_PROPERTIES'} />
      : (curmmrtypeview) && <EditProperties item={curmmrtypeview} type={'UPDATE_RELSHIPTYPEVIEW_PROPERTIES'} />

  const idNameDiv = (props.modelType === 'model') 
    ? (props.buttonLabel == 'O') 
      ?
        <>
        <div >Id : <span className="font-weight-bolder ml-5">{props.ph.phFocus.focusObjectview?.id} </span></div>
        <div> Name :<span className="titlename font-weight-bolder ml-4" >{curobjview?.name}</span></div>
        </>
      :
        <>
        <div >Id : <span className="font-weight-bolder ml-5">{props.ph.phFocus.focusRelshipview?.id} </span></div>
        <div> Name :<span className="titlename font-weight-bolder ml-4" >{currelview?.name}</span></div>
        </>
    : (props.buttonLabel === 'O')
      ?
        <>
        <div >Id : <span className="font-weight-bolder ml-5">{props.ph.phFocus.focusObjecttype?.id} </span></div>
        <div> Name :<span className="titlename font-weight-bolder ml-4" >{curmmobj?.name}</span></div>
        </>
      :
        <>
        <div >Id : <span className="font-weight-bolder ml-5">{props.ph.phFocus.focusRelshiptype?.id} </span></div>
        <div> Name :<span className="titlename font-weight-bolder ml-4" >{currel?.name}</span></div>
        </>

  const modalheader = (props.modelType === 'model') 
    ? (props.buttonLabel === 'O') ?'Edit Objectview:' : 'Edit Relshipview'
    : (props.buttonLabel === 'O') ?'Edit Objecttype:' : 'Edit Relshiptype'
  const objectviewheader = (props.modelType === 'model') 
    ? (props.buttonLabel === 'O')
      ? 'Objectview:' : 'Relshipview'
    : (props.buttonLabel === 'O')
      ? 'Objecttype:' : 'Relshiptype' 
  const objectheader = (props.modelType === 'model') 
    ? (props.buttonLabel === 'O')
      ?'Object:' 
      :'Relship:' 
    : (props.buttonLabel === 'O')
      ? 'Objecttypegeos'
      : ''
  const typeviewheader = (props.modelType === 'model') 
    ? (props.buttonLabel === 'O')
      ? 'Typeview:' : 'Typeview'
    : (props.buttonLabel === 'O')
      ? 'Typeview:' : 'Typeview'

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
            <div className="title  mb-1 pb-1 px-2" >
             {idNameDiv}
            </div> 
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
