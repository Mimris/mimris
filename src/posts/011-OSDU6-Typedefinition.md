---
title: 'OSDU Modelling 6: Schema Model (Type Definition)'
date: 'May 31, 2024'
excerpt: 'First we need to define the scope and main Concepts'
cover_image: 'images/posts/osdu/image11-1.png'
---

### Define the WellAcquisition OSDU Types

Import existing OSDU Schema types like WellLog and Wellbore.

First we have to download the files from OSDU.

#### Download json-files from OSDU Data definitions

    - Open the left top “Hamburger” menu again, click on “OSDU IMPORT/EXPORT” and select “OSDU IMPORT.”
    - Click on the link at the bottom of the dialog, to open OSDU Data definitions on GitLab. A new Browser Tab is opened 
    - Find and open the WellLog.1.4.0.json file in the work-product-component folder and download it. (Open the file and click on the download button at the upper right.)

#### Find and open the Wellbore1.5.1.json in master-data folder and download it

#### Find and open the Type.1.0.0.json in type folder and download it

The Type will be used as a template for the new OSDUType Objects.

### Import the downloaded files

Go back to the previous Browser-Tab where we have the AKM Modeller open.  
(The Import/Export dialog should still be open)

### Import WellLog

First we will import the current version of WellLog.1.4.0.json with all properties and relationships (proxies).

We recommend making a new Modelview for this.

### Click on the “OSDU-Schema-model_TD” model-tab to open a empty model with AKM-OSDU_MM metamodel palette

### Open the top-left Hamburger menu and select “OSDU Import/Export” and then “OSDU IMP”

A Import OSDU Schema dialog will appear.

### Select (Check) all “Include Properties and relationships Proxies)

We need all existing properties, proxies etc. for WellLog to understand the impact of the new  
acquisition extension.

You can leave the first row all checked (or only Work_Product_Components) checked. .

### Click on “Choose files” and find the downloaded file “…/WellLog.1.4.0.json”

### Click “DONE” then “RELOAD”

The imported objects show up in the OBJECTS Palette to the left.  
(Click on the “< OBJECTS” (white text) in the upper left corner of the modelling area to open the palette)

## Import Wellbore without the properties

### Click on the OSDU IMPORT button again

### Uncheck all check-boxes in second row “Include Properties and relationships Proxies” and leave all in first row “Include EntityTypes”

Let all in check-boxes in second row be un-checked.  
We only want the master OSDU object for Wellbore, and no additional properties or proxies  
(As we are not going to make any changes to the Wellbore entity type. We can import that later if needed).

### Click on “Choose files” to find and downloaded file Wellbore.1.5.1.json to import

### Click “DONE”

## Repeat the same for the Type.1.0.0.json file

The Type object will be used as you will see later, as a template for new OSDU EntityTypes (OSDUTYPES).

 
# Make a new WellLog modelview

### Make sure you are on the “OSDU-Schema-model_TD” model-tab

This model has the **“AKM-OSDU_MM”** metamodel palette to the left.

### Right-Click on the background and select “New Modelview”, then type in the name i.e: “WellLog”

A new modelview tab will appear.

### Click on the new tab

# Modelling of the WellLog view

## Create a new Modelview

Right-click the background and select **“New Modelview”**. Then Enter a name: **“1-WellLog”** as Modelview name and click “OK”.

## Select the new Modelview-Tab

## Drag the WellLog Object from the OBJECTS Palette into the modelling area

 
## Right-click the Object and select “Add Connected Objects” to view all connected objects like Properties and Proxies

 You can arrange the objects to fill a landscape modelling area.  
 
# Modelling the Main OSDUtypes

## Open the “0-Mainview” Modelview-Tab again

### Drag and drop the WellLog and Wellbore objects into the modelling area

 
### Rename the object to WellLog.1.5.0 which is the new version we are making

## Generate relationships between WellLog and Wellbore

### Click the blue wide button in the middle of the dialog: “Convert temporary Proxy-objects to Relationships” to generate the relationship

### Click “Reload”

