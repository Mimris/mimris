---
title: ' OSDU Modelling 4: Concept Modelling'
date: 'May 31, 2024'
excerpt: 'First we need to define the scope and main Concepts. We use IRTV Metamodel (Information, Role, Task, View) for this.'
cover_image: 'images/posts/osdu/image11-1.png'
---

## Example: Concept Model:

Example: Concept Model with Information objects and added Properties, Views, Tasks and Roles

### Define the WellAcquisition OSDU Types

Import existing OSDU Schema types like WellLog and Wellbore.

First we have to download the files from OSDU.

#### Download json-files from OSDU Data definitions

1. -Open the left top “Hamburger” menu again, click on “OSDU IMPORT/EXPORT” and select “OSDU IMPORT.”
2. -Click on the link at the bottom of the dialog, to open OSDU Data definitions on GitLab. A new Browser Tab is opened 
3. -Find and open the WellLog.1.4.0.json file in the work-product-component folder and download it. (Open the file and click on the download button at the upper right.)

4. -Find and open the Wellbore1.5.1.json in master-data folder and download it

5. -Find and open the Type.1.0.0.json in type folder and download it

The Type will be used as a template for the new OSDUType Objects.

#### Import the downloaded files

Go back to the previous Browser-Tab where we have the AKM Modeller open.  
(The Import/Export dialog should still be open)

#### Import WellLog

First we will import the current version of WellLog.1.4.0.json with all properties and relationships (proxies).

We recommend making a new Modelview for this.

1. -Click on the “OSDU-Schema-model_TD” model-tab to open a empty model with AKM-OSDU_MM metamodel palette.  

2. -Open the top-left Hamburger menu and select “OSDU Import/Export” and then “OSDU IMP”.  

A Import OSDU Schema dialog will appear.


1. -Select (Check) all “Include Properties" and "Relationships Proxies".  
   

We need all existing properties, proxies etc. for WellLog to understand the impact of the new  
acquisition extension.

You can leave the first row all checked (or only Work_Product_Components) checked. .

1. -Click on “Choose files” and find the downloaded file “…/WellLog.1.4.0.json”

2. -Click “DONE” then “RELOAD”

The imported objects show up in the OBJECTS Palette to the left.  
(Click on the “< OBJECTS” (white text) in the upper left corner of the modelling area to open the palette)

### Import Wellbore without the properties

1. -Click on the OSDU IMPORT button again

2. -Uncheck all check-boxes in second row “Include Properties and relationships Proxies” and leave all in first row “Include EntityTypes”

Let all in check-boxes in second row be un-checked.  
We only want the master OSDU object for Wellbore, and no additional properties or proxies  
(As we are not going to make any changes to the Wellbore entity type. We can import that later if needed).

1. -Click on “Choose files” to find and downloaded file Wellbore.1.5.1.json to import

1. -Click “DONE”

Repeat the same for the Type.1.0.0.json file

The Type object will be used as you will see later, as a template for new OSDU EntityTypes (OSDUTYPES).

 
### Make a new WellLog modelview

Make sure you are on the “OSDU-Schema-model_TD” model-tab

This model has the **“AKM-OSDU_MM”** metamodel palette to the left.

1. -Right-Click on the background and select “New Modelview”, then type in the name i.e: “WellLog”

A new modelview tab will appear.

1. -Click on the new tab

### Modelling of the WellLog view

#### Create a new Modelview

1. -Right-click the background and select **“New Modelview”**. Then Enter a name: **“1-WellLog”** as Modelview name and click “OK”.

1. -elect the new Modelview-Tab

1. -Drag the WellLog Object from the OBJECTS Palette into the modelling area

 
1. -Right-click the Object and select “Add Connected Objects” to view all connected objects like Properties and Proxies

 You can arrange the objects to fill a landscape modelling area.  
 
### Modelling the Main OSDUtypes

1. -Open the “0-Mainview” Modelview-Tab again

1. -Drag and drop the WellLog and Wellbore objects into the modelling area

 
1. -Rename the object to WellLog.1.5.0 which is the new version we are making

### Generate relationships between WellLog and Wellbore

1. -Click the blue wide button in the middle of the dialog: “Convert temporary Proxy-objects to Relationships” to generate the relationship

1. -Click “Reload”

1. -Right-Click the background and select “Add missing Relationship Views” to show the relationship

 
### Add the new types we created as new Concepts in the OSDU-Concept-Model_CM

### Drag and drop the “Type.1.0.0” object from the Object-Palette into the Modelling area

We will use this object as a template for our new types.

### Right-click the object and select “Copy” and then Right-click the background and select “Paste”

(NB! Not “Paste view” as we want a copy of the object, not a view-copy)  
Right-click the new object and select “Edit Object”

Change all the places you find the Type.1.0.0 text and replace it with our new name “WellLogAcquisition”. (name, osduId and §id)

Change the groupType to “master-data”.

### Repeat for the AbstractLogAcquisitionRunPass

Set groupType to “abstract”. Connect the new Object to the imported WellLog and Wellbore Objects.

Move the cursor to the edge of the WellLog object (til you see the curved arrow), then Left-Click and drag over to the AbstractLogAcquisitionRunPass object and release the Left-Click to create a new Relationship. Select “Includes” relationshipType”.

### Repeat to connect AbstractLogAcquisitionRunPass to WellLogAcquisition

Use the relationship type “refersTo”. Change the name of the relationship to “WellLogAcquisitionID”

### Repeat from WellLogAcquisition to Wellbore and give the name “WellboreID”

 
1. -Add “LogRuns”, “RunIdentifier”, “LogPasses” and “PassIdentifier” with relationships the same way

 
## Modelling details of the new types

### Make a new Modelview and name it i.e. “2-WellLogAcquisition. (The prefix number is to set the sequence of the modelviews.)

1. -Drag in a container into the new modelview and copy objects from the 0-MainView and “Paste View” into the container

(NB! Use “Past View” not “Paste” as we don’t want a duplicate of the object (the instance), but just make another view of the same object.)

### Arrange the objects in containers and add properties

You can also import all related existing objects, like “abstract”, “reference-data”, “master-data” and “work-product-component”

NB! Here we only need to import the object without any properties and proxies (the check-boxes in second row of the import dialog, is all unchecked.) You can put them in a separate container and name it i.e. “Existing.”

### Finally, you can add suggested new objects, and put them in a separate container, within the New container

