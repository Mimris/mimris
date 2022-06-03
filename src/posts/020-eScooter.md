---
title: 'A Demo Solution Model'
date: 'June 8, 2022'
excerpt: 'The purpose of this tutorial is to make enhancement to an existing Consept Model of rental service for e-Scooters and cars .'
cover_image: 'images/posts/modelling/image_model006.png'
---

## Task: To enhance an existing concept model of rental service for e-Scooters and cars.
---
### Concept Model overall structure

The modelview below contain a show the object/information types needed in a rental service for e-scooters and cars. In the "Type definition" container at the right you se currently defined Objecttypes Types: "**Person**", "**Company**", "**Fleet**", "**Location**", "**EScooter**" and "**Car**", with Relationship Types "**has**" and "**contains**".

In the left container we have the predefined (from IRTV-metamodel ) objects **Role** and **Tasks** used for the rental service.

![alt text](/images/posts/escooter/image_020-1.png)

A person fills the role of User that performs the task of renting an e-scooter or car.
The person has a position (coordinates) which is used to determine the location where to seach for nearby e-scooters or cars.
The rental service is based on the concept of a fleet of e-scooters and cars.
The fleet is a collection of vehicles which consists be e-scooters and cars

---

### Property and relationship definition for the Car and EScooter Objecttypes

To define more details of the model we add the properties and relationships in a new Modelview named "05-Vehicle" shown below. the **Car** and **EScooter** are defined with some common properties, and **Vehicle** that has some special properties for the rental service, like **vehicleId** and **price**. Vehicle aslo contains the GPS coordinates of the vehicle.
On the right side of the modelview we see the datatype definition for the properties. The defualt datatype is "String".


![alt text](/images/posts/escooter/image_020-2.png)

---

### Property and relationship definition for the Person and Vehicle Objecttype related to position with Coordnates property.

Below we see the definition of the properties and relationships for the Person, Vehicle Position Objecttypes.


![alt text](/images/posts/escooter/image_020-3.png)

---

### Datatype, Inputpatterns and Value definitions

The datatype definition for the properties is shown below. A DataType can have list fo allowed values.
The DataType can also have defined a InputPattern which is a regular expression that defines the allowed values for a property.

![alt text](/images/posts/escooter/image_020-4.png)

---

### Define a View for specific Tasks

Vi can define a View for specific Tasks. The View can be used to define the properties that are used in that Task.
Below you can se that the Locate Vehicle Task uses the GPS coordinates for the Person and the of the vehicles to find vehicles nearby.

![alt text](/images/posts/escooter/image_020-5.png)

---

### Generating a Metamodel from the Type definition model.

From this Type definition model, we can now generate a Metamodel that apears in the as Types in the palette on left side in the Solution model. This Types are used to build the solution model and by creating instances of the types.

![alt text](/images/posts/escooter/image_020-11.png)

---

### Add Role and Tasks for maintenance and repair of e-scooters.

We now want to add new Tasks for maintenance and repair of e-scooters.
We start with copying the Type definition model from the 01-ConseptRental Modelview, and paste view into the 01.1-ConseptMaint modelview. Then we add a new Container "Task Model Maintenance" where we add the new Tasks and Roles.
Then we add relationships to the Type definition model.

![alt text](/images/posts/escooter/image_020-20.png)

---

### The generated Metamodel.

The result of the Metamodel generation is shown below in the Palette types at the left.

#### Generated objecttypes

![alt text](/images/posts/escooter/image_020-32.png)

#### Copied role and tasks objects

![alt text](/images/posts/escooter/image_020-31.png)

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



![alt text](/images/posts/escooter/image_020-31.png)

#### 

![alt text](/images/posts/escooter/image_020-33.png)