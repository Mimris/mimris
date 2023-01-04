// import React from 'react'
// import PropTypes from 'prop-types'
import { FaCrosshairs, FaGlobe, FaDharmachakra, FaBeer, FaClipboardList, FaEmpire, FaOilCan, FaListOl } from 'react-icons/fa';

const Footer = props => {
  return (
    <div className="title d-flex justify-content-between " >
      <span className="iow mx-4"> Copyright: Kavca AS </span>
      <div className='d-flex'>
      <span className="iow mr-4">  Internet of Teams. IoTe </span>
      <FaGlobe className="mx-4 mt-1" style={{ paddingLeft: "1px", verticalAlign: 'baseline' }} />
      </div>
    </div>
  )
}

// Header.propTypes = {
// }<

export default Footer