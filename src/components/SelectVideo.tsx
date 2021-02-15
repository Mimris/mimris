// @ts-nocheck
import { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux'
import Selector from './utils/Selector'
import { loadState, saveState } from './utils/LocalStorage'
import { FaJoint } from 'react-icons/fa';
import { StartVideo } from '../defs/StartVideo'
const SelectContext = (props: any) => {
  // console.log('8 8', props.modal);
  const dispatch = useDispatch()
  let state = useSelector((state:any) => state) // Selecting the whole redux store
  const metamodels = useSelector(metamodels => state.phData?.metis?.metamodels)  // selecting the models array
  
  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  
  return (
    <>
      {/* <button className="btn-context btn-link float-right mb-0 pr-2" size="sm" color="link" onClick={toggle}>{buttonLabel}
      </button>    */}
        <h4> Instruction Videos : Get Started </h4>
          <StartVideo videoURI={'/videos/snorres.mp4'} />
      <style jsx>{`
      `}</style> 
    </>
  )
}
    
export default SelectContext

