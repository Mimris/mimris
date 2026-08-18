
Create Concept Model from Scratch (Overall steps)

From the Palette (left pane) drag the **Information** and drop it into the Container **Types**. Give the object a **name**.
Right-Click the object to edit  description and **proposedType**.

The attribute "proposedType" is used to give the Concept-/ Information-object a proposed TypeName.
The TypeName will replace the Typename of this object.

<a href="images/help/Edit-proposedType-2023-10-05.png" target="_blank"><code style="color: blue"> <font size="2" weight="bold">![image001](images/help/Edit-ProposedType-2023-10-05.png)</font></code>
</span>Click on the picture to open in New Tab!</a>



Add Information Object

-1 Add a Information object
 -2 Connect the Information to Property with the "includes" relationship.
 -3 Open the Information object and add a proposedType

![alt text](/images/posts/modelling/image_model001.png)


Create Relationship between Concepts

From the Palette (left pane) drag the **Information** and drop it into the Container **Types**. Give the object a **name**.
Right-Click the object to edit  description and **proposedType**.

The attribute "proposedType" is used to give the Concept-/ Information-object a proposed TypeName.
The TypeName will replace the Typename of this object.

<a href="images/help/Edit-proposedType-2023-10-05.png" target="_blank"><code style="color: blue"> <font size="2" weight="bold">![image001](images/help/Edit-ProposedType-2023-10-05.png)</font></code>
</span>Click on the picture to open in New Tab!</a>

Connect the Task

Connect two EntityType objects.

  -Point the cursor to the edge of the object (a curved arrow appears). Click and hold while dragging over and drop on an other object. Select Relationship type **relationshipType**.

  -Then edit the relationship name to give it a name.

Create Tasks working on the Information

From the Palette (left pane) drag **Role** Type and drop it into the "Task container". Give the task a name (should contain a verb) and description.

Drag the relationship **worksOn** from **Task** to **EntityType.**

<a href="images/help/-2023-10-05.png" target="_blank"><code style="color: blue"> <font size="2" weight="bold">![image001](images/help/-2023-10-05.png)</font></code>
</span>Click on the picture to open in New Tab!</a>

Role

From the Palette (left pane) drag **Role** Type and drop it into the "Role/Task container". Give the task a name and description.

(Role here is more a "process role" than an "organisational role"
Its normally not a Position)

Drag the relationship **worksOn** from **Task** to **EntityType.**

<details><summary>More about Role</summary>

(from ChatGPT)

In general, an organizational role refers to a specific position or job within an organization, while a process role refers to a specific role or responsibility within a business process.

An organizational role is typically defined by the organization's structure and hierarchy, and is often associated with specific responsibilities, authority, and accountability. Examples of organizational roles include manager, director, and team lead.

A process role, on the other hand, is typically defined by the specific business process being executed, and is often associated with specific tasks, activities, and decision-making responsibilities. Examples of process roles include approver, reviewer, and executor.

In summary, while both organizational roles and process roles are important in defining the structure and responsibilities within an organization, they differ in terms of their scope and focus.
</details>

Create the Metamodel Object

<details onclick="toggleDetails(1)">
  <summary>Build the Concept model for the Metamodel</summary>

## Build the metamodel

  Let us start with the built-in metamodel:

  ![alt text](/images/posts/modelling/image_model001.png)

  The left pane contains the object types in the initial metamodel, that the user can use to build a type definition model.

</details>

<details onclick="toggleDetails(2)">
  <summary>Model the type definitions</summary>

### Model the type definitions

</details>
