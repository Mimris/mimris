---
title: 'Building a Metamodel'
date: 'October 25, 2021'
excerpt: 'Building an example Metamodel'
cover_image: 'images/posts/overview/image00.png'
---

## The Metamodel

First a few words about terminology. 

There are in principle two kinds of models – models whose focus is on type definitions, i.e. we define types that compose a modelling language (a metamodel), and models that are based upon the generated metamodel (the modelling language).  

In this chapter the focus is on the technicalities associated with developing type definition models, generating metamodels, creating models based on the generated metamodel and then start over again by making changes to the type definition model.

When you start AKM Modeller, an initial model using an initial metamodel is opened.

![alt text](/images/posts/modelling/image_model022.png)

The left pane above contains the object types in the initial metamodel, which the user can use to build a model. 
A model can have different purposes, for example, a model can be used to generate a new metamodel. This model we call a type definition model.


## Making a new metamodel

Building a new metamodel is a process of creating a type definition model and then generate the metamodel. 

When building a type definition model we use an “EntityType” to represent the ObjectType and an "isRelatedTo" relationship to represent a RelationshipType between EntityTypes.

You drag “EntityType” into the modelling area and drop it to create an object representing your new type. 
You give the object a name, which will be the new ObjectType name, and you give it a description.

Relationship types are created by dragging a link between two EntityTypes of type "isRelatedTo" and then rename it to the typename you decide.

When you regard your model of the type definition model to be complete, you do a "Generate Metamodel" to create your new metamodel. This should be followed by a "New Model" based on your new metamodel, in which you can verify that your new metamodel behaves as expected.

