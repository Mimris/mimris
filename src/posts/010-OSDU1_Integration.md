---
title: 'OSDU 1: Integration with the OSDU Data Platform'
date: 'Oct 19, 2021 sf'
excerpt: 'The Open Subsurface Data Universe Data platform contains a set of standardized data definitions and Object types that is used to when ingesting data into the platform. The core functionality of this module consists of the ability to import and export OSDU Json files to AKM models.'
cover_image: 'images/posts/osdu/osdu.png'
---

## Introduction  

![OSDU Forum](/images/posts/osdu/osdu.png)

---

The OSDU (Open Subsurface Data Universe) Data platform, contains Schemas,  a set of standardized data definitions and Object types with properties and relationships, that is used when ingesting data into or extracting data from the platform. 


The core functionality of this module, consists of the ability to import and export Json files according to these definitions. JSON is a lightweight data interchange format, and has become a popular standard format for exchanging data between applications. Even if JSON is human readable, it is not easy to see and identify the relationships between the data (Json-files). This AKM module provides a way to import and export OSDU Json files from/to AKM models.

The AKM model presents the complex Json-file structure and relationships between the ObjectTypes in a user friendly graphical and a more understandable and concise way.

This makes it easy to edit and expand the Metamodels to embrace new product categories. The Object types are enhanced and expanded by adding new properties and relationships. The new enhanced models can then be exported as Json-files for import into the OSDU Data platform.

Table of contents:

- [Introduction](#introduction)
- [OSDU Extensions of the AKM Core Metamodel](#osdu-extensions-of-the-akm-core-metamodel)

---

## OSDU Extensions of the AKM Core Metamodel

We have made an extension of the AKM-Core Metamodel and made a OSDU specific metamodel called: "AKM-OSDU-Schemamodelling-Template".

To start OSDU Schema import and modelling, Click on the top-left Hamburger menu and select "NEW PROJECT"

Click on LIST MODEL TEMPLATES and select "AKM-OSDU-Schemamodelling-Template_PR.json" to start modelling.





---
 - [-next-](010-OSDU2-Backgrnd)
---