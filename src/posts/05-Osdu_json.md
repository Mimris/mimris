---
title: 'Integration with the OSDU Data Platform'
date: 'Oct 19, 2021 sf'
excerpt: 'The Open Subsurface Data Universe Data platform contains a set of standardized data definitions and Object types that is used to when ingesting data into the platform. The core functionality of this module consists of the ability to import and export OSDU Json files to AKM models.'
cover_image: 'images/posts/osdu/image001.png'
---

## Open Subsurface Data Universe  

The Open Subsurface Data Universe Data platform contains a set of standardized data definitions and Object types that is used to when ingesting data into the platform. The core functionality of this module consists of the ability to import and export OSDU Json files to AKM models.

AKMM allows you to import/export OSDU Json files into and from AKM models. Json data is delivered in a standard format that can be delivered in any industry for import into any platform.

The AKM model present the complex Json-file structure in an understandable and concise way.

This makes it easy to expand the Metamodel into new product categories. The Object types is enhanced and expanded by adding new properties and relationships. The new enhanced model can then be exported as Json-file for import into the OSDU Data platform.

The OSDU Metamodel is a set of different modular models that can be adapted to different specific domains. The models can be adapted to different domains, such as financial, social and physical domains. 

### Extensions of the IRTV Metamodel

The AKM Osdu-Metamodel extensions are built on the AKM IRTV-Metamodel. These extensions can extend the capabilities of the IRTV-Metamodel to include Json objects and attributes, to represent the structure of Json-file object structure.

The EntityType Objecttype is extended to include som osdu and json-file specific properties.

        -name
        -osduId
        -jsonType
        -osduType
        -jsonKey

In addition the EntityType Property is extended to include osdu and json-file specific properties.

        -title
        -pattern
        -example

The  -name, - osduId, - title, - pattern and example properties are can be of a long text, and therefore defined as Datatype *textarea*

The - jsonType and - osduType are defined as a enum Datatypes, and connected to Value objects with *hasAllowed* and *isDefault* relationships.

Two new Objecttypes are added:

EntityType *JsonObject* and *JsonArray* used to represent objects and arrays in Json-file. The relationships *hasMember* is used to represent members of Json-file arrays. The relationships *hasPart* is used to represent the structure of the Json-file object tree.


![alt text](/images/posts/osdu/image001.png)


This model is a *concept model* defining the OSDU Metamodel.  To generate a metamodel from this model, right-click the background and choose *Generate Metamodel* command. A dialog-box will appear asking "Do you want to include system types". Click Ok to include system types. A new dialog-box will appear where you can select wich metamodel you want to generate.

(Note: A metamodel has to exist before you can generate a metamodel from a concept model.  On the background menu choose *New Metamodel* to create a new metamodel.)

## Using the OSDU Metamodel

Now its ready to use the OSDU Metamodel to create a new OSDU Concept model:
On the background menu choose *Create New Model* to create a new model.
You will be asked which Metamodel to use and then enter a name for the model.

Open the new model. an you will on the left side see the generated metamodel types.

![alt text](/images/posts/osdu/image002.png)

---
Select the MM tab on the left side and you will see the OSDU metmodel with both the IRTV and OSDU metamodel object and relationship types. This is the available types that can be used to model new consept models.

![alt text](/images/posts/osdu/image003.png)




![alt text](/images/posts/osdu/image004.png)

![alt text](/images/posts/osdu/image005.png)

![alt text](/images/posts/osdu/image006.png)

![alt text](/images/posts/osdu/image007.png)

![alt text](/images/posts/osdu/image008.png)

![alt text](/images/posts/osdu/image009.png)

![alt text](/images/posts/osdu/image010.png)

 

