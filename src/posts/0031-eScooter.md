---
title: 'An example test Solution Model'
date: 'June 8, 2022'
excerpt: 'The purpose of this tutorial is to show how to make enhancement to an existing Consept Model of rental service for e-Scooters and .'
cover_image: 'images/posts/escooter/image_020-1.png'
---
<details><summary markdown="span">
    Test Solution Model?
    </summary>

A test Solution Model is a model that is used to test the Concept Model and the generated Metamodel.
The purpose of the test model is to "instanciate" the Concepts and create examples to test if the Concept Model is working as expected.
If changes are needed, we go back to the Concept Model and make the changes necessary and regenerate the metamodel for a new test.

If we are satisfied, we can export the type definitions to i.e. GraphQL typedefinition file and create Queries / Mutations from the Tasks.

</details>

---

## This example will show how to expand and enhance an existing concept model of rental service for E-Scooters.


### Concept Model overview

We start with a current concept model of the rental service. The user can locate and rent an e-Scooter for a period of time. The user will release the e-Scooter for others to use at the end of the period. 
A Model consists of a set of objects and relationships between these objects. This Model is a **Concept Model** wich consists of a set of objecttypess and relationshiptypes.
The model can have several Modelviews. Each modelview is a set of objectviews and relationshipviews that is used to display sertain aspects of the model.

The modelview (picture below) contains the object/information types needed in a rental service for E-scooters. 
In the "Type definition" container at the right you se currently defined Objecttypes Types: "**Person**", "**Company**", "**Fleet**", "**Location**", "**Vehicle**", "**EScooter**", with Relationship Types "**has**" and "**contains**".

In the left container we have the predefined (from IRTV-metamodel ) objects **Role** and **Tasks** used for the rental service.

![alt text](/images/posts/escooter/image_020-1.png)

A person fills the role of User that performs the task of renting an E-scooter.
The person has a position (coordinates) which is used to determine the location where to search for nearby E-scooters.
The rental service is based on the concept of a fleet of E-scooters.
The fleet is a collection of vehicles which consists of E-scooters.


---

### Property and relationship definition for the Person, Position and Vehicle Objecttypes.

Below we see the definition of the properties and relationships for the **Person**, and **Vehicle**.
Vehicle also is related to **Position** that contains the GPS coordinates of the vehicle.
On the right side of the modelview we see some of the datatype definition for the properties. The defualt datatype is "String".

<details><summary markdown="span">
    Property definition modelview
    </summary>

![alt text](/images/posts/escooter/image_020-2.png)

</details>

---

### Property and relationship definition for the Vehicle and E-Scooter Object Types.

To define more details in the model, we make a new Modelview, where we add the properties and relationships shown below. The **Vehicle** and **E-Scooter**, is defined. 
The Vehicle has some special properties for the rental service, like **vehicleId** and **price**. Vehicle also is related to **Position** that contains the GPS coordinates of the vehicle.

<details><summary markdown="span">
    Modelview for the Vehicle and E-Scooter Object Types
    </summary>


![alt text](/images/posts/escooter/image_020-3.png)

</details>

---

### Datatype, Inputpatterns and Value definitions

The datatype definition for the properties is shown below. A DataType can have list fo allowed values.
The DataType can also have defined a InputPattern which is a regular expression that defines the allowed values for a property.

<details><summary markdown="span">
    Modelview for the datatype definition
    </summary>

![alt text](/images/posts/escooter/image_020-4.png)

</details>

---

### Special views (Modelview) for detailing Tasks

Vi can define a View for specific Tasks. The View can be used to define the properties that are used in that Task.
Below you can se that the Locate Vehicle Task uses the GPS coordinates for the Person and the of the vehicles to find vehicles nearby.

<details><summary markdown="span">
    Modelview for the special views
    </summary>

![alt text](/images/posts/escooter/image_020-5.png)

</details>

---

---


## Generating a Metamodel from the Type definition model.

From this Type definition model, we can now generate a Metamodel that appears in the as Types in the palette on left side in the Solution model. 
This Types are used to build the solution test model by creating instances of the object and relationship types.

<details><summary markdown="span">
    The Generated metamodel
    </summary>

![alt text](/images/posts/escooter/image_020-6.png)

</details>

---

### Export the Roles and Tasks

The Roles and tasks are defined in the Consept Model, and can also be used in the Solution Model.

<details><summary markdown="span">
    Exported Roles and Tasks
    </summary>


![alt text](/images/posts/escooter/image_020-6b.png)

</details>


<details><summary markdown="span">
    How to create instances from the objecttypes
    </summary>
    Drag and drop the objecttypes from the Palette to the Canvas (Modelling area).
    Right click on the object and select "Edit Object" to open the property dialog to add attribute values.
    
    (See Help: Building models for more details on how to build a model)

</details>

---


### The Solution Test model.

The generated Metamodel vil be used as Metamodel for the Solution model.
The Object types are shown below in the Palette types at the left.

#### Generated objecttypes

<details><summary markdown="span">
    Generated objecttypes
    </summary>


![alt text](/images/posts/escooter/image_020-7.png)
 
 </details>

#### Copied role and tasks objects

The Rols and Tasks are copied from the Type definition model and can now be used in the solution model.


![alt text](/images/posts/escooter/image_020-8.png)

#### Test of the generated Metamodel

We can now test the generated Metamodel by creating instances of the objecttypes.

<details><summary markdown="span">
    How to create instances from the objecttypes
    </summary>
    Drag and drop the objecttypes from the Palette to the Canvas (Modelling area).
    Right click on the object and select "Edit Object" to open the property dialog to add attribute values.
    <img src="/images/posts/escooter/image_020-35.png" alt="alt text" width="100%">
</details>

---

### Add Role and Tasks for maintenance and repair of e-scooters.

We now want to add new Tasks for maintenance and repair of E-scooters.
We start with copying the Type definition model from the 01-ConseptRental Modelview, and paste view into the 01.1-ConseptMaint modelview. 
Then we add a new Container "Task Model Maintenance" where we add the new Tasks and Roles.
Then we add relationships to the Type definition model.

<details><summary markdown="span">
    Modelview for the Task and Role definition
    </summary>

![alt text](/images/posts/escooter/image_020-6b.png)

</details>

---
![alt text](/images/posts/escooter/image_020-?png)

#### Test Solution Model

Below is a test solution model, where we use the generated metamodel to build an example model to test the Metamodel.

If we are not satisfied with the generated Metamodel, we can change the Concept model and rerun the generation.

![alt text](/images/posts/escooter/image_020-?.png)

---

---
