---
title: 'Integration with the OSDU Data Platform'
date: 'Oct 19, 2021 sf'
excerpt: 'The Open Subsurface Data Universe Data platform contains a set of standardized data definitions and Object types that is used to when ingesting data into the platform. The core functionality of this module consists of the ability to import and export OSDU Json files to AKM models.'
cover_image: 'images/posts/osdu/image001.png'
---

## Introduction  

The OSDU (Open Subsurface Data Universe) Data platform, contains a set of standardized data definitions and Object types with properties and relationsips, that is used to when ingesting data into the platform. The core functionality of this module, consists of the ability to import and export Json files according to these definitions. JSON is a lightweight data interchange format, and has become a popular standard format for exchanging data between applications. Even if JSON is human readable, it is not easy to see the relationships between the data (Json-files). This AKM module aims to provide a way to import and export Json files to AKM models.

The AKM model present the complex Json-file structure and relatioship between the ObjectTypes in a graphical and a more understandable and concise way.

This makes it easy to edit and expand the Metamodel into new product categories. The Object types is enhanced and expanded by adding new properties and relationships. The new enhanced model can then be exported as Json-file for import into the OSDU Data platform.

table of contents:

  - [Extensions of the IRTV-Metamodel](#extensions-of-the-irtv-metamodel)
  - [Importing the OSDU Metamodel types](#importing-the-osdu-metamodel-types)
  - [Importing a OSDU Json-file to an AKM Model type](#importing-a-osdu-json-file-to-an-akm-model-type)
  - [Importing the OSDU Json-file as a Json structure model](#importing-the-osdu-json-file-as-a-json-structure-model)

---

## Extensions of the IRTV Metamodel

The AKM Osdu-Metamodel extensions are built on the AKM IRTV-Metamodel (see separat description in th help documentation). These extensions can extend the capabilities of the IRTV-Metamodel to include specific Json objects and attributes, that represent the structure of Json-file object structure.

The EntityType Objecttype is extended to include some osdu and json-file specific properties.

        -name
        -osduId
        -jsonType
        -osduType
        -jsonKey

In addition the EntityType Property is extended to include osdu and json-file specific properties.

        -title
        -pattern
        -example

![alt text](/images/posts/osdu/image001.png)


*This model is a **concept model** that defines the structure and content of the OSDU Json-file.*  

As shown in the figure above, the  -name, -osduId, -title, -pattern and example properties can be of a long text, and therefore defined as Datatype **textarea**

The -jsonType and -osduType are defined as enum Datatypes, and connected to Value objects with **hasAllowed** and **isDefault** relationships.

Two new EntityTypes are added:

**JsonObject** and **JsonArray** is used to represent objects and arrays in a Json-file. The relationships **hasMember** is used to represent members of Json-file arrays. The relationships **hasPart** is used to represent the structure of the Json-file object tree.


To generate a metamodel from this model, right-click the background and choose **Generate Metamodel** command. 
A dialog-box will appear asking "Do you want to include system types". Click Ok to include system types. 
A new dialog-box will appear where you can select wich metamodel you want to generate.


(Note: A metamodel has to exist before you can generate a metamodel from a concept model.  On the background menu choose **New Metamodel** to create a new metamodel.)

## Importing the OSDU Metamodel types

Now its ready to use the OSDU Metamodel to create a new OSDU Concept model:
On the background menu choose **Create New Model** to create a new model.
You will be asked which Metamodel to use and then enter a name for the model.

Open the new model. an you will on the left side see the generated metamodel types.

![alt text](/images/posts/osdu/image002.png)

---
Select the MM tab on the left side and you will see the OSDU metmodel with both the IRTV and OSDU metamodel object and relationship types. This is the available types that can be used to model new consept models.

![image3](/images/posts/osdu/image003.png)

---
 - [-back to the top-](#introduction)
---

## Import (Open) a OSDU Start-up Model (Json-file)

Click on the **Model file** button (blue button) to open the Import dialog and then Click on  the **Choos file** button to select a file to import.

![alt text](/images/posts/osdu/Screenshot2021-10-20at02.13.36.png)

Then click Done button

---
 - [-back to the top-](#introduction)
---

## Importing a OSDU Json-file to an AKM Model type

Then click the **OSDU Json file (1)** button to open the Import dialog and then Click on the **Choos file (2)** button in the blue area to select a **OSDU JSON file** to import. Then Click **Done (3)** button.

![alt text](/images/posts/osdu/Screenshot2021-10-20-5.png)

Click on the modelview tab **Main (1)** or **refresh (2)** (upper right) to refresh the model.
Then click on the **Objects (3)** tab to see the imported objects. Find and drag the top level object (i.e. Wellbore) **(4)** to the modelview **(5)**.

![alt text](/images/posts/osdu/Screenshot2021-10-20-4.png)

Then right-click the object and choose **Add Connected Objects** to add the child objects.
Type in the number of levels to add in the dialog-box.

![alt text](/images/posts/osdu/Screenshot2021-10-20-2.png)

The imported **EntityType** with properties is added to the modelview.

![alt text](/images/posts/osdu/Screenshot2021-10-20-1.png)

If you want to add more objects, you can now add them to the modelview.

---
 - [-back to the top-](#introduction)
---

## Importing the OSDU Json-file as a Json structure model

Then click the **Choose file** button in the green OSDU Json filestructure to open the Import dialog and then Click on  the **Choos file** button to select a **OSDU JSON file** to import. Then Click Done button. 
Find and drag the top level object (i.e. Wellbore.1.0.0.json) to the modelview.

![alt text](/images/posts/osdu/image007.png)

Then right-click the object and choose **Add Connected Objects** to add the child objects.
Type in the number of levels to add in the dialog-box.

![alt text](/images/posts/osdu/image008.png)

The imported **EntityType** with properties is added to the modelview.

![alt text](/images/posts/osdu/image009.png)

---
 - [-back to the top-](#introduction)
---