// import React from 'react'
// import PropTypes from 'prop-types'
import { FaCrosshairs, FaGlobe, FaDharmachakra, FaBeer, FaClipboardList, FaEmpire, FaOilCan, FaListOl } from 'react-icons/fa';

const Footer = props => {
  return (
    <div className="title d-flex justify-content-between " >
      <span className=" mx-4"> Copyright: Kavca AS </span>
      <div className='d-flex'>
      <span className="iow mr-4">  Internet of Teams. </span>
      <FaGlobe className="mx-4 mt-1" style={{ paddingLeft: "1px", verticalAlign: 'baseline' }} />
      </div>
      {/* <div className="ps-auto text-secondary">  Keep striving for progress over perfection!
        A little progress every day will go a very long way!
        (Dave Gray)
      </div> */}
    </div>
  )
}

// Header.propTypes = {
// }<

export default Footer