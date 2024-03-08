// this component is not used in the app, but it could be used to display a message to the user
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const PopupAMsg = (props: any) => {

  console.log('16 PopupAMsg csvString', props);
  const handleClose = () => props.setShowModal(false);

  return (
    <div>
      {/* <Modal show={props.showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>How to paste CSV into a spreadsheet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>1. Open your spreadsheet software (e.g., Microsoft Excel, Google Sheets).</p>
          <p>2. Create a new spreadsheet.</p>
          <p>3. Click on the first cell (A1), and then paste (Ctrl+V or Command+V).</p>
          <p>4. Your data should now be populated into the spreadsheet.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal> */}
    </div>
  );
}

export default PopupAMsg;