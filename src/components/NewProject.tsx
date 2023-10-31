// create a modal to add a new project

import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useDispatch } from 'react-redux';




const NewProject = (props: any) => {
    const dispatch = useDispatch();
    const [show, setShow] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [projectType, setProjectType] = useState('');
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const handleSubmit = () => {
        const project = {
            name: projectName,
            description: projectDescription,
            type: projectType
        }
        // dispatch(addProject(project));
        handleClose();
    }

    return (
        <>
            <Button variant="primary" onClick={handleShow}>
                New Project
            </Button>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>New Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formProjectName">
                            <Form.Label>Project Name</Form.Label>
                            <Form.Control type="text" placeholder="Enter project name" onChange={(e) => setProjectName(e.target.value)} />
                        </Form.Group>
                        <Form.Group controlId="formProjectDescription">
                            <Form.Label>Project Description</Form.Label>
                            <Form.Control type="text" placeholder="Enter project description" onChange={(e) => setProjectDescription(e.target.value)} />
                        </Form.Group>
                        <Form.Group controlId="formProjectType">
                            <Form.Label>Project Type</Form.Label>
                            <Form.Control type="text" placeholder="Enter project type" onChange={(e) => setProjectType(e.target.value)} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        Create
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );