---
title: 'Building Models'
date: 'November 3, 2021'
excerpt: 'How to build a Model.'
cover_image: 'images/posts/modelling/image_model006.png'
---

## Build a model

In this chapter we will use an example metamodel as defined below. It has four different object types, "*Person*", "*House*", "*Apartment*" and "*Car*", with relationship types "*owns*" and "*rents*" as shown in the next model diagram.

![alt text](/images/posts/modelling/image_model002.png)

Based on this metamodel the modelling window looks as shown here:

![alt text](/images/posts/modelling/image_model003.png)

The left pane contains the four object types defined in the metamodel above plus "*Generic*" and "*Container*", which are found in all metamodels used for modeling in AKMM. 

Now we build our model by first dragging and dropping first "*Person*" and then "*Car*". We click on each of them to edit their names, and the result is:

![alt text](/images/posts/modelling/image_model004.png)

Then when we draw a relationship between the two objects, we are asked to choose a relationship type:

![alt text](/images/posts/modelling/image_model005.png)

We choose "*owns*" in the modal dialog that pops up, clicks on "*Done*” and the relationship is created. (If you click on the “*x*” in the top right corner of the dialog, the operation is canceled.)

We continue modeling objects and relationships and may end up with a model like this:

![alt text](/images/posts/modelling/image_model006.png)

### Modifying object and relationship views

How objects and relationships appear in the model when they are created is decided by the typeview definitions of the respective types. The appearance in the model can be overridden by defining object and relationship views. 

The objectview of the person “*Me*” looks like this:

![alt text](/images/posts/modelling/image_model007.png)

We see that we can modify the fillcolor of the object, the “*strokecolor*”, the “*icon*” as so on, and then give the object a specialized look that differs from the default appearance. 

We can do the same with relationships, and modify the color, the arrowheads, and so on, when we want to deviate from the default. 

