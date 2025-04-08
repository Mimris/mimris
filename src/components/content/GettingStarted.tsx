import { Card, CardBody, CardHeader, CardSubtitle, CardText, CardTitle } from "reactstrap";

const GettingStarted = () => {
    return (
        <div className="">
            <Card className="card me-2"
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
                <CardBody className="card-body" style={{ backgroundColor: "rgba(255,255,195,0.2)" }}>
                    <CardTitle className="card-title-bold nobreak" >Click Modelling tab in top menu to start modelling</CardTitle>
                    <CardSubtitle className="card-subtitle-bold">Click Video tab or Help tab in the top menu to get help</CardSubtitle>
                    <CardText className="card-text">
                        Here you find instruction videos and Help on how to use the AKM Modelling App.
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
                    maxHeight: "30vh",
                    overflow: "scroll",
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
                <CardHeader className="card-header" style={{ backgroundColor: "rgba(255,255,225,0.4)" }}>Terminology!</CardHeader>
                <CardBody className="card-body">
                    <CardTitle className="card-title-bold" >IRTV</CardTitle>
                    <CardText className="card-text" >
                        <strong> IRTV (Information, Role, Task, View)</strong>
                        <br />AKM modelling start with a generic IRTV-Metamodel, which contain the basic building blocks for AKM Models. <br />(shown in the left Palette in the modelling page).
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

        </div>
    )
}

export default GettingStarted;