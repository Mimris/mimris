// @ts-nocheck
import { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux'
import Selector from '../utils/Selector'
import { loadState, saveState } from '../utils/LocalStorage'
import { FaJoint } from 'react-icons/fa';
import Select from "react-select"
import { StartVideo } from '../defs/StartVideo'
const SelectContext = (props: any) => {
  // console.log('8 8', props.modal);
  // let state = useSelector((state:any) => state) // Selecting the whole redux store
  // const dispatch = useDispatch()

  const [video, setVideo] = useState('/videos/AKMM-Getting-Started-1.mp4')

  // const videos = [{videoURI: '/videos/AKMM-Getting-Started-1.mp4'},{videoURI: '/videos/snorres.mp4'}]
  const videos = [
    {label: "/videos/AKMM-Getstarted-slides-1.mp4", value: '/videos/AKMM-Getstarted-slides-1.mp4'},
    {label: "/videos/AKMM-Getting-Started-1.mp4", value: '/videos/AKMM-Getting-Started-1.mp4'},
    {label: "/videos/AKMM-NewModel-EditProject1.mp4", value: '/videos/AKMM-NewModel-EditProject1.mp4'}]
  // const videoURIs = videos.map(v => v.videoURI)

  let startVideoDiv = <StartVideo videoURI={video} />
  useEffect(() => { 
    console.log('23', video);
     startVideoDiv =    <StartVideo videoURI={video} />
  }, [video])

  const handleSelectVideo = (value) => {
    console.log('29', value);
    setVideo(value.value)
    console.log('31', video);
  }

  return (
    <div>
      {/* <button className="btn-context btn-link float-right mb-0 pr-2" size="sm" color="link" onClick={toggle}>{buttonLabel}
      </button>    */}
        <h4> Instruction Videos :</h4>
        <h5> </h5>

          <Select className="video-select w-50 mb-2"
            options={videos}
            value={video}
            onChange={value => handleSelectVideo(value)}
          />
          <div className="card-text mb-2">{video}</div>
          <div className="video-frame d-flex flex-column">
          {startVideoDiv}
          </div>
      <style jsx>{`
      `}</style> 
    </div>
  )
}
    
export default SelectContext

