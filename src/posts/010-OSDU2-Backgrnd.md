---
title: ' OSDU 2: ----- Demo usecase: Background'
date: 'May 31, 2024'
excerpt: 'The task of acquiring data from a wellbore is known as well logging. The work is highly specialized and need to be properly planned and managed. Independent of access method, the well logging task is bound by the concepts of Run and Passes.'
cover_image: 'images/posts/osdu/image010-1.png'
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

We need to extend WellLog to offer an optional acquisition context.

## How

Use AKM Modeller to create a model of the new WellLog version and add necessary  
EntityTypes, Properties, Proxies, and relationships.  
Export the model as CSV to Excel.

## Result

An Excel spreadsheet ready to be imported as schema to OSDU Data Definitions.

---

**Steps**:

- Build a Concept Model (Scoping and understanding):
  - Create a Concept-model using IRTV to get an overview of which Information objects we need for the extension, both new and existing affected concepts should be modelled.
  - Add necessary Views, Tasks and Roles to get an overview over the domain.
  - We also may add important Properties at this stage, i.e. how to manage identity (id) of the objects (Global id’s?).
- Define new types in a Type-Definition Model
  - Import WellLog and Wellbore from OSDU
  - Edit and make a new updated WellLog version.
  - Create new Objects for WellLogAcquisition and AbstractLogAcquisitionRunPass
  - Add Arrays, Items, Properties and Proxies for the new types.
  - Arrange visually good modelviews to present the model content.
- Export CSV to update OSDU Schema
  - Export the changes as CSV (Comma Separated Values) files to paste into the OSDU Import Spreadsheet.

## Instruction Videos

Click on Videos in the Top Main menu to access instruction videos for building OSDU Schema models.

1. Concept modelling
2. Core Type definition modelling
3. OSDU Schema import
4. OSDU Schema modelling
5. OSDU Schema export to Excel of new/changed schema

