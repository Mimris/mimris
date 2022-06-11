---
title: 'A Demo Solution Model'
date: 'June 8, 2022'
excerpt: 'The purpose of this tutorial is to make enhancement to an existing Consept Model of rental service for e-Scooters and cars .'
cover_image: 'images/posts/escooter/image_020-1.png'
---

## Task: To enhance an existing concept model of rental service for E-Scooters.
---
### Concept Model overall structure

We start with the concept model of rental service for e-Scooters. The user can rent an e-Scooter for a period of time. The user will release the e-Scooter at the end of the period. 
This part of the model is called the rental service and is already modeled in the Consept Model.

The modelview (picture below) contains the object/information types needed in a rental service for E-scooters. In the "Type definition" container at the right you se currently defined Objecttypes Types: "**Person**", "**Company**", "**Fleet**", "**Location**", "**Vehicle**", "**EScooter**", with Relationship Types "**has**" and "**contains**".

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


![alt text](/images/posts/escooter/image_020-2.png)

---

### Property and relationship definition for the Vehicle and E-Scooter Object Types.

To define more details in the model, we make a new Modelview, where we add the properties and relationships shown below. The **Vehicle** and **E-Scooter**, is defined. The Vehicle has some special properties for the rental service, like **vehicleId** and **price**. Vehicle also is related to **Position** that contains the GPS coordinates of the vehicle.

![alt text](/images/posts/escooter/image_020-3.png)

---

### Datatype, Inputpatterns and Value definitions

The datatype definition for the properties is shown below. A DataType can have list fo allowed values.
The DataType can also have defined a InputPattern which is a regular expression that defines the allowed values for a property.

![alt text](/images/posts/escooter/image_020-4.png)

---

### Define a View (Modelview) for the Locate Tasks

Vi can define a View for specific Tasks. The View can be used to define the properties that are used in that Task.
Below you can se that the Locate Vehicle Task uses the GPS coordinates for the Person and the of the vehicles to find vehicles nearby.

![alt text](/images/posts/escooter/image_020-5.png)

---

### Generating a Metamodel from the Type definition model.

From this Type definition model, we can now generate a Metamodel that apears in the as Types in the palette on left side in the Solution model. This Types are used to build the solution model and by creating instances of the types.

![alt text](/images/posts/escooter/image_020-11.png)

---

### Add Role and Tasks for maintenance and repair of e-scooters.

We now want to add new Tasks for maintenance and repair of E-scooters.
We start with copying the Type definition model from the 01-ConseptRental Modelview, and paste view into the 01.1-ConseptMaint modelview. Then we add a new Container "Task Model Maintenance" where we add the new Tasks and Roles.
Then we add relationships to the Type definition model.

![alt text](/images/posts/escooter/image_020-20.png)

---

### The generated Metamodel.

The generated Metamodel vil be used as Metamodel for the Solution model.
The Object types are shown below in the Palette types at the left.

#### Generated objecttypes
12
![alt text](/images/posts/escooter/image_020-?.png)

#### Copied role and tasks objects

The Rols and Tasks are copied from the Type definition model and can now be used in the solution model.

![alt text](/images/posts/escooter/image_020-?.png)

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

![alt text](/images/posts/escooter/image_020-?png)

#### Test Solution Model

Below is a test solution model, where we use the generated metamodel to build an example model to test the Metamodel.

If we are not satisfied with the generated Metamodel, we can change the Concept model and rerun the generation.

![alt text](/images/posts/escooter/image_020-?.png)

---

---

## Other examples of use AKM Modeller.

Object types imported from OSDU Repository.

We can import type definitions from OSDU Repository.
This is JSON Type definition stored as JSON files.

![alt text](/images/posts/escooter/imagetmp5?.png)

Below is a model view of the imported type definitions.

![alt text](/images/posts/escooter/imagetmp3.pngg)
![alt text](/images/posts/escooter/imagetmp4.pngg)
![alt text](/images/posts/escooter/imagetmp2.pngg)
![alt text](/images/posts/escooter/imagetmp1.pngg)
