---
title: ' A Concept model and test of the Solution Model'
date: 'June 8, 2022'
excerpt: 'An example of dynamic change of a Concept model and the Solution Model. The purpose of this tutorial is to show how to make enhancement to an existing Consept Model of rental service for e-Scooters and generate a metamodel and test the metamodel with a test Solution Model .'
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

### Adding Properties and relationship for the Person, Position and Vehicle Objecttypes.

To define more details in the model, we ad new Modelviews.

Below we see the definition of the properties and relationships for the **Person**, and **Vehicle** in a new Modelview.

Vehicle also has a relationship to **Position** objecttype, that contains the GPS coordinates of the vehicle.
On the right side of the modelview we see some of the datatype definition for the properties. The default datatype is "String".

<details><summary markdown="span">
    Modelview with properties and relationships for the Person and Vehicle Objecttypes.
    </summary>

![alt text](/images/posts/escooter/image_020-2.png)

</details>

---

### Adding Properties and relationships for the Vehicle and E-Scooter Object Types.

 where we add the properties and relationships shown below. The **Vehicle** and **E-Scooter**, is defined. 
The Vehicle has some special properties for the rental service, like **vehicleId** and **price**. Vehicle also is related to **Position** that contains the GPS coordinates of the vehicle.

<details><summary markdown="span">
    Modelview with properties and relationships for the Vehicle and E-Scooter Object Types
    </summary>


![alt text](/images/posts/escooter/image_020-3.png)

</details>

---

### Adding Datatype, Inputpatterns and Value definitions

The datatype definition for the properties is shown below. 
A DataType can have list fo allowed values.
The DataType can also have defined a InputPattern which is a regular expression that defines the allowed values for a property.

<details><summary markdown="span">
    Modelview for the datatype definition
    </summary>

![alt text](/images/posts/escooter/image_020-4.png)

</details>

---

### Adding Details for the Tasks of locating the User and the Vehicles

Vi can define a View for specific Tasks. The View can be used to define the properties that are used in that Task.
Below you can se that the Locate Vehicle Task uses the GPS coordinates for the Person and the of the vehicles to find vehicles nearby.

<details><summary markdown="span">
    Modelview of the locate user and vehicle tasks
    </summary>

![alt text](/images/posts/escooter/image_020-5.png)

</details>

---
---

    Now we can generate a Metamodel from the Concept model

---


## Metamodel.

From the Concept model (Type definition), we can now generate a Metamodel that appears in the as Types in the palette on left side in the Solution model. 
This Types are used to build the solution test model by creating instances of the object and relationship types.

#### Generated objecttypes

<details><summary markdown="span">
    The Generated metamodel
    </summary>

![alt text](/images/posts/escooter/image_020-6.png)

In the left palette, we see the generated metamodel types.
The relationships are also generated, and is avaiable to connect the objects in the Canvas.

</details>

---

#### Copied role and tasks objects

The Rols and Tasks are exported(copied) from the Concept model and can now be used in the solution model.

<details><summary markdown="span">
    Exported Roles and Tasks
    </summary>

![alt text](/images/posts/escooter/image_020-6b.png)

In the left palette, we see the Roles and Tasks that are exported from the Concept model.

</details>




---


### The Solution Test model.

The generated Metamodel vil be used as Metamodel for the Solution model.
The Object types are shown below in the Palette types at the left.

<details><summary markdown="span">
    Testmodel for the solution
    </summary>


![alt text](/images/posts/escooter/image_020-8.png)



![alt text](/images/posts/escooter/image_020-7.png)
 
 </details>

 ---

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
    Consept model for the maintenance and repair of e-scooters
    </summary>

![alt text](/images/posts/escooter/image_020-22.png)

</details>

---

#### Test the updated Solution Model completed with the maintenance and repair of e-scooters

Below is a test of the solution model, where we use the generated metamodel.

If we are not satisfied with the result, we can change the Concept model again and rerun the generation.

![alt text](/images/posts/escooter/image_020-?.png)

---

---
