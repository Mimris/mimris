// @ts-nocheck
import { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux'
import Selector from './utils/Selector'
import { loadState, saveState } from './utils/LocalStorage'
import { FaJoint } from 'react-icons/fa';

const SelectContext = (props: any) => {
  // console.log('8 8', props.modal);
  const dispatch = useDispatch()
  let state = useSelector((state:any) => state) // Selecting the whole redux store
  const metamodels = useSelector(metamodels => state.phData?.metis?.metamodels)  // selecting the models array
  const models = useSelector(models => state.phData?.metis?.models)  // selecting the models array
  const focusModel = useSelector(focusModel => state.phFocus?.focusModel) 
  const focusUser = useSelector(focusUser => state.phUser?.focusUser)
  const focusModelview = useSelector(focusModelview => state.phFocus?.focusModelview)
  
  // const [model, setModel] = useState(focusModel)
  
  const curmodel = models?.find((m: any) => m?.id === focusModel?.id) || models[0]
  const modelviews = curmodel?.modelviews //.map((mv: any) => mv)
  const objects = curmodel?.objects //.map((o: any) => o)
  // const objectviews = curmodel?.objectviews //.map((o: any) => o)
  
  // find object with type
  const objectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews || []
  // console.log('25 Sel', curmodel, modelviews, objects, objectviews);
  
  // remove duplicate objects
  const uniqueovs = objectviews?.filter((ov, index, self) =>
    index === self.findIndex((t) => (
      t.place === ov.place && t.id === ov.id
    ))
  ) || []
  const curmm = metamodels?.find(mm => (mm) && mm.id === (curmodel?.metamodelRef))
  
  // find object with type
  const type = (metamodels, model, objects, curov) => {                                                                                                                                                                                          
    const mmod = metamodels?.find(mm => (mm) && mm.id === model.metamodelRef)
    const o = objects.find(o => o.id === curov.objectRef)
    // console.log('37 SelectContext :', curov.objectRef, objects, o, mmod.objecttypes.find(ot => ot.id === o?.typeRef === ot.id));
    const type = mmod?.objecttypes?.find(ot => ot.name && o?.typeRef === ot.id)?.name
    // console.log('43 SelectContext', mmod.objecttypes.name, o, type);
    return type
  }

  // function handleSendContextAsEmail() {
    const emailAddress = 'snorres@gmail.com'
    const subject = "Context subject"
    const bodyFocus = JSON.stringify(props.phFocus)
    // const bodyData = JSON.stringify(state.phData)
    const body = bodyFocus
  const hrefGmail = 'https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=' + emailAddress+'&subject=' + subject + '&body=' + body
  const hrefEmail = 'mailto:' + emailAddress+'?subject=' + subject + '&body=' + body
  const emailDivGmail = <a href={hrefGmail} target="_blank">Gmail: Send Context (using your Gmail)</a>
  const emailDivMailto = <a href={hrefEmail} target="_blank">Email: Send Context (using your Email)</a>
  // const emailDiv = <a href="mailto:${emailAddress}?subject=${subject}&body=${body}">Send mail with Link to  context</a>
  //https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=target@email.com&subject=MISSED%20CALL%20EZTRADER&body=Hello%2C%0A%0AI%20tried%20contacting%20you%20today%20but%20you%20seem%20to%20have%20missed%20my%20call.%20%0A%0APlease%20return%20my%20call%20as%20soon%20as%20you%E2%80%99re%20available.%20%0A%0AIn%20any%20case%2C%20I%20will%20try%20ringing%20you%20at%20a%20later%20time.%0A%0A%0ATy%2C%0A%0A%0A%0A
  // console.log('51 SelectContext', emailDivMailto);
  // }
  // const buttonSaveModelStoreDiv = <button className="btn-primary btn-sm ml-2 float-right" onClick={handleSendContextAsEmail} > Save to Server</button >

  const selroles = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Role')
  const seltasks = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Task')
  const selorgs = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Organisation')
  const selprojs = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Projects')
  const selobjviews = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) != null)
  const selPers = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Person')
  const selproperties = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Property')
  const selInfo = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Information')


  // let optionModel
  const handlePhDataChange = (event:any) => {
    // const id = JSON.parse(event.value).id
    // const name = JSON.parse(event.value).name
    // console.log('25 selcon', id, name);
    const phData = JSON.parse(event.value)
    const data = phData
    // console.log('38 sel', data);
    (data) && dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
  }
  const handleSessionChange = (event:any) => {
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    // console.log('25 selcon', id, name);
    
    const focusSession = {id: id, name: name}
    const data = focusSession
    // console.log('38 sel', data);
    (data) && dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
  }

  useEffect(() => {
    const fU = async () => await focusUser;
    testsession = fU().session;
    // console.log('69', focusUser, testsession);
    try {
      usession =  (testsession) && JSON.parse(testsession);
      // console.log('71', usession);
    } catch (error) {
      {console.error('parserror');}
    }
  }, [focusUser])

  let usession, testsession
    const defaultSession = '{\"session\": {\"id\": 1, \"name\": \"2nd Session\", \"focus\": {\"gojsModel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy StartObject 1\",\"color\":\"lightblue\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy StartObject 2\",\"color\":\"lightgreen\",\"loc\":\"0 -50\"}],\"linkDataArray\":[{\"key\":-1,\"from\":0,\"to\":1}]},\"gojsMetamodel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy Type 1\",\"color\":\"orange\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy Type 2\",\"color\":\"red\",\"loc\":\"0 -80\"}],\"linkDataArray\":[]},\"focusModel\":{\"id\":\"39177a38-73b1-421f-f7bf-b1597dcc73e8\",\"name\":\"SF test solution model\"},\"focusObject\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"sourceName\":\"test\",\"status\":null},\"focusModelview\":{\"id\":\"48913559-2476-4d8e-7faa-a4777553bb0b\",\"name\":\"Main\"},\"focusOrg\":{\"id\":0,\"name\":\"Default\"},\"focusProj\":{\"id\":0,\"name\":\"Default\"},\"focusRole\":{\"id\":\"UUID4_93ABC7D8-2840-41EE-90F5-042E4A7F9FFF\",\"name\":\"Default\"},\"focusCollection\":null,\"focusTask\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"focus\":{\"focusObject\":{\"id\":\"UUID4_A416FE57-F1A3-4D56-A534-E43C87508465\",\"name\":\"Default\"},\"focusSource\":{\"id\":999,\"name\":\"traversed\"},\"focusCollection\":[]}},\"focusSource\":{\"id\":8,\"name\":\"objectviews\"}},\"ownerId\": 1}}'
    const focuser = defaultSession
    const session0 = JSON.parse(focuser) 
    const session = session0.session.focus
    const phFocus = {phFocus: session}
    function handleSetSession() {
      const data = phFocus.phFocus
      // console.log('87', data);
      dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
      dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', sourceFlag })  
    }
    // /**
    // * Build the selection options for all context (focus) objects,
  // */
  // const optionModel = models && [<option key={991011} value='Select Model ...' disabled > Select Model ...</option>, ...models.map((m: any) => <option key={m.id} value={JSON.stringify(m)} > {m.name} </option>)]
  // const model = models?.find((m: any) => m?.id === focusModel?.id)
  // // console.log('79', modelviews);

  // // const modelviews = (model) && model.modelviews.map((o: any) => o)
  // const optionModelviews = modelviews && [<option key={991012} value='Select Modelview ...'  > Select Modelview ...</option>, ...modelviews.map((m: any) => <option key={m.id} value={JSON.stringify(m)}  > {m.name} </option>)]

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  
  return (
    <>
      <button className="btn-context btn-link float-right mb-0 pr-2" size="sm" color="link" onClick={toggle}>{buttonLabel}
      </button>
      <Modal isOpen={modal} toggle={toggle} className={className} style={{marginTop: "90px"}} >
        <ModalHeader toggle={toggle}>Set Context: </ModalHeader>
        <ModalBody >
          <div className="context-list border-bottom border-dark">Context :
            Model: <strong>{props.phFocus?.focusModel?.name}</strong> |
            Modelview: <strong>{props.phFocus?.focusModelview?.name}</strong> |
            Objectview: <strong>{props.phFocus?.focusObjectview?.name}</strong> |
            {/* Object: <strong>{phFocus?.focusObject?.name}</strong> | */}
            Org: <strong>{props.phFocus?.focusOrg?.name}</strong> |
            Proj: <strong>{props.phFocus?.focusProj?.name}</strong> |
            Role: <strong>{props.phFocus?.focusRole?.name}</strong> |
            Task: <strong>{props.phFocus?.focusTask?.name}</strong> |
          </div>
          <div className="select bg-light pt-0 ">
            <Selector key='1' type='SET_FOCUS_TASK' selArray={seltasks} selName='Tasks' focustype='focusTask' />
          <hr style={{ backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} />
          </div>
 
 
        </ModalBody>
          {/* <div className="ml-2">{emailDivGmail}</div>
          <div className="ml-2">{emailDivMailto}</div> */}
        <ModalFooter>
          <Button color="primary" onClick={toggle}>Set</Button>{' '}
          <Button color="link" onClick={toggle}>Exit</Button>
        </ModalFooter>
      </Modal>
    
   
      <style jsx>{`
  
            `}</style> 
    </>
  )
}
    
export default SelectContext

