---
title: 'Build custom metamodels in Mimris'
date: 'Sept 18, 2023'
excerpt: 'Build or extend a Metamodel by making a Concept model and then generate the metamodel'
cover_image: '/images/posts/CustomMeta/Picture1.png'
---

# Mimris – Build custom metamodels using CORE_META Metamodel

## Type Definition Model

To build the new Metamodel we have to define the ObjectTypes and RelationshipsTypes we want to use.

This is done by building a Type-definition-model_TD


Out of the box Mimris contains one metamodel that is meant to use to develop custom metamodels. The name of the metamodel is AKM-CORE_META. 

AKM-CORE_META consists of types that allow users to define custom object and relationship types, with custom properties and methods.

When the new types are defined (modelled) the user can do “Generate Metamodel” to generate the customized metamodel. 

Based on the new metamodel user models can be created. 

Out of the box Mimris also includes some example metamodels and models. 


# The core metamodel

The core metamodel (CORE_META) that allows you to build your own metamodel is shown below. 


 ![image001](/images/posts/CustomMeta/Picture1.png)


In the center of this model we find “EntityType” which is used to define custom object types. And between EntityTypes you can draw relationships of type “relationshipType” to define custom relationship types. Ref the diagram below. 

 ![image002](/images/posts/CustomMeta/Picture2.png)
 
# Properties and Datatypes 

Both object types and relationship types may have properties as part of its definition. 
The diagram below shows that an EntityType may have properties and a that a “Property” is of  a “Datatype”. The default datatype is “string”.  

 ![image003](/images/posts/CustomMeta/Picture3.png)


One can specify default value and allowed values, and one can also specify how the corresponding field in a dialog box looks and behaves, using “ViewFormat”, “FieldType” and “InputPattern”.  

To define the properties of relationship types, an object type named “RelshipType” has been introduced. The name of RelshipType is the name of a relationship type that might have been defined elsewhere. 
The RelshipType has two relationships: the “from” and “to” relationships that each points to the from and to object types of the relationship type.


 ![image004](/images/posts/CustomMeta/Picture4.png)


In this way one can specify properties on relationship types as well as on object types. 

# Types of properties

There are two types of properties, those that are given as input by users, and those whose values are the result of a calculation via a property “Method”. Ref the model below.

 ![image005](/images/posts/CustomMeta/Picture5.png)


The model says that Property is an EntityType, and as such the Property may have a Method attached. The purpose of the Method is to calculate the property value.
The Method is of a “MethodType”, telling that there are alternative ways to do the calculation. 

# Method types

There are three built-in method types:
-	CalculateValue
-	AggregateValue
-	Traverse

The first two does a calculation on the current object and are used as property methods.

The third, “Traverse” is a method that is executed on an instance of a type (i.e. it is not a property method), and will, starting on an instance, traverse a structure of relationships and objects and perform actions on those.

 
# Typeviews

One important part of the metamodel is the ability to specify how objects and relationships are visualized in the models. 
This is done by specifying typeviews for both object and relationship types. 
An object typeview defines the default visualization of an object of the given type, while a relationship typeview does the same for a relationship. 

Typeviews for objects are specified using the dialog below.


 ![image006](/images/posts/CustomMeta/Picture6.png)


The two first fields are related to groups and specify the scale of member objects and the scale of the arrows of member relationships.
The other fields are related to objects as such.  
The viewkind is either “Object” or “Container”. Container means a group that has member objects inside.  
The template specifies what kind of graphic symbol to use when objects of the given type are shown. A commonly used template when viewkind is “Object”, is “textAndIcon” as the example below shows.


 ![image007](/images/posts/CustomMeta/Picture7.png)

Other examples are “textAndFigure” and “textAndGeometry” where textAndFigure allows the user to choose from a list of predefined geometrical figures. The example figure below is “Gear”:


 ![image008](/images/posts/CustomMeta/Picture8.png)


The textAndGeometry allows the user to specify a geometrical figure in a format as used in SVG symbols.
And there are several other templates to choose from.
	
The different color fields in the typeview applies to different parts of the symbol as can be seen in this variant of the Gear example:


 ![image009](/images/posts/CustomMeta/Picture9.png)


The fillcolor is the same, but fillcolor2 is different. Both strokecolors are different - the stokecolor is red and strokecolor2 is blue. And the textcolor is different. 

As mentioned typeviews define the default views of objects and relationships, but those can be overridden by locally defined Objectviews and Relationshipviews. 
 
How to define your own Metamodel

In the following we will go through the different steps on how to define your own metamodel. 

When we define a metamodel we start with only two types:
-	EntityType to define object types
-	relationshipType to define relationship types

The example we will use to illustrate this is a Product structure metamodel.
-	We start by defining three object types: Product, Assembly and Component. 
These are the three EnityTypes in column 1 in the diagram below. 
-	Then we add relationshipTypes between them as shown in column 2. 
-	We change the relationshipType names to consistsOf (column 3). 
-	We add colors and symbols to the EnityTypes (column 4). 
This is done by doing Edit Objectview.


 ![image0010](/images/posts/CustomMeta/Picture10.png)


Now is the time to generate a metamodel and test to see if it actually works.

Rightclick the background, choose “New Metamodel” and give your new metamodel a name. A message confirms that the metamodel has been created. 

Then from the background menu choose “Generate Metamodel”. 
Answer “OK” to the first question: “Do you want EXCLUDE system types?”.
Then choose the metamodel you just created and click “Done”. A message confirms that the metamodel has been successfully generated.