### Right-Click the background and select “Add missing Relationship Views” to show the relationship

 
## Add the new types we created as new Concepts in the OSDU-Concept-Model_CM

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

## Repeat to connect AbstractLogAcquisitionRunPass to WellLogAcquisition

Use the relationship type “refersTo”. Change the name of the relationship to “WellLogAcquisitionID”

## Repeat from WellLogAcquisition to Wellbore and give the name “WellboreID”

 
## Add “LogRuns”, “RunIdentifier”, “LogPasses” and “PassIdentifier” with relationships the same way

 
# Modelling details of the new types

## Make a new Modelview and name it i.e. “2-WellLogAcquisition. (The prefix number is to set the sequence of the modelviews.)

## Drag in a container into the new modelview and copy objects from the 0-MainView and “Paste View” into the container

(NB! Use “Past View” not “Paste” as we don’t want a duplicate of the object (the instance), but just make another view of the same object.)

## Arrange the objects in containers and add properties

## You can also import all related existing objects, like “abstract”, “reference-data”, “master-data” and “work-product-component”

NB! Here we only need to import the object without any properties and proxies (the check-boxes in second row of the import dialog, is all unchecked.) You can put them in a separate container and name it i.e. “Existing.”

## Finally, you can add suggested new objects, and put them in a separate container, within the New container

 
# Export CSV-files for import into OSDU Data definition on GitLab

## Open the left top menu again, click on “OSDU IMPORT/EXPORT” and select “EXPORT CSV TO OSDU.”

 
An Object details panel opens to the right. Click on the Export-tab at the top.

## Now in the modelling area, click on the object you want to export, and the CSV-preview is shown

## Click on the “Copy CSV” button to copy the CSV data and paste it into an Excel Spreadsheet

Follow the instruction in the “? HOW TO PASTE THE CSV INTO A SPREADSHEET”

## Mail from Thomas

Goal: We need to extend WellLog to offer an optional acquisition ### context.

### Prerequisites

There is an independent modeling exercise to define a WellLogAcquisition object. Its main purpose is to hold all details about a well log acquisition, which produces raw WellLog instances in potentially multiple runs, which contain multiple passes. (current proposal WellLogAcquisition.1.0.0 (1)).

WellLogAcquisition.1.0.0 (1) is treated as ‘black box’, it is just there defined as a master-data group-type entity.

WellLog.1.5.0 you already have, the next minor version, which should be extended – this is the basis or equivalent for the AKM import ().

### In AKM

You ‘somehow’ create a representation for the master-data WellLogAcquisition (without the detail inside)

You create an abstract fragment AbstractLogAcquisitionRunPass with version 1.0.0. (The happy outcome is attached with the same name). But you create the prop-links for (the descriptions are in the attached proposal spreadsheet)

a. WellLogAcquisitionID (string) – this is the relationship to WellLogAcquisition (aka foreign key) – I made this a mandatory property (JSON schema: required)

b. RunIdentifier (string)

c. PassIdentifier (string)

The meta model is used to declare the WellLogAcquisitionID property as ‘relationship’ to master-data WellLogAcquisition.

You load the work-product-component WellLog.1.5.0 as the ‘next version’ with all its elements. You may not need to ‘show’ all the details, which we are only adding new elements.

a. You add a new property to WellLog ‘AcquisitionDetail’, type nested object by reference, referring to an abstract group-type, the name AbstractLogAcquisitionRunPass and the version 1.0.0 (we need to uniquely identify the semantic version number we include/use as composition).

Now you can explain the change by creating views. Eventually, the approval could be done in AKM and you could fill the “State” column Y with Accepted (for the demo).

Now the CSV ‘copy by value’ starts:

Create a new abstract proposal for AbstractLogAcquisitionRunPass.1.0.0.xlsx – I attached a AbstractTemplate.1.0.0.xlsx for that purpose. It would have to be renamed, as the name has to match the main type name.

Open the WellLog.1.5.0 and add the one new row (or if you are brave and can recreate the entire content, the entire main 1.5.0 sheet.