import { useState } from "react";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import ProjectDetailsForm from "../forms/ProjectDetailsForm";

function ProjectDetailsModal(props) {
  console.log("6 ProjectDetailsModal", props);
  const [showModal, setShowModal] = useState(true);
  const toggle = () => setShowModal(!showModal);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = (details) => {
    props.onSubmit(details);
    handleCloseModal();
  };



  return (
    <>
      <button className="btn-sm mt-0 pb-0 pt-0 mr-2" style={{height: "24px"}} color="link" onClick={toggle}>Edit Project Details
      </button>
      <Modal isOpen={showModal} toggle={toggle}  >
        <ModalHeader toggle={toggle}>Set Context: </ModalHeader>
        <ModalBody >
        <ProjectDetailsForm props={props.props} onSubmit={handleSubmit} />
          {/* <Context /> */}
        </ModalBody>
          {/* <div className="ml-2">{emailDivGmail}</div>
        <div className="ml-2">{emailDivMailto}</div> */}
        <ModalFooter>
          {/* <Button color="primary" onClick={toggle}>Set</Button>{' '} */}
          <Button color="link" onClick={toggle}>Exit</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default ProjectDetailsModal;