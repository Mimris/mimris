---
title: 'The Metamodelling Process'
date: 'November 1, 2021'
excerpt: 'How to build type definition models and then generate metamodels.'
cover_image: 'images/posts/modelling/image_model001.png'
---

First a few words about terminology. 

There are in principle two kinds of models – models whose focus is on type definitions, i.e. we define types that compose a modelling language (a metamodel), and models that are based upon a (generated) metamodel (the generated modelling language).  

In this chapter the focus is on the technicalities associated with developing type definition models, generating metamodels, creating models based on the generated metamodel and then start over again by making changes to the type definition model.

## Build the metamodel

Let us start with the built-in metamodel:

![alt text](/images/posts/modelling/image_model001.png)

The left pane contains the object types in the initial metamodel, that the user can use to build a type definition model.

### Model the type definition model

When building a type definition model the primary type used to represent an object type, is “*EntityType*”. You drag “*EntityType*” into the modelling area and drop it to create an object representing your new type. You set the object name to the typename you decide. You do this for as many types you want. 
Relationship types are modelled as relationships of type “*relationshipType*” between “*EntityTypes*” in the model and renamed to the typename you decide.

### The example

In this chapter we will use an example metamodel as defined below. It has four different object types, "*Person*", "*House*", "*Apartment*" and "*Car*", with relationship types "*owns*" and "*rents*" as shown in the next model diagram.

There are four “*EntityType*” objects, each representing an object type in the intended new metamodel. Their names are the planned object type names.
There are six “*isRelatedTo*” relationships, each representing a relationship type in the new metamodel. Each “*isRelatedTo*” relationship is renamed to its planned relationship type names. These are the names you see in the diagram.

![alt text](/images/posts/modelling/image_model031.png)

This small type definition model is enough to generate a new metamodel, that will allow you to model people, houses, apartments and cars, and link them together with the appropriate relationships. 

### Generate the metamodel

The first time you want to generate a metamodel from the type definition model, there are a few things you need to do:

1. Create a new metamodel by right clicking the background and choose “***New Metamodel***” in the popup menu. You will be asked for a metamodel name.

2. Generate the metamodel content by right clicking the background and choose “***Generate Metamodel***”. You will then be asked two questions:

3. “***Do you want to include system types***”? At the time being answer “*No*” or “*Cancel*” to that question.

4. “***Select Target Metamodel***”. In the dropdown list select the metamodel you created above and click "*Done*". You should then get the message: “*Target metamodel has been successfully generated!*”.

Now it is time to verify your metamodel, to see if you are able to build the desired model based on the type definitions you just created.

### Verify the metamodel
To do the verification create a new model based on your new metamodel and start modelling *persons*, *houses*, *apartments* and *cars*. 

You create the new model by right clicking the background and choose “*New Model*” in the popup menu. You will be asked to select a metamodel – select the one you just generated.

Then you will be asked for a model name and a modelview name. When the model has been created, switch to the model by selecting the model you just created in the pulldown dialog "*Model:*" ***in the top right corner of the AKMM window***. 

The object types in the metamodel you created should now appear as object types in the left pane, and you should be ready to test that the metamodel you created works as expected. Create objects and relationships and do the verification as shown below. 

If you can create objects of your 4 types, and connect relationships according to your type definitions, you have succeeded. 

![alt text](/images/posts/modelling/image_model0371.png)

### Modify the metamodel
If something is wrong, or you want to change anything, go back to the type definition model, do the necessary changes, and generate the metamodel again.

If you want to add symbols and colors to your types, go back to your type definition model to add view specifications, and generate the metamodel again.

The view specifications are done by editing “*Object View*” of the “*EntityType*” objects and by editing “*Relationship View*” of the “*relationshipType*” relationships. 
The “*Object View*” and “*Relationship View*” definitions are used to define the corresponding “*Object Typeview*” and “*Relationship Typeview*” definitions in the generated metamodel.

