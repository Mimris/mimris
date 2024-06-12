---
title: ' OSDU Modelling 4: Concept Modelling'
date: 'May 31, 2024'
excerpt: 'First we need to define the scope and main Concepts. We use IRTV Metamodel (Information, Role, Task, View) for this.'
cover_image: 'images/posts/osdu/image11-1.png'
---

## Explore and Define Main Concepts for WellAcquisition

For modelling the Concepts, we use the IRTV-metamodel.

For more detailed instructions see video:  https://app.guidde.com/playbooks/5kfvMyqNcETCnu44cx5u9h

---

#### Example: Concept Model:

Example: Concept Model with Information objects and added Properties, Views, Tasks and Roles

#### Start Concept Modelling

We continue from the model we made in the [- previous step -](011-OSDU3-UseCase)

- -Open the OSDU Concept_CM Model tab

- -Select the 0-Main tab

We start with creating Information objects for existing affected EntityTypes: WellLog and Wellbore.

Then we create Information-objects for the new types WellAcqusition with LogRun and LogPass objects.


1. -Drag in two Information-objects and name them WellLog and Wellbore
2. -Drag in three more “Information objects” and name them WellAcquisition, LogRun and LogPass
3. -Create relationships of type “refersTo” between them.

##### Example Concept Model:
![AKM Modeller](/images/posts/osdu/image11-1.png)


The model can also include Roles, Tasks and Views.

![image](/images/posts/osdu/011-OSDU3-2.png)
  
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
 - [-next-](011-OSDU5-Import)
---