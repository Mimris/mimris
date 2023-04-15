import { useState } from "react";
import ReactDOM from "react-dom";
import ProjectDetailsForm from "../forms/ProjectDetailsForm";

function ProjectDetailsModal(props) {
  console.log("6 ProjectDetailsModal", props);
  const [showModal, setShowModal] = useState(false);

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
      <button onClick={handleOpenModal}>Edit Project Details</button>
      {showModal &&
        ReactDOM.createPortal(
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={handleCloseModal}>
                &times;
              </span>
              <ProjectDetailsForm props={props.props} onSubmit={handleSubmit} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default ProjectDetailsModal;