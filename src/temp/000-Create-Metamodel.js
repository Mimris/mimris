const Help = `
  
### CORE Metamodelling:

  To make a new Metamodel, we need to define the Object- and Relationship types we want to be in the Metamodel.
  
  In order to create these types, we use the EntityType and RelshipType from the

##### AKM-CORE_MM Metamodel
  
  ![image001](images/posts/CustomMeta/Picture1.png)
  
  More info :
  <a href="http://localhost:3000/helpblog/002-BuildCustomMetamodels#AKMM%20Help" target="_blank"><code style="color: blue"> <font size="2" weight="bold"> How to make Custom Metamodels...</font></code>
  </span></a> <hr />

Example model ...

### The example

In this chapter we will use an example metamodel as defined below. It has four different object types, "*Person*", "*House*", "*Apartment*" and "*Car*", with relationship types "*owns*" and "*rents*" as shown in the next model diagram.

There are four “*EntityType*” objects, each representing an object type in the intended new metamodel. Their names are the planned object type names.
There are six “*isRelatedTo*” relationships, each representing a relationship type in the new metamodel. Each “*isRelatedTo*” relationship is renamed to its planned relationship type names. These are the names you see in the diagram.

![alt text](/images/posts/modelling/image_model031.png)

This small type definition model is enough to generate a new metamodel, that will allow you to model people, houses, apartments and cars, and link them together with the appropriate relationships.


Metamodelling Tasks

Build a Type-definition model ...

## Build Type Definition Models (TD)

To build the new Metamodel we have to define the **ObjectTypes** and **RelationshipsTypes** we want to use.
This is done by building a **Type-definition-model_TD** based on the **AKM-CORE_MM** metamodel.

<details>  <summary>Create Initial Containers ...</summary>

Let us start with an empty model and the built-in ***AKM-Core_MM*** metamodel:

![Initial page with blank modelling area and AKM-Core_MM types in the Palette](/images/posts/modelling/image_model001.png)

The left pane contains the object types in the initial metamodel, that the user can use to build a type definition model.

From the Palette (left pane) drag the ***Container*** type and drop it into the Modelling area.

Click on the name and edit ***name*** ( Name it  ***"Domain Types"*** i.e. ***"Bikerental Types"***).

Right-Click the object to edit  ***description***.

<a href="images/help/Create-EntityType.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">
![Create EntityType](images/help/Create-EntityType.png)</font>
</code>
</span>Click on the picture to open in New Tab!</a>
</details>

---

<details>  <summary>Create EntityTypes ...</summary>

From the Palette (left pane) drag the ***EntityType*** and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description*** and ***proposedType***.

The attribute "proposedType" is used to give the Concept-/ Information-object a proposed TypeName.

<a href="images/help/Create-EntityType.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">
![Create EntityType](images/help/Create-EntityType.png)</font>
</code>
</span>Click on the picture to open in New Tab!</a>
</details>

---

<details>  <summary>Create Relationship types ...</summary>

1. 1 - Click on the edge of an Object and drag the cursor to another object.
<a href="images/help/Add-Property-2023-10-05.png" target="_blank"><code style="color: blue"> <font size="2" weight="bold">![image001](images/help/Add-Property-2023-10-05.png)</font></code>
</span>Click on the picture to open in New Tab...</a><hr />

1. 2 - Click on the name of the Relationship to edit.<hr />

1. 3 - Right-Click on the relationship to open the properties panel, where you can edit Name, description etc.<hr />

</details>

---

<details>  <summary>Add Properties ...</summary>

From the Palette (left pane) drag the ***Property*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<a href="images/help/Add-Property.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-Property.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

---

<details>  <summary>Add Values ...</summary>

From the Palette (left pane) drag the ***Value*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<a href="images/help/Add-Value.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-Value.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

---

<details>  <summary>Add Fieldtype ...</summary>

From the Palette (left pane) drag the ***Fieldtype*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<a href="images/help/Add-Fieldtype.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-Fieldtype.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

---

<details>  <summary>Add InputPattern ...</summary>

From the Palette (left pane) drag the ***InputPattern*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<a href="images/help/Add-InputPattern.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-InputPattern.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

---

<details>  <summary>Add ViewFormat ...</summary>

From the Palette (left pane) drag the ***ViewFormat*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<a href="images/help/Add-ViewFormat.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-ViewFormat.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

---

<details>  <summary>Add Metamodel Object ...</summary>

From the Palette (left pane) drag the ***Metamodel*** type and drop outside the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit ***description***.

Drag a relationship with type ***contains*** from til ***Metamodel*** object to the EntityType objects to be included in the new Metamodel.

<a href="images/help/Add-Metamodel.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-Metamodel.png)</font></code>
Click on the picture to open in New Tab!</a>

</details>

Modify the Type-definition Model --

If something is wrong, or you want to change anything, go back to the type definition model, do the necessary changes, and generate the metamodel again.

If you want to add symbols and colors to your types, go back to your type definition model to add view specifications, and generate the metamodel again.

The view specifications are done by editing “*Object View*” of the “*EntityType*” objects and by editing “*Relationship View*” of the “*relationshipType*” relationships.
The “*Object View*” and “*Relationship View*” definitions are used to define the corresponding “*Object Typeview*” and “*Relationship Typeview*” definitions in the generated metamodel.

<a href="images/help/Add-Metamodel.png" target="_blank">
<code style="color: blue"> <font size="2" weight="bold">![Create EntityType](images/help/Add-Metamodel.png)</font></code>
Click on the picture to open in New Tab!</a>

Generate a new Metamodel ...

### Generate the new Metamodel

The first time you want to generate a metamodel from the type definition model, there are a few things you need to do:

Generate the metamodel content by right clicking the background and choose “***Generate Metamodel***”. Follow the dialog questions:

- “***Do you want to exclude system types***”? Click “*Ok*”.
- “***Select Target Metamodel***”. Confirm the metamodel in the list.  

You should then get the message: “***Target metamodel has been successfully generated!***”.

Now it is time to verify your metamodel, to see if you are able to build the desired model based on the type definitions you just created.
(see next step)


Build a Use-case Model

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

More about The Core Metamodel ...

### AKM-CORE_MM Metamodel

![image001](images/posts/CustomMeta/Picture1.png)

### Links

You can find more info following this link :
<a href="/helpblog/002-BuildCustomMetamodels#AKMM%20Help" target="_blank">

<code style="color: blue"> <font size="2" weight="bold"> How to make Custom Metamodels...</font></code>

</span></a>

</details>
`;

export default Help;
