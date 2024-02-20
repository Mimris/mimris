import { Card, CardBody, CardHeader, CardText, CardTitle } from "reactstrap";

const GettingStarted = () => {
    return (
        <div className="" style={{width: "400px"}}>
            <Card className="card"
                style={{
                background: "rgba(255,255,255,0.4)",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.2)",
                position: "relative",
                backdropFilter: "blur(5px)",
                WebkitBackdropFilter: "blur(5px)",
                display: "block",
                margin: "0 auto",
                padding: "0px"
                }}
            >
                <CardHeader className="card-header">Getting started</CardHeader>
                <CardBody className="card-body" style={{backgroundColor: "rgba(255,255,195,0.2)"}}>
                    <CardTitle className="card-title-bold nobreak" style={{whiteSpace: "nowrap"}}>Select Video tab in the top menu </CardTitle>
                    <CardText className="card-text"> 
                        Here you find instruction videos on how to use the AKM Modelling App.
                    </CardText>
                    {/* <CardTitle className="card-title-bold">Start modelling:</CardTitle>
                    <CardText className="card-text"> 
                        Select, drag and drop objecttypes from the left palette to the modelling area to the right. <br /> 
                        We recommend to start with a container and then drop objects into the container. You can resize the container by draging the corners.
                    </CardText>
                    <CardTitle className="card-title-bold">Save your model:</CardTitle>
                    <CardText className="card-text"> 
                        You can save your Project to Local file by clicking the green "Model File" button above the modelling area.
                        <br /> Then click on the blue "Save Project (all) to File" button and the model project is saved to a json modelfile (in the Download folder). 
                    </CardText>
                    <CardTitle className="card-title-bold">Share you model on GitHub:</CardTitle>
                    <CardText className="card-text"> 
                        You can also push the Project jsonfile to a GitHub repository to share with others.
                    </CardText> */}
                </CardBody>
            </Card>
            <Card className="card mt-2"
                style={{
                background: "rgba(255,255,255,0.4)",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.2)",
                position: "relative",
                backdropFilter: "blur(5px)",
                WebkitBackdropFilter: "blur(5px)",
                display: "block",
                margin: "0 auto",
                padding: "0px"
                }}
            >
                <CardHeader className="card-header" style={{backgroundColor: "rgba(255,255,225,0.4)"}}>Terminology!</CardHeader>
                <CardBody className="card-body">
                <CardTitle className="card-title-bold" >IRTV</CardTitle>
                <CardText className="card-text "> 
                    <strong> IRTV (Information, Role, Task, View)</strong>
                    <br />AKM modelling start with a generic IRTV-Metamodel, wich contain the basic building blocks for AKM Models. <br />(shown in the left Palette in the modelling page). 
                    <br /><br />We use these building blocks to build an Active Knowledge Model, which in turn can be use to generate Solution models for interactive Role and Task oriented Workplaces for all Roles in enterprise projects . 

                </CardText>
                <CardTitle style={{ fontWeight: "bolder", fontSize: "150%" }}>Metamodel & Model</CardTitle>
                <CardText className="card-text "> 
                    When building a model, we use some predefined objects called "Object Types". <br />   
                    <i>(Its can be compared to building a Lego model. Depending on which Lego blocks you have, we can build different models)</i>
                    <br /><br />In AKM modelling we have predefined a Metamodel with the IRTV building blocks. From these we can build any new Metamodels and Models of any kind. 
                    <br /><strong>(The App that builds the App). </strong>
                
                    <br /><br /><i>(It is possible to build your own Metamodel from a basic Object and Relationship type)</i><strong> </strong>

                </CardText>
                </CardBody>
            </Card>
            <Card className="card "
                style={{
                background: "rgba(255,255,255,0.4)",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.2)",
                position: "relative",
                backdropFilter: "blur(5px)",
                WebkitBackdropFilter: "blur(5px)",
                // display: "block",
                // margin: "0 auto",
                padding: "2px"
                }}
            >
                <CardHeader className="card-header">AKM Modeller</CardHeader>
                <CardBody className="card-body" >
                {/* <CardTitle style={{ fontWeight: "bolder" }}>AKM Modeller</CardTitle> */}
                <CardText className="card-text">          
                AKM Modeller is the tool for building Active Knowledge Models, a modeling tool with integrated Use-case Modeling and Meta-modelling capabilities.
                    <br /><br />
                With IRTV we can easily model new product structures, such as self-configurable components, systems and product families. This is supported by top-down as well as bottom-up workspace designed processes and role-oriented workspaces. 
                The AKM Modeller can enhance the design and operation of Products, Organizations, Processes and Systems (POPS) by adding new concepts, properties, tasks,and work enhancing views.
                </CardText>
                </CardBody>
            </Card>
            <Card className="card" body outline color="warning"
                style={{
                background: "rgba(255,255,255,0.4)",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.2)",
                // position: "relative",
                backdropFilter: "blur(5px)",
                WebkitBackdropFilter: "blur(5px)",
                // display: "block",
                margin: "0 auto",
                padding: "2px"
                }}              
            >
                <CardHeader className="card-header">Active Knowledge Modelling</CardHeader>
                <CardBody className="card-body" >
                {/* <CardTitle style={{ fontWeight: "bolder" }}>AKM</CardTitle> */}
                <CardText className="card-text">
                    Active Knowledge Modelling (AKM) is an innovative way to capture and use enterprise knowledge from practical work. AKM models have positive effects on cyclic design and operations, productivity, safety, reuse, collaboration and innovation and learning. AKM has matured for more than a decade. Modern open-source web technology has now reached a technical level that enables cost efficient large scale usage.
                    <br /><br />
                    The AKM novelty comes from how relationships between roles, tasks, properties and knowledge and data are captured and presented in the form of interactive and visual workspaces that support collaboration between roles in a distributed work environment. 
                    <br /><br />
                    An enterprise development and innovation team can model new Concepts and Capabilities. These Concept models may be used to enhance the meta-models of innovation projects, which again design new POPS components and solutions.
                    <br /><br />
                    The effects from deploying AKM based solutions are many. Firstly roles and their workspaces can be designed to share critical views securing a shared situational awareness. Shared views supporting design parameter balancing are modelled, and task execution can be in line with applicable regulations and policies. Role-specific task execution may create new tasks and services for other roles, and as such AKM makes collaboration and alignment more transparent, effective and precise, with direct impact on design quality, safety and security.
                    <br /><br />  
                    <br /><br />
                    (more in the About page ....)
                    <br /><br />           
                </CardText>
                </CardBody>
            </Card>
        </div>
    )
}

export default GettingStarted;