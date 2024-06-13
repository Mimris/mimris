---
title: 'OSDU Modelling 2:  Background'
date: 'May 31, 2024'
excerpt: 'The task of acquiring data from a wellbore is known as well logging. The work is highly specialized and need to be properly planned and managed. Independent of access method, the well logging task is bound by the concepts of Run and Passes.'
cover_image: 'images/posts/osdu/image11-1.png'
---

OSDU WellLogAcquisition extension

(Usecase Demo-script)

Background:

# Well Logging

Context – the well logging task

The task of acquiring data from a wellbore is known as well logging. The work is highly specialized and need to be properly planned and managed. Well logging is performed by lowering a sensor probe, or more typically an array of sensors into the borehole. The sensor probes can either be attached to the drill string as part of the BHA (Bottom Hole Assembly) or it can be sent down independently using a wireline. Independent of access method, the well logging task is bound by the concepts of Run and Passes.

Concept model:

 ![image001](/images/posts/osdu/image010-1.png)


A Run is a trip with the drill string or sensor probe assembly into the bore hole. A Pass is the activation of one or several sensors with a specific acquisition configuration while the drill string or sensor probes are hoisted up and down within the context of a Run.

Alternatively, specific sensor probes or acquisition methods require stationary data acquisitions, meaning no movement of the sensor(s) during acquisition. These acquisitions are commonly recorded as time series (continuous probe measurements vs. time at constant depth). The output of a single log pass is a data file with the acquired measurements, typically referenced to measured depth along the wellbore, or as mentioned for stationary acquisitions – measurements referenced to time. A single run can hence have multiple log passes.

The figure below captures the nature of the problem to be solved.


 ![image001](/images/posts/osdu/image010-2.png)

From the modelling side the task is to create the Well Log Acquisition data structure and make the required modifications on the Well Log schema to include the Run and Pass IDs.

This includes design of the Run and Pass data records with their content.

  -Known additional Run properties are tool string configuration with various sensor offsets, start time, end time, minimum depth, maximum depth, and the log run array.

  -Known Pass properties are pass-type, log direction, flowing conditions, hole type, sampling domain type, convergence method, and fluid type.

Since the schemas are already made further details will not be repeated here. In a real-world scenario, detailing of concepts into tangible structures is the name of the game.

---

# Demo Case

## Goal

We need to extend WellLog to offer an optional acquisition context. (See details below)

## How

Use AKM Modeller to create a model of the new WellLog version and add necessary  
EntityTypes, Properties, Proxies, and relationships.  
Export the model as CSV to Excel.

## Result

An Excel spreadsheet ready to be imported as schema to OSDU Data Definitions.

---

**Steps**:

####    1. Build a Concept Model (Scoping and understanding)  
- a. Create a Concept-model using IRTV to get an overview of which Information objects we need for the extension, both new and existing affected concepts should be modelled.  
- b. Add necessary Views, Tasks and Roles to get an overview over the domain.  
- c. We also may add important Properties at this stage, i.e. how to manage identity (id) of the objects (Global id’s?).  

#### 2. Define new types in a Type-Definition Model  
- a. Import WellLog and Wellbore from OSDU  
- b. Edit and make a new updated WellLog version.  
- c. Create new Objects for WellLogAcquisition and AbstractLogAcquisitionRunPass.  
- d. Add Arrays, Items, Properties and Proxies for the new types.  
- e. Arrange visually good modelviews to present the model content. 

#### 3. Export CSV to update OSDU Schema  
- a. Export the changes as CSV (Comma Separated Values) files to paste into the OSDU Import Spreadsheet.

---

## Instruction Videos

Click on Videos in the Top Main menu to access instruction videos for building OSDU Schema models.

1. Concept modelling
2. Core Type definition modelling
3. OSDU Schema import
4. OSDU Schema modelling
5. OSDU Schema export to Excel of new/changed schema


 - [-next-](011-OSDU3-UseCase)
---

---

## Initial Project requirements 

Goal: We need to extend WellLog to offer an optional acquisition context.

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