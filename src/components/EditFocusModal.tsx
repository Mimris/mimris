import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
// import { useSelector, useDispatch } from 'react-redux'
// import { FaJoint } from 'react-icons/fa';
// import { setFocusObject } from '../actions/actions';
import EditProperties  from './forms/EditProperties'

const EditFocusModal = (props) => {

  const debug = false

  if (debug) console.log('10 EditFocusModal', props);
  
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const models = props.ph.phData.metis?.models
  const focusModel = props.ph.phFocus?.focusModel
  const focusModelview = props.ph.phFocus?.focusModelview
  const focusObjectview = props.ph.phFocus?.focusObjectview
  const focusObject = props.ph.phFocus?.focusObject
  const focusRelshipview = props.ph.phFocus?.focusRelshipview

  const curmodel = models?.find((m: any) => m?.id === focusModel?.id)
  const curmodelview = curmodel?.modelviews?.find((m: any) => m?.id === focusModelview?.id)
  const curobjview = curmodelview?.objectviews?.find((ov: any) => ov?.id === focusObjectview?.id)
  const curobj_tmp = curmodel?.objects?.find(o => o.id === curobjview?.objectRef)
  const curobj = (curobj_tmp) && {...curobj_tmp, name: curobjview?.name, description: curobjview?.description} // the object(instance) of current objview
  const curtableobj = curmodel?.objects?.find(o => o.id === focusObject?.id)
  const currelview = curmodelview?.relshipviews?.find((rv: any) => rv?.id === focusRelshipview?.id)
  const currel_tmp= curmodel?.relships?.find((r: any) => r.id === currelview?.relshipRef)
  const currel = (currel_tmp) && {...currel_tmp, name: currelview?.name, description: currelview?.description}
  // console.log('25 EditFocusModal', models, curmodel, currelview, curobjview?.relshipRef, currel);
  
  const focusObjecttype = props.ph.phFocus?.focusObjecttype
  const focusRelshiptype = props.ph.phFocus?.focusRelshiptype

  const metamodels = props.ph.phData.metis?.metamodels
  const curmetamodel = metamodels?.find(mm => (mm) && mm.id === curmodel?.metamodelRef)
  const curmmobj = curmetamodel?.objecttypes?.find((ov: any) => ov?.id === focusObjecttype?.id)

  const curmmotypegeos = curmetamodel?.objecttypegeos?.find(otg => otg.typeRef === curmmobj?.id)
  const curmmotypeview = curmetamodel?.objecttypeviews?.find(tv => tv.id === curmmobj?.typeviewRef)
  
  const curmmrel = curmetamodel?.relshiptypes?.find((ov: any) => ov?.id === focusRelshiptype?.id)
  const curmmrtypeview = curmetamodel?.relshiptypeviews?.find(tv => tv.id === curmmrel?.typeviewRef)
  // console.log('34 EditFocusModal', metamodels, curmetamodel, curmmobj);
  const curotypeview = curmetamodel?.objecttypeviews?.find(tv => tv.id === curobjview?.typeviewRef)
  const currtypeview = curmetamodel?.relshiptypeviews?.find(tv => tv.id === currelview?.typeviewRef)
  
  
  if (debug) console.log('42 EditFocusModal', props.modelType, curtableobj, curobj);
  
  const editmpropertyDiv = (props.modelType === 'modelview') 
    && (curmodel) && <EditProperties item={curmodel} curobj={curmodel} type={'UPDATE_MODEL_PROPERTIES'} />
  const editmvpropertyDiv = (props.modelType === 'modelview') 
    && (curmodelview) && <EditProperties item={curmodelview} curobj={curmodelview} type={'UPDATE_MODELVIEW_PROPERTIES'} />
  const editmmpropertyDiv = (props.modelType === 'modelview') 
    && (curmetamodel) && <EditProperties item={curmetamodel} curobj={curmetamodel} type={'UPDATE_METAMODEL_PROPERTIES'} />

  const editovpropertyDiv = (props.modelType === 'model') 
    ? (props.buttonLabel === 'Object')
      ? (curobjview) && <EditProperties item={curobjview} curobj={curobj} type={'UPDATE_OBJECTVIEW_PROPERTIES'} />
      : (currelview) && <EditProperties item={currelview} curobj={currel} type={'UPDATE_RELSHIPVIEW_PROPERTIES'} />
    : (props.buttonLabel === 'Object')
      ? (curmmobj) && <EditProperties item={curmmobj} curobj={curobj} type={'UPDATE_OBJECTTYPE_PROPERTIES'} />
      : (curmmrel) && <EditProperties item={curmmrel} curobj={curmmrel} type={'UPDATE_RELSHIPTYPE_PROPERTIES'} />

  const editopropertyDiv = (props.modelType === 'model' || 'objects') &&
     (props.modelType === 'model') 
      ?  (props.buttonLabel === 'Object') 
          ?
            (curobj) && <EditProperties item={curobj} type={'UPDATE_OBJECT_PROPERTIES'} /> ||
            (curmmotypegeos) && <EditProperties item={curmmotypegeos} type={'UPDATE_OBJECTTYPEGEOS_PROPERTIES'} />
          : (currel) && <EditProperties item={currel} type={'UPDATE_RELSHIP_PROPERTIES'} />
          // : (props.buttonLabel === 'Obj')
          //   ? (curmmotypegeos) && <EditProperties item={curmmotypegeos} type={'UPDATE_OBJECTTYPEGEOS_PROPERTIES'} />
          //   : <></>
      : (curtableobj) && <EditProperties item={curtableobj} type={'UPDATE_OBJECT_PROPERTIES'} />

  const editotpropertyDiv = (props.modelType === 'model') 
    // ? (curotypeview.id !== curmmotypeview?.id) 
    //   ? <div className="helptext p-4 text-info">This Objectview has no local typeview.<br /> Right-Click the object's icon and select "Add local typeview" to create a local Typevew</div>
    //   : (curotypeview) && <EditProperties item={curotypeview} type={'UPDATE_OBJECTTYPEVIEW_PROPERTIES'} />
    ? (props.buttonLabel === 'Object')
      ? (curotypeview) && <EditProperties item={curotypeview} type={'UPDATE_OBJECTTYPEVIEW_PROPERTIES'} />
      : (currtypeview) && <EditProperties key={currtypeview.id} item={currtypeview} type={'UPDATE_RELSHIPTYPEVIEW_PROPERTIES'} />
    : (props.buttonLabel === 'Object')
      ? (curmmotypeview) && <EditProperties item={curmmotypeview} type={'UPDATE_OBJECTTYPEVIEW_PROPERTIES'} />
      : (curmmrtypeview) && <EditProperties item={curmmrtypeview} type={'UPDATE_RELSHIPTYPEVIEW_PROPERTIES'} />

  const idNameDiv = (props.modelType === 'modelview') 
    ? 
      <>
        <div >Id : <span className="font-weight-bolder ml-5">{props.ph.phFocus.focusModel?.id} </span></div>
        <div> Name :<span className="titlename font-weight-bolder ml-4" >{props.ph.phFocus.focusModel?.name}</span></div>
      </>
    : (props.modelType === 'model') 
        ? (props.buttonLabel == 'Object') 
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
        : (props.buttonLabel === 'Object')
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

  const modalheader = (props.modelType === 'modelview' || 'modelview' ) 
    ? (props.buttonLabel === 'Model') ? 'Edit Model Properties:' : 'Edit Properties:'
    : (props.modelType === 'model')  
      ? (props.buttonLabel === 'Object') ? 'Edit Objectview:' : 'Edit Relshipview'
      : (props.buttonLabel === 'Object') ? 'Edit Objecttype:' : 'Edit Relshiptype'

  const modelheader = (props.buttonLabel === 'Model')  && 'Model'
  const modelviewheader = (props.buttonLabel === 'Model')  && 'Modelview'
  const metamodelheader = (props.buttonLabel === 'Model')  && 'Metamodel'
 

  const objectviewheader = (props.modelType === 'model') 
    ? (props.buttonLabel === 'Object')
      ? 'Objectview' : 'Relshipview'
    : (props.buttonLabel === 'Object')
      ? 'Objecttype' : 'Relshiptype' 

  const objectheader = (props.modelType === 'model' || 'objects') &&
    // ? (props.modelType === 'objects') && 'Object'
    (props.buttonLabel === 'Object')
      ?'Object' 
      :'Relship' 
    // : (props.buttonLabel === 'Obj')
    //   ? 'Objecttypegeos'
    //   : ''

  const typeviewheader = (props.modelType === 'model') 
    ? (props.buttonLabel === 'Object')
      ? 'Typeview' : 'Typeview'
    : (props.buttonLabel === 'Object')
      ? 'Typeview' : 'Typeview'

  // console.log('34 EditFocusModal', curmmobj, curmmotypegeos, curmmotypeview);
  let dialogDiv
  if (props.modelType === 'modelview') {
    dialogDiv = 
          <>
            <div className="select bg-light pt-0 ">
              <div className="title  mb-1 pb-1 px-2" >
                {idNameDiv}
              </div>
              {/* <hr style={{ backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} /> */}
              <div className="propview bg-light mt-1 p-0 border border-dark">
                <div className="title bg-light mb-1 pb-1 px-2" >{modelheader}:</div>
                {editmpropertyDiv}
              </div>
              <div className="propview bg-light mt-1 p-0 border border-dark">
                <div className="title bg-light mb-1 pb-1 px-2" >{modelviewheader}:</div>
                {editmvpropertyDiv}
              </div>
              <div className="propview bg-light mt-1 p-0 border border-dark">
                <div className="title bg-light mb-1 pb-1 px-2" >{metamodelheader}:</div>
                {editmmpropertyDiv}
              </div>
            </div>
          </>
  } else if (props.modelType === 'objects') {
    dialogDiv =
      <>
        <div className="select bg-light pt-0 ">
          <div className="title  mb-1 pb-1 px-2" >
            {idNameDiv}
          </div>
          {/* <hr style={{ backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} /> */}

          <div className="propview bg-light mt-1 p-0 border border-dark">
            <div className="title bg-light mb-1 pb-1 px-2" >{objectheader}:</div>
            {editopropertyDiv}
          </div>

        </div>
      </>
    } else  {
      dialogDiv =
        <>
          <div className="select bg-light pt-0 ">
            <div className="title  mb-1 pb-1 px-2" >
              {idNameDiv}
            </div>
            {/* <hr style={{ backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} /> */}
            <div className="propview bg-light mt-1 p-0 border border-dark">
              <div className="title bg-light mb-1 pb-1 px-2" >{objectviewheader}:</div>
              {editovpropertyDiv}
            </div>
            <div className="propview bg-light mt-1 p-0 border border-dark">
              <div className="title bg-light mb-1 pb-1 px-2" >{objectheader}:</div>
              {editopropertyDiv}
            </div>
            <div className="propview bg-light mt-1 p-0 border border-dark">
              <div className="title bg-light mb-1 pb-1 px-2" >{typeviewheader}:</div>
              {editotpropertyDiv}
            </div>
          </div>
        </>
    }

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  return (
    <>
      < button className="btn-dark float-right px-3 mr-1"  onClick={toggle} > {buttonLabel}</button >
      <Modal isOpen={modal} toggle={toggle} className={className} style={{ marginTop: "96px", fontSize: "90%"}} >
        <ModalHeader toggle={toggle}>{modalheader}</ModalHeader>
        <ModalBody >
          {dialogDiv}
        </ModalBody>
        <ModalFooter>
          <Button className="modal-footer m-0 p-0" color="link" onClick={() => { toggle(); toggleRefresh() }}>Done</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default EditFocusModal
