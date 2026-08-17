// import React from 'react'
// import PropTypes from 'prop-types'
import { FaCrosshairs, FaGlobe, FaDharmachakra, FaBeer, FaClipboardList, FaEmpire, FaOilCan, FaListOl, FaRegCopyright, FaSpaceShuttle, FaLine, FaAutoprefixer, FaMehRollingEyes, FaMagento, FaMagic, FaAccessibleIcon, FaBan, FaXing, FaBezierCurve, FaCommentDots, FaRegCommentDots, FaDirections, FaDashcube, FaDAndDBeyond, FaCircleNotch, FaCloudMeatball, FaCloud, FaCloudMoon, FaCloudversify, FaAsterisk, FaRegSave, FaSourcetree, FaCompactDisc, FaStamp, FaCloudDownloadAlt, FaMixcloud, FaAssistiveListeningSystems, FaApper, FaLaptop } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { selectMimrisCompatibilityProps } from '../sharedUniverse';

const Footer = props => {
  const compatibilityProps = useSelector(selectMimrisCompatibilityProps);
  const phSource = compatibilityProps.phSource ?? props.phSource;
  const phFocus = compatibilityProps.phFocus || props.phFocus || {};
  const phTemplate = props.phTemplate;

  return (
    <div className="footer d-flex align-items-center">
      <FaDharmachakra className="ms-2" />
      {/* <FaLaptop className="ms-2" /> */}
      <div>Mimris Modeller - 2025</div>
      <FaRegCopyright className='ms-2'/>
      <div className="ms-1">Mimris</div>
      <div className="d-flex justify-content-between align-items-center ms-auto me-4" >
        <FaCloudDownloadAlt className="me-1" />
        <div>Template : {phTemplate}</div>
        <FaRegSave className="ms-5 me-1" />
        <div>
          {(phSource) 
            ? <div>Mimris file: {phSource}</div>
            : <div>Mimris file: {phFocus?.focusProj?.filename} </div>
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
