#### Build Type Definition Model (_TD)

To build the new Metamodel we have to define the **ObjectTypes** and **RelationshipsTypes** we want to use.
This is done by building a **Type-definition-model_TD** based on the **AKM-CORE_MM** metamodel. 

<details>  <summary>Create Initial Containers ...</summary>

Let us start with an empty model and the built-in ***AKM-Core_MM*** metamodel:

![Initial page with blank modelling area and AKM-Core_MM types in the Palette](images/posts/modelling/image_model001.png)

The left pane contains the object types in the initial metamodel, that the user can use to build a type definition model.

From the Palette (left pane) drag the ***Container*** type and drop it into the Modelling area.

Click on the name and edit ***name*** ( Name it  ***"Domain Types"*** i.e. ***"Bike Rental Types"***).

Right-Click the object to edit  ***description***.

</details>

---

<details>  <summary>Create EntityTypes ...</summary>

From the Palette (left pane) drag the ***EntityType*** and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description*** and ***proposedType***.

The attribute "proposedType" is used to give the Concept-/ Information-object a proposed TypeName.

Example:
![Create EntityType](images/help/Create-EntityType.png)

<a href="images/help/Create-EntityType.png" target="_blank" style="color: blue; text-decoration: underline;">Click here to view the picture bigger in a New Browser tab!</a>

</details>

---


<details>  <summary>Create Relationship types ...</summary>

- Click on the edge of an Object and drag the cursor to another object.

Example:
![image001](images/help/Add-Property.png)

<a href="images/help/Add-Property.png" target="_blank" style="color: blue; text-decoration: underline;" style="color: blue; text-decoration: underline;">
Click here to view the picture bigger in a New Browser tab ...</a><hr />


- Click on the name of the Relationship to edit.<hr />

- Right-Click on the relationship to open the properties panel, where you can edit Name, description etc.<hr />
</details>

---

<details>  <summary>Add Properties ...</summary>

From the Palette (left pane) drag the ***Property*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

Example:
![Create EntityType](images/help/Add-Property.png)

<a href="images/help/Add-Property.png" target="_blank" style="color: blue; text-decoration: underline;">
Click here to view the picture bigger in a New Browser tab!</a>

</details>

---

<details>  <summary>Add Datatype and Value ...</summary>

From the Palette (left pane) drag the ***Value*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

Create a relationship "isOf" from the Property to the Datatype

Create objects of type "Value" and name them according to Car-model alternatives. 

Create relationships "hasAllowed" or "isDefault" from Datatype object to Value objects

Example:
![Create EntityType](images/help/AddDatatypeAndValue.png)

<a href="images/help/AddDatatypeAndValue.png" target="_blank" style="color: blue; text-decoration: underline;">
Click here to view the picture bigger in a New Browser tab!</a>

</details>

---

<details>  <summary>Add Fieldtype ...</summary>

From the Palette (left pane) drag the ***Fieldtype*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.


<!-- ![Create EntityType](images/help/Add-Fieldtype.png)

<a href="images/help/Add-Fieldtype.png" target="_blank" style="color: blue; text-decoration: underline;"> -->

Click here to view the picture bigger in a New Browser tab!</a>

</details>

---

<details>  <summary>Add InputPattern ...</summary>

From the Palette (left pane) drag the ***InputPattern*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<!-- ![Create EntityType](images/help/Add-InputPattern.png)

<a href="images/help/Add-InputPattern.png" target="_blank" style="color: blue; text-decoration: underline;">
Click here to view the picture bigger in a New Browser tab!</a> -->

</details>

---

<details>  <summary>Add ViewFormat ...</summary>

From the Palette (left pane) drag the ***ViewFormat*** type and drop it into the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit  ***description***.

<!-- ![Create EntityType](images/help/Add-ViewFormat.png)

<a href="images/help/Add-ViewFormat.png" target="_blank" style="color: blue; text-decoration: underline;">
Click on the picture to open in New Tab!</a> -->

</details>

---

<details>  <summary>Add Metamodel Object ...</summary>

From the Palette (left pane) drag the ***Metamodel*** type and drop outside the Container ***"Domain" Types***. Click on the name and edit ***name***.
Right-Click the object to edit ***description***.

Drag a relationship with type ***contains*** from til ***Metamodel*** object to the EntityType objects to be included in the new Metamodel.

Example:
![Metamodel object example](images/help/AddMetamodelObject.png)

<a href="images/help/AddMetamodelObject.png" target="_blank" style="color: blue; text-decoration: underline;">
Click here to view the picture bigger in a New Browser tab!</a>

</details>

### Generate the Metamodel

Finally you can now generate a metamodel from this type-definition model.

Right-Click the Metamodel object and choose "Generate metamodel" and follow the dialog.
The Metamodel will now show up in the Target Metamodel palette to the right (blue pane)