To test the metamodel create a new model based on the metamodel:
Rightclick the background, choose “New Model”, select your new metamodel, click Done and fill in the new model name when asked for, and do the same for Modelview.
Then switch to your new model and start testing. 

Build a test model e.g. like the following:


 ![image0011](/images/posts/CustomMeta/Picture11.png)

Make sure that your model covers all alternatives as the one above.

Add properties to your object types

When you have got your object and relationship types defined, you may want to add properties to your types. To do that go back to the model where the types are defined. 

Let us say that you want all the types to have the properties weight and cost, and we start by adding the properties to Component. 


 ![image0012](/images/posts/CustomMeta/Picture12.png)


Then do a new Generate Metamodel and choose the same metamodel as last time. 
Go back to your model and do Edit Properties on the Component objects. You will see that they have got two new properties, i.e. weight and cost.

You can do the same on Assembly and Product if you like, and they will all have those properties. 

# Property methods

But to demonstrate another capability of the AKM Modeller, we will now introduce Methods in the model.
Add an object of type Method as shown below:


 ![image0013](/images/posts/CustomMeta/Picture13.png)

Do Edit Object on the CalculateCost object and click on the methodtype field. You get the following dialog:


 ![image0014](/images/posts/CustomMeta/Picture14.png)


Choose CalculateValue and a new field (expression) will appear. Fill in the expression “weight*0.4”. See below. 


 ![image0015](/images/posts/CustomMeta/Picture15.png)


Close the dialog and do “Generate Metamodel” again, and then go to your test model.
Open the Component objects and enter weight values if you haven’t already done so. The cost field should now be calculated automatically. 


The next step is to add weight and cost to the Assembly and Product types. This means to go back to your metamodel and do the additions as shown below:


 ![image0016](/images/posts/CustomMeta/Picture16.png)


The property dialog for AggregateCost is shown below. The methodtype is now AggregateValue.  Note the four new fields (parameters) that appear when you choose AggregateValue.
The additional parameters are:
-	reltype that contains the name of the relationship type to follow. If empty – all relationships will be followed.
-	 reldir contains either in or out or left empty, and tells what relationship direction to follow. No value means that both directions will be followed.
-	objtype contains the name of the object type to check for. If not given the object type will not be checked.
-	expression contains expression to calculate on each object

 ![image0017](/images/posts/CustomMeta/Picture17.png)


The only difference between AggregateCost and AggregateWeight is the expression field that contains the name of the property to use in the calculation.

What remains now is the generation of the metamodel a last time and do the testing.

 
# Traversal methods

Traversal methods are methods that is executed (started) on objects.
You may for example, build a method that can be started on a Product, traverses the hierarchical structure the product consists of, and calls an action on each of the nodes it traverses. 

  
 ![image0018](/images/posts/CustomMeta/Picture18.png)

The dialog below shows an example that defines a method that starts on a Product object, follows the consistsOf relationships until it finds Assembly objects and will, if the condition (cost>20) is met, executes an action, that in this example is to do a Select. Ref the definition below. 

 ![image0019](/images/posts/CustomMeta/Picture19.png)

The relevant parameters in the dialog are:

- reltype that contains the name of the relationship type to follow. If empty – all relationships will be followed.
- reldir contains either in or out or left empty, and tells what relationship direction to follow. No value means that both directions will be followed.
- typecondition contains the name of the object type to check for. If not given the object type will not be checked.
- valuecondition contains the condition that needs to be met. 
- preaction specifies the action to perform on each object when the traversal is moving down the hierarchy
- postaction specifies the action to perform on each object when the traversal is moving up the hierarchy

The method is executed when you rightclick the Product object, choose “Execute Method” in the pulldown list that pops up, and then chooses “Select Assemblies”.
 
# Structuring and combining Metamodels
	
The Mimris Modeller allows you to build metamodels that are combinations of smaller (sub-) metamodels. Hence you can build a library of metamodels that you can combine in many different ways. 

You start with a project based on the AKM-CORE_META metamodel and you define one Modelview for each metamodel you plan to develop.

The example below has two small metamodels that can be combined to a larger one. They are modelled in separate modelviews. 

The first metamodel is a simplified version of our previous product metamodel (shown below). 
Note the new object of type Metamodel (PROD_META) that has contains relationships to the object types in the metamodel.


 ![image0020](/images/posts/CustomMeta/Picture20.png)

The second metamodel is a simple organization metamodel as shown below.
Also here note the object of type Metamodel (ORG_META) that has contains relationships to the object types in this metamodel. 


 ![image0021](/images/posts/CustomMeta/Picture21.png)

You don’t need to do “New Metamodel” to create the metamodels in these cases. You just click on the background and do “Generate Metamodel” and the correct choice is shown in the dialog. 

Now we want to combine the two metamodels into one. We do that by creating a new modelview that looks like the following: 

 ![image0022](/images/posts/CustomMeta/Picture22.png)


Then we click on the background, choose “Generate Metamodel” and get the choice “ORG-PROD_META”. Only the top metamodel is shown in the popup dialog. 
When we create a model based on this metamodel, the types we can choose when we model are the sum of the types in the two “sub”-metamodels. 
The “ORG_META” and “PROD_META” are registered as sub-metamodels in “ORG-PROD_META”. 

When we combine metamodels there is a need to add relationship types that relate object types in the two sub-metamodels. 
This can be done as shown below where OrganisationUnit and Product are related. It is important that the two objects are objectviews of the corresponding objects in the modelviews they are defined.  


 ![image0023](/images/posts/CustomMeta/Picture23.png)