---
title: 'Creating a Metamodel'
date: 'November 3, 2021'
excerpt: 'Creating an example Metamodel'
cover_image: 'images/posts/modelling/image_model002.png'
---

## The Metamodel

When you start AKM Modeller, an initial model using an initial metamodel is opened.

![alt text](/images/posts/modelling/image_model022.png)

The left pane above contains the object types in the initial metamodel, which the user can use to build a model. 
A model can have different purposes, for example a model that is used to define a modelling language, consisting of object types and relationship types. This model we call a type definition model.
We recommend using the naming convention **_TD.json** to refer to a Type Definition Model. 

## Create a new metamodel

Creating a new metamodel is a process of building a type definition model and then generate the metamodel. 

When building a type definition model we use an “EntityType” object to represent an **object type** and a "RelationshipType" relationship to represent a **relationship type** between object types.

You drag “EntityType” into the modelling area and drop it to create an object representing your new type. 
You give the object a name, which will be the new ObjectType name, and you give it a description.

Relationship types are created by dragging a "RelationshipType" link between two EntityTypes and then rename it to the typename you decide.

### The example

There are four “*EntityType*” objects, each representing an object type in the intended new metamodel, "*Person*", "*Car*", "*House*" and "*Apartment*". Their names are the planned object type names.

There are six “*RelationshipType*” relationships, each representing a relationship type in the new metamodel. Each “*RelationshipType*” relationship is renamed to its planned relationship type names. These are the names you see in the diagram.

![alt text](/images/posts/modelling/image_model031.png)

This small model is enough to generate a new metamodel, that will allow you to model people, houses, apartments and cars, and link them together with the appropriate relationships. 

### Generate the metamodel

The first time you want to generate a metamodel from the type definition model, there are a few things you need to do:

1. Create a new metamodel by right clicking the background and choose “***New Metamodel***” in the popup menu. You will be asked for a metamodel name.

2. Generate the metamodel content by right clicking the background and choose “***Generate Metamodel***”. You will then be asked two questions:

    -   “***Do you want to include system types***”? 
        At the time being answer “**No**” or “**Cancel**” to that question.

    -   “***Select Target Metamodel***”. 
        In the dropdown list select the metamodel you created above and click "*Done*". You should then get the message: 
        **Target metamodel has been successfully generated!**.

Now it is time to verify your metamodel, to see if you are able to build the desired model based on the type definitions you just created.

### Verify the metamodel
To do the verification create a new model based on your new metamodel and start modelling *persons*, *houses*, *apartments* and *cars*. 

You create the new model by right clicking the background and choose “*New Model*” in the popup menu. You will be asked to select a metamodel – select the one you just generated.

Then you will be asked for a model name and a modelview name. When the model has been created, switch to the model by selecting the model you just created.

That is, ***in the top right corner of the AKMM window*** 
You do that by clicking on "*Model*" ***in the top right corner of the AKMM window*** and select the model you just created.

The object types in the metamodel you created should now appear as object types in the left pane, and you should be ready to test that the metamodel works as expected. Create objects and relationships and do the verification as shown below. 

If you can create objects of your 4 types, and connect relationships according to your type definitions, you have succeeded. 

![alt text](/images/posts/modelling/image_model037.png)
