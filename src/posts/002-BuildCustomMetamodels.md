---
title: 'Build custom metamodels in AKMM'
date: 'Sept 18, 2023'
excerpt: 'Describing how to build a new or add to existing Metamodel'
cover_image: 'images/posts/overview/image001.png'
---

# AKMM – Build custom metamodels

Out of the box AKMM contains one metamodel that is meant to use to develop custom metamodels. The name of the metamodel is AKM-CORE+_MM. 

AKM-CORE+_MM consists of types that allow users to define custom object and relationship types, with custom properties and methods.

When the new types are defined (modelled) the user can do “Generate Metamodel” to generate the customized metamodel. 

Based on the new metamodel user models can be created. 

Out of the box AKMM also includes some example metamodels and models. 


# The core metamodel

The core metamodel (AKM-CORE+_MM) that allows you to build your own metamodel is shown below. 


 ![image001](https://github.com/SnorreFossland/akmmclient/assets/31763773/ec40dd6f-0ddf-4c6e-981a-def7e9be73f1)


In the center of this model we find “EntityType” which is used to define custom object types. And between EntityTypes you can draw relationships of type “relationshipType” to define custom relationship types. Ref the diagram below. 

![image002](https://github.com/SnorreFossland/akmmclient/assets/31763773/029bfb9d-9b6c-46db-91a5-8744cfea6dbe)

 
# Properties and Datatypes 

Both object types and relationship types may have properties as part of its definition. 
The diagram below shows that an EntityType may have properties and a that a “Property” is of  a “Datatype”. The default datatype is “string”.  

![image003](https://github.com/SnorreFossland/akmmclient/assets/31763773/683991b0-1db4-4fe6-99b8-c9a28f2df513)


One can specify default value and allowed values, and one can also specify how the corresponding field in a dialog box looks and behaves, using “ViewFormat”, “FieldType” and “InputPattern”.  

To define the properties of relationship types, an object type named “RelshipType” has been introduced. The name of RelshipType is the name of a relationship type that might have been defined elsewhere. 
The RelshipType has two relationships: the “from” and “to” relationships that each points to the from and to object types of the relationship type.


![image004.png](https://github.com/SnorreFossland/akmmclient/assets/31763773/b8e9e5d6-a895-455e-b014-6ff914ba2f28)

In this way one can specify properties on relationship types as well as on object types. 

# Types of properties

There are two types of properties, those that are given as input by users, and those whose values are the result of a calculation via a property “Method”. Ref the model below.

![image005](https://github.com/SnorreFossland/akmmclient/assets/31763773/beffe28d-a4a8-4cc4-9c4d-fc11848e4ef8)




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


 ![image006](https://github.com/SnorreFossland/akmmclient/assets/31763773/2ee18a34-c1e1-48b1-bf78-5a509b57fe19)


The two first fields are related to groups and specify the scale of member objects and the scale of the arrows of member relationships.
The other fields are related to objects as such.  
The viewkind is either “Object” or “Container”. Container means a group that has member objects inside.  
The template specifies what kind of graphic symbol to use when objects of the given type are shown. A commonly used template when viewkind is “Object”, is “textAndIcon” as the example below shows.


![image007](https://github.com/SnorreFossland/akmmclient/assets/31763773/92775c69-8913-43df-a6c5-656dcac55521)

Other examples are “textAndFigure” and “textAndGeometry” where textAndFigure allows the user to choose from a list of predefined geometrical figures. The example figure below is “Gear”:


![image008](https://github.com/SnorreFossland/akmmclient/assets/31763773/36e92e22-32f1-45a5-960a-51a834ca9163)


The textAndGeometry allows the user to specify a geometrical figure in a format as used in SVG symbols.
And there are several other templates to choose from.
	
The different color fields in the typeview applies to different parts of the symbol as can be seen in this variant of the Gear example:


 ![image009](https://github.com/SnorreFossland/akmmclient/assets/31763773/aad287f9-5028-4051-88b9-68834d4e7605)


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


 ![image010](https://github.com/SnorreFossland/akmmclient/assets/31763773/d428d6c1-a62b-4cba-9c05-ccf45ef552dd)


Now is the time to generate a metamodel and test to see if it actually works.

Rightclick the background, choose “New Metamodel” and give your new metamodel a name. A message confirms that the metamodel has been created. 

Then from the background menu choose “Generate Metamodel”. 
Answer “OK” to the first question: “Do you want EXCLUDE system types?”.
Then choose the metamodel you just created and click “Done”. A message confirms that the metamodel has been successfully generated.

To test the metamodel create a new model based on the metamodel:
Rightclick the background, choose “New Model”, select your new metamodel, click Done and fill in the new model name when asked for, and do the same for Modelview.
Then switch to your new model and start testing. 

Build a test model e.g. like the following:


 <img width="940" alt="image011" src="https://github.com/SnorreFossland/akmmclient/assets/31763773/6c82892f-26a2-43f7-9dc1-9f40e036183c">

Make sure that your model covers all alternatives as the one above.

Add properties to your object types

When you have got your object and relationship types defined, you may want to add properties to your types. To do that go back to the model where the types are defined. 

Let us say that you want all the types to have the properties weight and cost, and we start by adding the properties to Component. 


 ![image012](https://github.com/SnorreFossland/akmmclient/assets/31763773/684f980b-8406-4308-993c-2f2adbfae1ac)


Then do a new Generate Metamodel and choose the same metamodel as last time. 
Go back to your model and do Edit Properties on the Component objects. You will see that they have got two new properties, i.e. weight and cost.

You can do the same on Assembly and Product if you like, and they will all have those properties. 

# Property methods

But to demonstrate another capability of the AKM Modeller, we will now introduce Methods in the model.
Add an object of type Method as shown below:


 ![image013](https://github.com/SnorreFossland/akmmclient/assets/31763773/32378f02-51dc-472d-98c3-d8cc9e989c63)


Do Edit Object on the CalculateCost object and click on the methodtype field. You get the following dialog:


 ![image014](https://github.com/SnorreFossland/akmmclient/assets/31763773/6cbedc93-bcdd-41d0-8907-6f7c7086fb72)


Choose CalculateValue and a new field (expression) will appear. Fill in the expression “weight*0.4”. See below. 


 ![image015](https://github.com/SnorreFossland/akmmclient/assets/31763773/15c458d9-fcdc-43d2-9ea7-e66697ecb5c1)


Close the dialog and do “Generate Metamodel” again, and then go to your test model.
Open the Component objects and enter weight values if you haven’t already done so. The cost field should now be calculated automatically. 


The next step is to add weight and cost to the Assembly and Product types. This means to go back to your metamodel and do the additions as shown below:


 ![image016](https://github.com/SnorreFossland/akmmclient/assets/31763773/57e1a6fb-1962-4390-a447-e7e1b2af73c7)


The property dialog for AggregateCost is shown below. The methodtype is now AggregateValue.  Note the four new fields (parameters) that appear when you choose AggregateValue.
The additional parameters are:
-	reltype that contains the name of the relationship type to follow. If empty – all relationships will be followed.
-	 reldir contains either in or out or left empty, and tells what relationship direction to follow. No value means that both directions will be followed.
-	objtype contains the name of the object type to check for. If not given the object type will not be checked.
-	expression contains expression to calculate on each object

 ![image017](https://github.com/SnorreFossland/akmmclient/assets/31763773/636cf19b-8de2-4c39-9757-421c8cb6974e)


The only difference between AggregateCost and AggregateWeight is the expression field that contains the name of the property to use in the calculation.

What remains now is the generation of the metamodel a last time and do the testing.

 
# Traversal methods

Traversal methods are methods that is executed (started) on objects.
You may for example, build a method that can be started on a Product, traverses the hierarchical structure the product consists of, and calls an action on each of the nodes it traverses. 

 

The dialog below shows an example that defines a method that starts on a Product object, follows the consistsOf relationships until it finds Assembly objects and will, if the condition (cost>20) is met, executes an action, that in this example is to do a Select. Ref the definition below. 

 
![image018](https://github.com/SnorreFossland/akmmclient/assets/31763773/4ac12ac4-99d6-4f72-a8b6-a028a0e0d5f9)

The relevant parameters in the dialog are:
-	reltype that contains the name of the relationship type to follow. If empty – all relationships will be followed.
-	 reldir contains either in or out or left empty, and tells what relationship direction to follow. No value means that both directions will be followed.
-	typecondition contains the name of the object type to check for. If not given the object type will not be checked.
-	valuecondition contains the condition that needs to be met. 
-	preaction specifies the action to perform on each object when the traversal is moving down the hierarchy
-	postaction specifies the action to perform on each object when the traversal is moving up the hierarchy

The method is executed when you rightclick the Product object, choose “Execute Method” in the pulldown list that pops up, and then chooses “Select Assemblies”.
 
# Structuring and combining Metamodels
	
The AKM Modeller allows you to build metamodels that are combinations of smaller (sub-) metamodels. Hence you can build a library of metamodels that you can combine in many different ways. 

You start with a project based on the AKM-CORE+_MM metamodel and you define one Modelview for each metamodel you plan to develop.

The example below has two small metamodels that can be combined to a larger one. They are modelled in separate modelviews. 

The first metamodel is a simplified version of our previous product metamodel (shown below). 
Note the new object of type Metamodel (PROD_MM) that has contains relationships to the object types in the metamodel.


 ![image019](https://github.com/SnorreFossland/akmmclient/assets/31763773/2726fcdf-578c-47b1-97eb-b60678bc842d)


The second metamodel is a simple organization metamodel as shown below.
Also here note the object of type Metamodel (ORG_MM) that has contains relationships to the object types in this metamodel. 




You don’t need to do “New Metamodel” to create the metamodels in these cases. You just click on the background and do “Generate Metamodel” and the correct choice is shown in the dialog. 

Now we want to combine the two metamodels into one. We do that by creating a new modelview that looks like the following: 


![image020](https://github.com/SnorreFossland/akmmclient/assets/31763773/402e62e9-e3f5-4b98-ae15-974e8692af66)


Then we click on the background, choose “Generate Metamodel” and get the choice “ORG-PROD_MM”. Only the top metamodel is shown in the popup dialog. 
When we create a model based on this metamodel, the types we can choose when we model are the sum of the types in the two “sub”-metamodels. 
The “ORG_MM” and “PROD_MM” are registered as sub-metamodels in “ORG-PROD_MM”. 

When we combine metamodels there is a need to add relationship types that relate object types in the two sub-metamodels. 
This can be done as shown below where OrganisationUnit and Product are related. It is important that the two objects are objectviews of the corresponding objects in the modelviews they are defined.  


![image021](https://github.com/SnorreFossland/akmmclient/assets/31763773/ff58673f-47ca-4673-9f56-a227aa5bc539)

![image022](https://github.com/SnorreFossland/akmmclient/assets/31763773/1b2aef67-2c6b-4f0b-b4ee-3bf67143e7a0)

![image023](https://github.com/SnorreFossland/akmmclient/assets/31763773/02eef7ab-b9f1-4b0e-a806-8a79ab6f3ca2)
