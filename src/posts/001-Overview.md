---
title: 'Overview'
date: 'Oct 18, 2021'
excerpt: 'AKM Modeller is a free, open-source, cross-platform modeling tool. It is based on the AKM Modeller Core, which includes model and metamodel definitions, and a graphical user interface. It is available for Windows, macOS and Linux.'
cover_image: 'images/posts/overview/image001.png'
---

# Introduction

The AKM Modeller (AKMM) is a generic platform for developing and utilizing knowledge models. 
It can be customized to support any subject area, if the area can be described by entities of different types and by relationships between those types. Both entities and relationships may be described by relevant properties and associated methods.

The user interface is implemented as a graphic modelling environment where each concept is visualized graphically to ease communication between users. The visualization of objects and relationships is customizable.

The Modeller differentiates between a meta-model (a modelling language) and a model. 
The meta-model defines the object types and relationship types - e.g. may <b>Person</b> and <b>Car</b> be your object types, 
while <b>owns</b> or <b>rents</b> may be your relevant relationship types between those object types. 
Based on such a meta-model you may build a model of actual persons and cars and connect the relationships between the persons and their cars.

table of contents

[The Project](#the-project)

[The Metamodel](#the-metamodel)

[The Model](#the-model)

[The Modelview](#the-modelview)

[About relationships](#about-relationships)


# Concepts

The models in AKMM are organized in Projects, as shown in the figure below.

## The Project

![alt text](/images/posts/overview/image001.png)

A <b>Project</b> may contain one or more <b>Metamodels</b>, and one or more <b>Models</b>. 
A Model is based on one Metamodel, but several Models may share the same Metamodel. 

To see the content of a model, <b>Modelviews</b> are used. A Modelview shows visualizations of objects and relationships.

---
 - [-back to the top-](#introduction)
---

## The Metamodel

A fundamental concept in AKMM is the Metamodel as illustrated in the figure below.

On the base level the Metamodel consists of <b>Object types</b> and <b>Relationship types</b>, 
and the definition of how they play together. <br>
A Relationship type points to two object types, 
the FROM object type and the TO object type, <br>
which tells us that a relationship in AKMM has a direction, <br> 
which normally is shown in the model views with an arrow pointing to the TO object. <br>
In addition, 
the Metamodel contains Object Typeviews, <br>
that define how the objects of a given type are visualized, <br>
and Relationship Typeviews <br>
that define how relationships of a given type are visualized.

![alt text](/images/posts/overview/image002.png)

---
 - [-back to the top-](#introduction)
---


## The Model

A Model contains objects and relationships. An Object refer to its type – the Object type, while a Relationship refers to its Relationship type, as illustrated below. 

![alt text](/images/posts/overview/image003.png)

---
 - [-back to the top-](#introduction)
---

## The Modelview

The model content is visualized in one or more Modelviews. Each Modelview contains Object
views and Relationship views as illustrated below. Each Object view refers to the Object it
represents, as do the Relationship views.
One Object may have several Object views, even in the same Modelview, while it is most
common to be visualized in different Modelviews. The same goes for Relationship views.

![alt text](/images/posts/overview/image004.png)

---
 - [-back to the top-](#introduction)
---
 
## About relationships

Relationship types have some attributes that are specific to relationships.
These are:

        -	Cardinality from
        -	Cardinality to
        -	Name from
        -	Name to

This implies that relationship *cardinality* is supported, i.e. the ability to define e.g. one-to-one, one-to-many, many-to-many relationships, or other combinations. The cardinality is specified on both ends of the relationship type.

You may also give a *from-name* and a *to-name* to the relationship type.

---
 - [-back to the top-](#introduction)
---

