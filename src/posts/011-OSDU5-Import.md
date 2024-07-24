---
title: 'OSDU 5: Import OSDU Schema'
date: 'May 31, 2024'
excerpt: 'Import and define the Schema types to be used. OSDU Entitytypes with Properties and Relationships (Proxies).'
cover_image: 'images/posts/osdu/image11-1.png'
---


### Define the WellAcquisition OSDU Types

Import existing OSDU Schema types like WellLog and Wellbore.

First we have to download the files from OSDU.

#### Download json-files from OSDU Data definitions


1. -Open the left top “Hamburger” menu again, click on “OSDU IMPORT/EXPORT” and select “OSDU IMPORT.”

![image](/images/posts/osdu/011-OSDU5-1.png)

1. -Click on the link at the bottom of the dialog, to open OSDU Data definitions on GitLab. A new Browser Tab is opened 

![image](/images/posts/osdu/011-OSDU5-2.png)

2. -Find and open the WellLog.1.4.0.json file in the work-product-component folder and download it. (Open the file and click on the download button at the upper right.)

3. -Find and open the Wellbore1.5.1.json in master-data folder and download it

4. -Find and open the Type.1.0.0.json in type folder and download it

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

![image](/images/posts/osdu/011-OSDU5-1.png)


1. -Select (Check) all “Include Properties" and "Relationships Proxies".  
   
We need all existing properties, proxies etc. for WellLog to understand the impact of the new  
acquisition extension.

You can leave the first row all checked (or only Work_Product_Components) checked. .

1. -Click on “Choose files” and find the downloaded file “…/WellLog.1.4.0.json”

2. -Click “DONE” then “RELOAD”

The imported objects show up in the OBJECTS Palette to the left.  
(Click on the “< OBJECTS” (white text) in the upper left corner of the modelling area to open the palette)

![image](/images/posts/osdu/011-OSDU5-3.png)

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

You can also import all related existing objects, like “abstract”, “reference-data”, “master-data” and “work-product-component”

NB! Here we only need to import the object without any properties and proxies (the check-boxes in second row of the import dialog, is all unchecked.) 

---
 - [-next-](011-OSDU6-Typedefinition)
---