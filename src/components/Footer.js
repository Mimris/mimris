// import React from 'react'
// import PropTypes from 'prop-types'
import { FaCrosshairs, FaGlobe, FaDharmachakra, FaBeer, FaClipboardList, FaEmpire, FaOilCan, FaListOl, FaRegCopyright, FaSpaceShuttle, FaLine, FaAutoprefixer, FaMehRollingEyes, FaMagento, FaMagic, FaAccessibleIcon, FaBan, FaXing, FaBezierCurve, FaCommentDots, FaRegCommentDots, FaDirections, FaDashcube, FaDAndDBeyond, FaCircleNotch, FaCloudMeatball, FaCloud, FaCloudMoon, FaCloudversify, FaAsterisk, FaRegSave, FaSourcetree, FaCompactDisc, FaStamp, FaCloudDownloadAlt, FaMixcloud, FaAssistiveListeningSystems, FaApper, FaLaptop } from 'react-icons/fa';

const Footer = props => {
  return (
    <div className="footer d-flex align-items-center">
      <FaDharmachakra className="ms-2" />
      {/* <FaLaptop className="ms-2" /> */}
      <div>AKM Modeller - 2024</div>
      <FaRegCopyright className='ms-2'/>
      <div className="ms-1">Kavca AS</div>
      <div className="d-flex justify-content-between align-items-center ms-auto me-4" >
        <FaCloudDownloadAlt className="me-1" />
        <div>Template : {props.phTemplate}</div>
        <FaRegSave className="ms-5 me-1" />
        <div>
          {(props.phSource) 
            ? <div>AKM file: {props.phSource}</div>
            : <div>AKM file: {props.phFocus?.focusProj.filename} </div>
          }
        </div>
      </div>
    </div>
  )
}

// Header.propTypes = {
// }<

export default Footer


{/* <div className='d-flex'>
      <span className="iow mr-4">  Internet of Teams. </span>
      <FaGlobe className="mx-4 mt-1" style={{ paddingLeft: "1px", verticalAlign: 'baseline' }} />
      </div> */}
{/* <div className="ps-auto text-secondary">  Keep striving for progress over perfection!
        A little progress every day will go a very long way!
        (Dave Gray)
</div> */}