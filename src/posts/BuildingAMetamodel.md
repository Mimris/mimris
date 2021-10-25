---
title: 'Building a Metamodel'
date: 'October 25, 2021'
excerpt: 'Building an example Metamodel'
cover_image: 'images/posts/overview/image00.png'
---

## The Metamodel

In this chapter the focus is on the technicalities associated with developing models of metamodels, generating metamodels, creating models based on the generated metamodel and then start over again by making changes in the metamodel design.

When you start AKM Modeller, an initial model using a initial metamodel is opened.

![alt text](/images/posts/modelling/image_model022.png)

The left pane above contains the object types in the initial metamodel, which  user can be used to build a model. 
A model can have different purposes, for example, a model can be used to generate a new metamodel. This is often called a concept model.


## Making a new metamodel

Building a metamodel is a process of creating a model of the metamodel. This is often called a concept model i.e. a model of the concepts or object types. 

When building a concept model we use an “EntityType” to represent the ObjectType and a "relationType" to represent the relationships between EtityTypes.
(this can also be referred as a graph model, with the nodes (vertices) representing the object types and the edges representing the relationships between the object types)

You drag “EntityType” into the modelling area and drop it to create an object representing your new type. 
You give the object a name, which will be the new ObjectType name and a description.
Relationship are created by dragging a link between two EntityTypesof type “isRelatedTo” between “EntityTypes”
in the model and renamed to the typename you decide.

