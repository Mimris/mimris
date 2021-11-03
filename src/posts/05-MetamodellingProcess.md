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

We go back to the situation when AKMM is started with the built-in metamodel.

![alt text](/images/posts/modelling/image_model001.png)

The left pane above contains the object types in the initial metamodel, which the user can use to build a type definition model.

### Model the metamodel

When building a type definition model the primary type used to represent an object type, is “*EntityType*”. You drag “*EntityType*” into the modelling area and drop it to create an object representing your new type. You set the object name to the typename you decide. You do this for as many types you want. 
Relationship types are modelled as relationships of type “*RelationshipType*” between “*EntityTypes*” in the model and renamed to the typename you decide.

### The example

In the following we use the same example as described in the “Build a model” chapter. 
With default typeviews the metamodel looks as shown below.

There are four “*EntityType*” objects, each representing an object type in the intended new metamodel. Their names are the planned object type names.
There are six “*isRelatedTo*” relationships, each representing a relationship type in the new metamodel. Each “*isRelatedTo*” relationship is renamed to its planned relationship type names. These are the names you see in the diagram.

![alt text](/images/posts/modelling/image_model031.png)

This small model is enough to generate a new metamodel, that will allow you to model people, houses, apartments and cars, and link them together with the appropriate relationships. 

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

![alt text](/images/posts/modelling/image_model037.png)

### Modify the metamodel
If something is wrong, or you want to change anything, go back to the type definition model, do the necessary changes, and generate the metamodel again.

If you want to add symbols and colors to your types, go back to your type definition model to add view specifications, and generate the metamodel again.

The view specifications are done by editing “*Object View*” of the “*EntityType*” objects and by editing “*Relationship View*” of the “*isRelatedTo*” relationships. 
The “*Object View*” and “*Relationship View*” definitions are used to define the corresponding “*Object Typeview*” and “*Relationship Typeview*” definitions in the generated metamodel.

There is one variant of object views that has not been mentioned yet. There is an attribute “*viewkind*” that has two values: “*Object*” and “*Container*”. A “*Container*” acts like a folder in a file system, you can put objects inside the container and those objects will follow the container when the container is moved.

In all examples so far “*viewkind*” has the value “*Object*”.  When setting the value to “*Container*” the objectview will start behaving like a container. This is illustrated below:

![alt text](/images/posts/modelling/image_model0361.png)

To the left we see two object views of the same object, both with “*viewkind*” having the value “*Object*”. To the right we see the same object views, but in the one to the right “*viewkind*” has the value “*Container*”.

BUT: If you want a generated type to behave like a container, you need to give “*viewkind*” of the “*Object*” the value “*Container*”. In this case the value in the “*Objectview*” is ignored when the metamodel is generated.

### Detailing the metamodel

The first thing you do when you want to add more details to your metamodel than just defining object and relationship types is to add properties to your object types. This is done in the model of your metamodel. 
For example, in our test metamodel defined above, we could add properties to “Person”, like:

    -   Phone number
    -   Email address
    -   Birth date
    -   Etc.

And to the “House”:

    -   Address
    -   Size
    -   Year built
    -   Etc.

If you do that, and then regenerate the metamodel, those properties will appear as attributes in the “*Edit Object*” dialog of the "*Person*" and "*House*" objects.

If nothing further is said about the properties, they will all be “*string*” properties, with no restrictions on the values.

![alt text](/images/posts/modelling/image_model035.png)

By adding “*Datatype*” to a property, you start adding constraints to the allowed values. The potential constraints are covered by the part of the AKMM initial metamodel, shown in the figure above.

The built-in datatypes are:

    -	string
    -	integer
    -	number
    -	boolean
    -	date

All custom datatypes will be based on one of these. This means that you as a metamodeller can define your own datatypes that combine the built-in types with additional specifications. 

E.g., to define an enumeration list, you may define:

    -	one or more "hasAllowed" relationships to a "Value"
    -	one "isDefault" relationship to one of the "Values"

Combine this with a **FieldType** “*radio*” or “*select*” and this field will in the property dialog appear as a dropdown list, with the default value being the initial value.

The **FieldTypes** currently supported by the Modeller are the following:

    -	checkbox
    -	color
    -	date
    -	email
    -	file
    -	image
    -	month
    -	number
    -	password	
    -	radio
    -	range
    -	select
    -	text
    -	textarea
    -	time
    -	url
    -	week

**InputPatterns** are used to check if values entered by the user are valid / allowed values. 
The mechanism to check this is “**Regular Expressions**”. A regular expression engine has been embedded in AKMM for this purpose.
Ref: https://www.w3schools.com/jsref/jsref_obj_regexp.asp 
and https://www.regular-expressions.info/examples.html

**ViewFormats** are included as a mechanism to format how attribute values are shown in dialogs. The formatting mechanism used is the **printf** C functions family, implemented in Javascript.
Ref: https://alvinalexander.com/programming/printf-format-cheat-sheet/

