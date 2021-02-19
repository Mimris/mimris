// @ts-nocheck
import { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux'
import Selector from './utils/Selector'
import { loadState, saveState } from './utils/LocalStorage'
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
    {label: "/videos/AKMM-Getstarted1.mp4", value: '/videos/AKMM-Getstarted1.mp4'},
    {label: "/videos/AKMM-Getting-Started-1.mp4", value: '/videos/AKMM-Getting-Started-1.m4v'},
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
    <>
      {/* <button className="btn-context btn-link float-right mb-0 pr-2" size="sm" color="link" onClick={toggle}>{buttonLabel}
      </button>    */}
        <h4> Instruction Videos : Get Started </h4>

          <Select className="video-select w-25 mb-2 float-left"
            options={videos}
            value={video}
            onChange={value => handleSelectVideo(value)}
          />
          <span className="float-right text-white">{video}</span>
          {startVideoDiv}
      <style jsx>{`
      `}</style> 
    </>
  )
}
    
export default SelectContext

