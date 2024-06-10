---
title: ' OSDU Modelling 3: Start Modelling'
date: 'May 31, 2024'
excerpt: 'The task of acquiring data from a wellbore is known as well logging. The work is highly specialized and need to be properly planned and managed. Independent of access method, the well logging task is bound by the concepts of Run and Passes.'
cover_image: 'images/posts/osdu/image11-1.png'
---

## Use-case guide

### Open AKM Modeller

<https://akmmclient-alfa.vercel.app/modelling>

 ![image001](/images/posts/osdu/010-OSDU2-1.png)


### Start a new Project

---

For details see:  [Getting started with AKM Modelling](000-GettingStarted)

---

#### To start a new project, do the following:


1. -Click-on the left top Hamburger menu.  
2. -Click “LIST MODEL TEMPLATES” to get a list of templates from GitHub.  
3. -Select “AKM-OSDU-Schemamodelling-Template_PR.json”.   
(A dialog to edit the Project name and GitHub settings will appear).  
4. -Give your project a new name and add you GitHub data.  
5. -Click “Save GitHub settings” to save your changes.  
6. -Then Click “Save to local file” you save your project-file to your local filesystem.  
It will be saved with the name shown in the dialog Filename.

PS! Check the name in “Save As: field”. Sometimes it suggests wrong name (not the one you just typed in).  
This is a known bug; we are working to fix it.  
You can Exit this dialog and Click” Save to local file” again, and it should be ok.

 

- -Then Click “Exit” to close the dialog-window

---

#### Explore and Define Main Concepts for WellAcquisition

For modelling the Concepts, we use the IRTV-metamodel.


#### Open the OSDU Concept_CM Model tab

- -Select the 0-Main tab

We start with creating Information objects for existing affected EntityTypes: WellLog and Wellbore.

Then we create Information-objects for the new types WellAcqusition with LogRun and LogPass objects.


1. -Drag in two Information-objects and name them WellLog and Wellbore
2. -Drag in three more “Information objects” and name them WellAcquisition, LogRun and LogPass
3. -Create relationships of type “refersTo” between them.
  
---
#### Colors

If you want colors on the Objects, you can Right-Click an object and select “Edit Objectview”

Click on the “fillcolor” field and select the color:

 
(If you want to add OSDU grouptype colors to the information objects, use the following colors:

Master-data "lightsalmon"  
work-product-component: "#FFD701"  
reference-data: "turquoise"  
abstract: "#87CEFE"

)


---
 - [-next-](011-OSDU4-Example)
---