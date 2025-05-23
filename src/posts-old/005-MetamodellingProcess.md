---
title: 'The Metamodelling Process'
date: 'November 1, 2021'
excerpt: 'How to build type definition models and then generate metamodels.'
cover_image: 'images/posts/modelling/image_model001.png'
---

## Build Type Definition Models (TD)

To build the new Metamodel we have to define the **ObjectTypes** and **RelationshipsTypes** we want to use.
This is done by building a **Type-definition-model_TD** based on the **AKM-CORE_META** metamodel. 

<details>  <summary>Build a Type-definition model ...</summary>

... 

### Create Initial Containers ...

<details>  <summary>Create Initial Containers ...</summary>


Let us start with an empty model and the built-in ***CORE_META*** metamodel:

![Initial page with blank modelling area and CORE_META types in the Palette](/images/posts/modelling/image_model001.png)

The left pane contains the object types in the initial metamodel, that the user can use to build a type definition model.


From the Palette (left pane) drag the ***Container*** type and drop it into the Modelling area.

Click on the name and edit ***name*** ( Name it  ***"Domain Types"*** i.e. ***"Bikerental Types"***).

Right-Click the object to edit  ***description***.


<a href="images/help/Demo-InitialContainers.png" target="_blank">
<code style="color: blue"> 
<font size="2" weight="bold">

![Create EntityType](images/help/Demo-InitialContainers.png)

</font>
</code>
Click on the picture to open in New Tab!</a>

</details>

---

### Create EntityTypes ...

<details>  <summary>Create EntityTypes ...</summary>

From the Palette (left pane) drag the ***EntityType*** and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description*** and ***proposedType***.

The attribute "proposedType" is used to give the Concept-/ Information-object a proposed TypeName.

<a href="images/help/Create-EntityType.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">
![Create EntityType](images/help/Create-EntityType.png)</font>
</code>
Click on the picture to open in New Tab!</a>
</details>

---

### Add Tasks and Role ....

<details>  <summary>Add Tasks and Role ...</summary>

In the  Palette > ***Additional Metamodels*** (lower left pane) select AKM-IRTV_META metamodel.

From this Palette drag the ***Task*** object-type and drop it into the Container ***"Tasks and Roles"***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description*** and ***proposedType***.

Connect the ***Task*** object with the appropriate ***EntityType***, using ***refertsTo*** relationship.

Drag and drop a ***Role*** object and connect with the ***Task***, using ***performs*** relationship.

##### Example figur:

<a href="images/help/Demo-TypesTasksRoles1.png" target="_blank">

<code style="color: blue"> <font size="2" weight="bold">
![Add Roles and Tasks](images/help/Demo-TypesTasksRoles1.png)</font>
</code>
Click on the picture to open in New Tab!</a>

</details>

---

### Add Properties ...

<details>  <summary>Add Properties ...</summary>

From the Palette (left pane) drag the ***Property*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<a href="images/help/Add-Property.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-Property.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

---

### Add Values ...

<details>  <summary>Add Values ...</summary>

From the Palette (left pane) drag the ***Value*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<a href="images/help/Add-Value.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-Value.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

---

### Add Fieldtype ...

<details>  <summary>Add Fieldtype ...</summary>

From the Palette (left pane) drag the ***Fieldtype*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<a href="images/help/Add-Fieldtype.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-Fieldtype.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

---

### Add InputPattern ...

<details>  <summary>Add InputPattern ...</summary>

From the Palette (left pane) drag the ***InputPattern*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<a href="images/help/Add-InputPattern.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-InputPattern.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

---

### Add ViewFormat ...

<details>  <summary>Add ViewFormat ...</summary>

From the Palette (left pane) drag the ***ViewFormat*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<a href="images/help/Add-ViewFormat.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-ViewFormat.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

---


### Add Metamodel Object ...

<details>  <summary>Add Metamodel Object ...</summary>

From the Palette (left pane) drag the ***Metamodel*** type and drop outside the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit ***description***.

Drag a relationship with type ***contains*** from til ***Metamodel*** object to the EntityType objects to be included in the new Metamodel.

<a href="images/help/Add-Metamodel.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-Metamodel.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

</details>

---

## Modify the Type-definition model ...

<details>  <summary>Modify the Type-definition model ...</summary>

If we want to change something in the Metamodel, we go back to the ***Type definition model***, do necessary changes, and then re-generate the metamodel.

If we i.e. want to add symbols and colors to the types, we go back to the  ***Type definition model*** to add view specifications, and re-generate the metamodel.

The view specifications are done by editing “*Object View*” of the “*EntityType*” objects and by editing “*Relationship View*” of the “*relationshipType*” relationships. 


<a href="images/help/Add-Metamodel.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-Metamodel.png)</font></code>
Click on the picture to open in New Tab!</a>

---
---

<details>  <summary>Modifying object and relationship views ...</summary>

