// import React from 'react'
// import PropTypes from 'prop-types'
import { FaCrosshairs, FaGlobe, FaDharmachakra, FaBeer, FaClipboardList, FaEmpire, FaOilCan, FaListOl } from 'react-icons/fa';

const Footer = props => {
  return (
    <div className="title d-flex justify-content-between">
      <div className="mx-4">Copyright: Kavca AS</div>
      <div>Current project file: {props.phSource}</div>
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