---
title: 'Building Metamodels and Models'
date: 'October 25, 2021'
excerpt: 'How to start a modelling project and building Models and Metamodels.'
cover_image: 'images/posts/modelling/image_model001.png'
---

## Define a new project

When AKMM is started the user meets a modelling window that looks like the following:

![alt text](/images/posts/modelling/image_model001.png)

The project is called “INIT-Start Project” which is ok if you want to play with the tool. But if your intention is to build models for a specific purpose, you should start by giving the project a name and description that is meaningful to you. This is done by right clicking the background and select “Edit Project”. 
It is also recommended to change the model name (“Edit Model”) to a more meaningful name.

When the project and model naming is done, it is recommended to save the model to your local filesystem, which is done by clicking on the “File” button above the modelling window. Then choose “Save Project (all) to File”.

The next time you start AKMM you should click on “File” and then choose “Import from file” and select one of the models you previously saved.

## Build a model

In this chapter we will use an example metamodel as defined below. It has four different object types, Person, House, Apartment and Car, with relationship types owns and rents as shown in the next model diagram.

![alt text](/images/posts/modelling/image_model002.png)

Based on this metamodel the modelling window looks as shown here:

![alt text](/images/posts/modelling/image_model003.png)

The left pane contains the four object types defined in the metamodel above plus “Generic” and “Container”, which are found in all metamodels used for modeling in AKMM. 

Now we build our model by first dragging and dropping first Person and then Car. We click on each of them to edit their names, and the result is:

![alt text](/images/posts/modelling/image_model004.png)

Then when we draw a relationship between the two objects, we are asked to choose a relationship type:

![alt text](/images/posts/modelling/image_model005.png)

We choose “owns” in the modal dialog that pops up, clicks on “Done” and the relationship is created. (If you click on the “x” in the top right corner of the dialog, the operation is canceled.)

We continue modeling objects and relationships and may end up with a model like this:

![alt text](/images/posts/modelling/image_model006.png)



### Modifying object and relationship views

How objects and relationships appear in the model when they are created is decided by the typeview definitions of the respective types. The appearance in the model can be overridden by defining object and relationship views. 

The objectview of the person “Me” looks like this:

![alt text](/images/posts/modelling/image_model007.png)

We see that we can modify the fillcolor of the object, the “strokecolor”, the “icon” as so on, and then give the object a specialized look that differs from the default appearance. 

We can do the same with relationships, and modify the color, the arrowheads, and so on, when we want to deviate from the default. 

3. Organizing model content using Modelviews

As explained in the Concepts chapter, the model content may be organized in several modelviews. The reason for doing so may vary. 
One reason may be to have views of different levels of detail, such as showing high level concepts in one modelview, and detailed views of the different concepts in separate modelviews. 
An example of this would be to focus on object and relationship types in one modelview and types with their properties in a second modelview. 

In another situation, if you have a large model covering separate areas such as business or technical, it would be natural to use different modelviews for the separate areas.

What to remember is, if the same object appears in two or more modelviews, you should do a “Copy” in the first modelview and do a “Paste View” in the second modelview. 
The same applies if you want the same object-relationship structure to appear in different modelviews. Do a “Copy” in the first modelview followed by a “Paste View” in the second. 

You create a modelview by choosing “New Modelview” in the popup menu on the background. And you can do “Edit Modelview” if you want to change the name or the description. 

If you have several modelviews they will be sorted by their names. If you want a specific sequence, you may let the first part of the name be a number. In that way you can control the sequence.

### Layout customization

In each modelview you can specify:
-	automatic layout
-	routing and curve
-	show cardinality on/off

There are a few built-in layout algorithms that you can choose to use if you want:
-	“Circular” layout
-	“Grid” layout
-	“Tree” layout
-	“ForceDirected” layout
-	“LayeredDigraph” layout

The default is “Manual” layout.
It is recommended that you test the different layout algorithms to see if any suits your need.

You can also define different kinds of “Routing”. The alternatives are:
-	Normal
-	Orthogonal
-	Avoids Nodes

“Normal” means straight lines, as shown in most examples in this document.

In addition to routing, you can define something called “Curve”, with allowed values:

-	None
-	Bezier
-	Jump Over
-	Jump Gap

Below you can see how a diagram changes appearance with different combination of the above, and we start with the defaults:

![alt text](/images/posts/modelling/image_model008.png)

Then with “Curve” set to “Bezier”:

![alt text](/images/posts/modelling/image_model009.png)

The next example has the following parameters:
-	“Routing” has been set to “Orthogonal”
-	“Curve” has been set to “Jump Over”

Note the two relationships that cross each other, how they are drawn in the diagram.

![alt text](/images/posts/modelling/image_model010.png)

The same as above, except that “Curve” has been set “Jump Gap”. Note the difference.

![alt text](/images/posts/modelling/image_model011.png)

The last thing to mention regarding modelviews is the ability to turn the visibility of cardinality on and off. You do this from the background menu: 

-	Toggle Cardinality On/Off

Below is an example of a product metamodel that you will meet later in this document. The “Toggle Cardinality” has been set to “On”:

![alt text](/images/posts/modelling/image_model011.png)