How objects and relationships appear in the model when they are created is decided by the typeview definitions of the respective types. The appearance in the model can be overridden by defining object and relationship views. 

The objectview of the person “*Me*” looks like this:

![alt text](/images/posts/modelling/image_model007.png)

We see that we can modify the fillcolor of the object, the “*strokecolor*”, the “*icon*” as so on, and then give the object a specialized look that differs from the default appearance. 

We can do the same with relationships, and modify the color, the arrowheads, and so on, when we want to deviate from the default. 

</details>


</details>

---
---


<details>  <summary>Generate a new Metamodel ...</summary>

The first time you want to generate a metamodel from the type definition model, there are a few things you need to do:

Generate the metamodel content by right clicking the background and choose “***Generate Metamodel***”. 

Follow the dialog questions:

- “***Do you want to exclude system types***”? Click ***Ok***.
- “***Select Target Metamodel***”. Confirm the metamodel in the list.  

You should then get the message: “***Target metamodel has been successfully generated!***”.

Now it is time to verify your metamodel, to see if you are able to build the desired model based on the type definitions you just created.
(see next step)

</details>

---
---

<details>  <summary>Build a Use Case Model ...</summary>

To verify our new generated Metamodel, we will build a Use-case model, using the object types:   *person*, *house*, *apartment* and *car*, with relationship types "*owns*" and "*rents*" as shown below.

![Metamodel Person, Car, House, Apartment](/images/posts/modelling/image_model002.png)


<details>  <summary>Create a new model ...</summary>

You create the new model by right clicking the background and choose “*New Model*” in the popup menu. You will be asked to select a metamodel – select the one you just generated.

Then you will be asked for a model name and a modelview name. When the model has been created, open the new model by selecting the modelname in the pulldown dialog "*Model:*" ***in the top right corner of the Mimris window***. 

The object types in the metamodel you created should now appear in the Palette as object types in the left pane, and you should be ready to build a new model. 

The left pane contains the 4 Object-types defined in the Type-definition Model, plus the "*Generic*" and "*Container*" types, which are found in all metamodels used for modeling in Mimris. 

![Inital modelarea](/images/posts/modelling/image_model003.png)

</details>


<details>  <summary>Modelling ...</summary>

We build our model by first dragging and dropping first "*Person*" and then "*Car*". We click on each of them to edit their names:

![alt text](/images/posts/modelling/image_model004.png)

Then when we draw a relationship between the two objects, we are asked to choose a relationship type: 

![alt text](/images/posts/modelling/image_model005.png)

We choose ***owns*** in the modal dialog that pops up, clicks on ***Done*** and the relationship is created. (If you click on the “*x*” in the top right corner of the dialog, the operation is canceled.)

We continue modeling objects and relationships and may end up with a model like this:

![alt text](/images/posts/modelling/image_model006.png)


### Modifying object and relationship views

How objects and relationships is visualized in the model (icon, fillcolor, framecolor, etc.) is defined in the typeview definitions for each the type. The appearance can be overridden by defining objectviews and relationshipviews.


The objectview of the person “*Me*” looks like this:

![alt text](/images/posts/modelling/image_model007.png)

We see that we can modify the fillcolor of the object, the “*strokecolor*”, the “*icon*” as so on, and then give the object a specialized look that differs from the default appearance. 

We can do the same with relationships, and modify the color, the arrowheads, and so on, when we want to deviate from the default. 


</details>


![alt text](/images/posts/modelling/image_model0371.png)

</details>

---
---

<details>  <summary>Example Type-definition Model ...</summary>

### The example

In this chapter we will use an example metamodel as defined below. It has four different object types, "*Person*", "*House*", "*Apartment*" and "*Car*", with relationship types "*owns*" and "*rents*" as shown in the next model diagram.

There are four “*EntityType*” objects, each representing an object type in the intended new metamodel. Their names are the planned object type names.
There are six “*isRelatedTo*” relationships, each representing a relationship type in the new metamodel. Each “*isRelatedTo*” relationship is renamed to its planned relationship type names. These are the names you see in the diagram.

![alt text](/images/posts/modelling/image_model031.png)

This small type definition model is enough to generate a new metamodel, that will allow you to model people, houses, apartments and cars, and link them together with the appropriate relationships. 

</details>

---
<details><summary>More about The Core Metamodel ...</summary>

## AKM-CORE_META Metamodel

![image001](images/posts/CustomMeta/Picture1.png)

## Links

You can find more info following this link : 
<a href="/helpblog/002-BuildCustomMetamodels#Mimris%20Help" target="_blank">

<code style="color: blue"> <font size="2" weight="bold"> How to make Custom Metamodels...</font></code>

</span></a> 

</details>

---
---


You can find more info following this link : 
<a href="http://localhost:3000/helpblog/002-BuildCustomMetamodels#Mimris%20Help" target="_blank"><code style="color: blue"> <font size="2" weight="bold"> How to make Custom Metamodels...</font></code>
</span></a>

</details>