import { Card, CardBody, CardHeader, CardSubtitle, CardText, CardTitle } from "reactstrap";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

const GettingStarted = () => {
    return (
        <div className="text-sm">
            <Card className="card"
                style={{
                    // background: "rgba(255,255,255,0.4)",
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
                <CardBody className="card-body" 
                // style={{ backgroundColor: "rgba(255,255,195,0.2)" }}
                >
                    <CardTitle className="card-title-bold nobreak" >Click Modelling tab in top menu to start modelling</CardTitle>
                    <CardSubtitle className="card-subtitle-bold">Click Video tab or Help tab in the top menu to get help</CardSubtitle>
                    <CardText className="text-xs small fst-italic text-muted">
                        Here you find instruction videos and Help on how to use the Mimris Modelling App.
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
                    maxHeight: "60vh",
                    overflow: "scroll",
                    // background: "rgba(255,255,255,0.4)",
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
                <CardHeader className="card-header" style={{ backgroundColor: "rgba(255,255,225,0.4)" }}>Metamodels</CardHeader>
                <CardBody className="card-body">
                    <CardTitle className="card-title-bold" >Building AKM Models:</CardTitle>
                    <div className="card-text ">
                        <div className="markdownContent">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {`
##### CORE_META: The Foundation for Metamodelling

The modelling language used within Mimris to define new, custom modelling languages is called \"CORE_META\". CORE_META provides a comprehensive set of modelling primitives that enable users to define custom object types (analogous to nouns) and relationship types (analogous to verbs), along with associated properties and methods.

###### Capabilities of CORE_META

- **Object and Relationship Definition:** Users can create new modelling constructs tailored to specific domains.
- **Property and Method Specification:** Customization of behaviour and attributes for each type.
- **Support for Cyclic Structures:** Both the language and its metamodel can express cyclic dependencies, recursive relationships, and feedback loops.

---

###### Creating and Evolving Custom Modelling Languages

Once these custom types are specified (modelled), users can invoke the “Generate Metamodel” function to automatically produce their own metamodel. These metamodels—effectively new, domain-specific modelling languages—can then serve as the foundation for creating custom models tailored to particular needs or contexts.

Through iterative refinement and cyclic application of the modelling and metamodelling process, users can evolve their modelling languages, ensuring adaptability and continuous improvement. This cyclical process is fundamental for advanced modelling environments where requirements and concepts change over time.

By leveraging CORE_META, users can develop highly specialized modelling languages that address the unique requirements of their projects, ensuring a more precise, expressive, and effective modelling process.
`}
                            </ReactMarkdown>
                        </div>
                        <div className="markdownContent">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>

                            {`
#### BPMN example model
The Mimris version of the BPMN Metamodel as shown below is rather advanced.
It utilizes inheritance from an abstract object type (Gateway), relationships to and from the abstract type, in addition to relationships between non-abstract object types (Start, Task, End).

![BPMN-Meta](https://github.com/user-attachments/assets/d1cda36a-71e6-475e-8223-1b0a8a09b777)

In addition it utilizes the "template2" field in the object and relationship views. This to achieve a completely different visualization of objects and relationships in the models built using the generated template than in the metamodel itself.

Below is shown an example model built using a template generated from the metamodel above.

![BPMN-example](https://github.com/user-attachments/assets/322c2cec-c1bc-4ea4-813b-04675bbe86fe)
`}
                        </ReactMarkdown>
                        </div>


                    </div>
                    <CardText className="card-text">
                        When building a model, we use some predefined objects called "Object Types".
                    </CardText>
                    <CardText className="card-text">
                        <i>(Its can be compared to building a Lego model. Depending on which Lego blocks you have, we can build different models)</i>
                    </CardText>
                    <CardText className="card-text">
                        In AKM modelling we have predefined a Metamodel with the IRTV building blocks. From these we can build any new Metamodels and Models of any kind.
                    </CardText>
                    <CardText className="card-text">
                        <strong>(The App that builds the App). </strong>
                    </CardText>
                    <CardText className="card-text">
                        <i>(It is possible to build your own Metamodel from a basic Object and Relationship type)</i><strong> </strong>
                    </CardText>
                    <CardTitle className="card-title-bold" >Metamodels:</CardTitle>
                    <CardText className="card-text">
                        <strong>CORE Metamodel </strong>
                        <br />The CORE Metamodel is the basic building blocks for all Metamodels. <br />
                    </CardText>
                    <CardText className="card-text" >
                        <strong> IRTV (Information, Role, Task, View) metamodel</strong>
                    </CardText>
                    <CardText className="card-text">
                        AKM modelling can start with a generic IRTV-Metamodel, which contain the basic building blocks for AKM Models. <br />(shown in the left Palette in the modelling page).
                    </CardText>
                    <CardText className="card-text">
                       We use these building blocks to build an Active Knowledge Model, which in turn can be use to generate Solution models for interactive Role and Task oriented Workplaces for all Roles in enterprise projects .
                    </CardText>
                    <CardText className="card-text" >
                        <strong> POPS (Product, Organisation, Process, Service) metamodel</strong>
                    </CardText>
                    <CardText className="card-text">
                        AKM modelling can also start with a generic POPS-Metamodel, which contain the basic building blocks for AKM Models. <br />(shown in the left Palette in the modelling page).
                    </CardText>
                    <CardText className="card-text">
                        We use these building blocks to build an Active Knowledge Model, which in turn can be use to generate Solution models for interactive Role and Task oriented Workplaces for all Roles in enterprise projects .
                    </CardText>
                    <CardText className="card-text" >
                        <strong> BPMN (Business Process Model and Notation) metamodel</strong>
                    </CardText>
                    <CardText className="card-text">
                        AKM modelling can also start with a generic BPMN-Metamodel, which contain the basic building blocks for AKM Models. <br />(shown in the left Palette in the modelling page).
                    </CardText>
                    <CardText className="card-text">
                        We use these building blocks to build an Active Knowledge Model, which in turn can be use to generate Solution models for interactive Role and Task oriented Workplaces for all Roles in enterprise projects .
                    </CardText>
                </CardBody>
            </Card>

        </div>
    )
}

export default GettingStarted;