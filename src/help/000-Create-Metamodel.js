const Help = `
#### MIMRIS Metamodeling Guide

##### Creating a Type Definition Model

A Type Definition Model (TD) defines your custom types using the **AKM-CORE_MM** metamodel. Follow these steps to create your metamodel:

<details>
  <summary><strong>Step 1: Create Initial Containers</strong></summary>

  1. Start with a blank modeling canvas showing the AKM-CORE_MM palette
  
     ![Initial modeling canvas](images/posts/modelling/image_model001.png)
  
  2. Drag a **Container** from the palette into the modeling area
  3. Click the name and change it to **"Domain Types"** (e.g., "Bikerental Types")
  4. Right-click the container to add a description
  
</details>

<details>
  <summary><strong>Step 2: Create EntityTypes</strong></summary>

  1. Drag an **EntityType** from the palette into your "Domain Types" container
  2. Name the EntityType (e.g., "Person", "House", etc.)
  3. Right-click to edit:
     * **description**: Explain the purpose of this type
     * **proposedType**: Set the name this concept will have in your metamodel
  
  ![Create EntityType](images/help/Create-EntityType.png)
  
  4. Repeat for all object types needed in your metamodel
</details>

<details>
  <summary><strong>Step 3: Create Relationship Types</strong></summary>

  1. Click on the edge of an object and drag to another object
  2. Click on the relationship name to edit it (e.g., "owns", "rents")
  3. Right-click the relationship to edit properties:
     * **name**: The relationship type name
     * **description**: Purpose of this relationship
     * **cardinality**: Any constraints on the relationship
  
  ![Create relationship](images/help/Add-Property-2023-10-05.png)
</details>

<details>
  <summary><strong>Step 4: Add Properties</strong></summary>

  1. Drag a **Property** type from the palette into the "Domain Types" container
  2. Name your property (e.g., "age", "address")
  3. Right-click to add description and data type information
  
  ![Add Property](images/help/Add-Property.png)
  
  4. Connect properties to your EntityTypes using relationships
</details>

<details>
  <summary><strong>Step 5: Add Values</strong></summary>

  1. Drag a **Value** type from the palette into the "Domain Types" container
  2. Name your value (e.g., "price", "square footage")
  3. Configure its data type and constraints
  
  ![Add Value](images/help/Add-Value.png)
</details>

<details>
  <summary><strong>Step 6: Add Advanced Type Elements</strong></summary>

  For more advanced metamodels, you can also define:
  
  * **Fieldtype**: Data type specifications
  * **InputPattern**: Validation rules for data entry
  * **ViewFormat**: Formatting rules for displaying values
  * **Metamodel**: Container that defines your complete metamodel
  
  ![Add Metamodel](images/help/Add-Metamodel.png)
  
  > Connect all EntityTypes to your Metamodel object using **contains** relationships
</details>

##### Generating Your New Metamodel

Once your type definition model is complete:

\`\`\`
1. Right-click the background and select 
    **"Generate Metamodel"**
2. When asked "Do you want to exclude 
  system types?", click **"Ok"**
3. Select your target metamodel from the 
  list
4. You should see: "Target metamodel has 
  been successfully generated!"
\`\`\`
##### Building Models with Your Custom Metamodel

Test your new metamodel by building a model:

Create objects by dragging types from your new palette

Name each object (e.g., "John", "My House")

Create relationships between objects by dragging from one to another

Select the appropriate relationship type from the dialog

![Example model](images/posts/modelling/image_model006.png)

##### Customizing Visual Appearance

Enhance your models' visual clarity by customizing how objects and relationships appear:

1. Right-click an object or relationship and select its view properties
2. Modify:
   * **fillColor**: Background color of objects
   * **strokeColor**: Border color
   * **icon**: Visual representation
   * **lineStyle**: For relationships (solid, dashed, etc.)
   * **arrowheads**: Relationship endpoint style

![Object view customization](images/posts/modelling/image_model007.png)
`;

export default Help;
