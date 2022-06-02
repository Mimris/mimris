---
title: 'A Demo Solution Model'
date: 'June 8, 2022'
excerpt: 'The purpose of this tutorial is to make enhancement to an existing Consept Model of rental service for e-Scooters and cars .'
cover_image: 'images/posts/modelling/image_model006.png'
---

## Enhance an existing concept model

### Concept Model overall structure

The demo model shown below is a concept model of a rental service for e-scooters and cars. In the "Type definition" container at the right you se currently defined Objecttypes Types: "*Person*", "*Company*", "*Fleet*", "*Location*", "*EScooter*" and "*Car*", with Relationship Types "*has*" and "*contains*".
In the left container we have the Role and Tasks used for the rental service.

![alt text](/images/posts/modelling/image_model020-1.png)

### Property and relationship definition for the Car and EScooter Objecttypes

To define more details of the model we add the properties and relationships in a new Modelview named "05-Vehicle" shown below. the *Car* and *EScooter* are defined with some common properties, and Vehicle has som special properties for the rental service, like vehicleId and price.

![alt text](/images/posts/modelling/image_model020-2.png)

### Property and relationship definition for the Person and Vehicle Objecttype related to position with Coordnates property.



![alt text](/images/posts/modelling/image_model020-3.png)

### Datatype definitions

![alt text](/images/posts/modelling/image_model020-4.png)

We choose "*owns*" in the modal dialog that pops up, clicks on "*Done*” and the relationship is created. (If you click on the “*x*” in the top right corner of the dialog, the operation is canceled.)

We continue modeling objects and relationships and may end up with a model like this:

![alt text](/images/posts/modelling/image_model006.png)



### Modifying object and relationship views

How objects and relationships appear in the model when they are created is decided by the typeview definitions of the respective types. The appearance in the model can be overridden by defining object and relationship views. 

The objectview of the person “*Me*” looks like this:

![alt text](/images/posts/modelling/image_model007.png)

We see that we can modify the fillcolor of the object, the “*strokecolor*”, the “*icon*” as so on, and then give the object a specialized look that differs from the default appearance. 

We can do the same with relationships, and modify the color, the arrowheads, and so on, when we want to deviate from the default. 

