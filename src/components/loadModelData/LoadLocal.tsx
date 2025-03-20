// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'
// import Select from "react-select"\
// import { loadData } from '../actions/actions'
// import { loadState, saveState } from '../utils/LocalStorage'
// import useLocalStorage  from '../../hooks/use-local-storage'
import  {ReadModelFromFile} from '../utils/ReadModelFromFile';

const LoadLocal = (props: any) => {
  
  const debug = false
  const dispatch = useDispatch()  
  const toggleRefresh = props.ph.toggleRefresh

  const modelNames = props.ph.phData?.metis?.models.map((mn: { id: string, name: string }) => <span key={mn.id}>{mn.name} | </span>)
  const metamodelNames = props.ph.phData?.metis?.metamodels.map((mn: { id: string, name: string }) => (mn) && <span key={mn.id}>{mn.name} | </span>)
  if (debug) console.log('24 LoadLocal', props.ph.phData, modelNames, metamodelNames);
  
  if (typeof window === 'undefined') return


  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);


  
  return (
    <>
      <button className="btn-context btn-light float-right mr-2 mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>Export/Import: </ModalHeader>
        <ModalBody className="pt-0">
            <div className="">
              <div className="input text-primary" style={{ maxHeight: "32px", backgroundColor: "transparent" }} data-bs-toggle="tooltip" data-bs-placement="top" title="Choose a local Project file to load">
                <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, props.dispatch, e)} style={{width: "380px"}}/>
              </div>
            </div>
        </ModalBody>
        <ModalFooter>
          <Button className="modal--footer m-0 py-1 px-2" color="primary" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title="Click here when done!" onClick={() => {toggle(); toggleRefresh()}}>Done</Button>
          <div className="footer--text mb-2" style={{ fontSize: "smaller" }}>
            Local Storage is controlled by the Internet Browser, and may at some point be deleted, if not enough memory.
            <br />NB! Loading models from LocalStorage will overwrite current memory store.  To keep current work, click &quot;Save all to LocalStorage.
          </div>
          {/* <Button color="primary" onClick={toggle}>Set</Button>{' '} */}
        </ModalFooter>
      </Modal>
      <style jsx>{`
            `}</style>
    </>
  )
}

export default LoadLocal

