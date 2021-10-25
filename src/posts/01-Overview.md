---
title: 'Overview'
date: 'Oct 18, 2021'
excerpt: 'The AKM Modeller (AKMM) is a generic platform for developing and utilizing knowledge models. It can be customized to support any subject area, if the area can be described by entities of different types and by relationships between those types.'
cover_image: 'images/posts/overview/image001.png'
---

## Introduction

The AKM Modeller (AKMM) is a generic platform for developing and utilizing knowledge models. 
It can be customized to support any subject area, if the area can be described by entities of different types and by relationships between those types. Both entities and relationships may be described by relevant properties and associated methods.

The user interface is implemented as a graphic modelling environment where each concept is visualized graphically to ease communication between users. The visualization of objects and relationships is customizable.

The Modeller differentiates between a meta-model (a modelling language) and a model. 
The meta-model defines the object types and relationship types - e.g. may Person and Car be your object types, 
while owns or rents may be your relevant relationship types between those object types. 
Based on such a meta-model you may build a model of actual persons and cars and connect the relationships between the persons and their cars.

## Concepts

The models in AKMM are organized in Projects, as shown in the figure below.

### The Project:

![alt text](/images/posts/overview/image001.png)

A Project may contain one or more Metamodels, and one or more Models. 
A Model is based on one Metamodel, but several Models may share the same Metamodel. 

To see the content of a model, Modelviews are used. A Modelview shows visualizations of objects and relationships.

### The Metamodel

A fundamental concept in AKMM is the Metamodel as illustrated in the figure below.

On the base level the Metamodel consists of Object types and Relationship types, and the
definition of how they play together.
A Relationship type points to two object types, the FROM object type and the TO object type,
which tells us that a relationship in AKMM has a direction, which normally is shown in the
model views with an arrow pointing to the TO object.
In addition, the Metamodel contains Object Typeviews, that define how the objects of a given
type are visualized, and Relationship Typeviews that define how relationships of a given type
are visualized.

![alt text](/images/posts/overview/image002.png)

### The Model

A Model contains objects and relationships. An Object refer to its type – the Object type, while a Relationship refers to its Relationship type, as illustrated below. 

![alt text](/images/posts/overview/image003.png)

### The Modelview

The model content is visualized in one or more Modelviews. Each Modelview contains Object
views and Relationship views as illustrated below. Each Object view refers to the Object it
represents, as do the Relationship views.
One Object may have several Object views, even in the same Modelview, while it is most
common to be visualized in different Modelviews. The same goes for Relationship views.

![alt text](/images/posts/overview/image004.png)
 
### About relationships

Relationship types have some attributes that are specific to relationships.
These are:

        -	Relationship kind
        -	Cardinality from
        -	Cardinality to
        -	Name from
        -	Name to

The meaning of Relationship kind is derived from UML (Unified Modeling Language), that differentiates between the following kinds of relationships:

        -	Association
        -	Generalization
        -	Composition
        -	Aggregation

In the figure below both isRelatedTo and Association are UML associations, in the sense that there are no constraints on the meaning of the relationships. 

 ![alt text](/images/posts/overview/image005.png)

*Generalization*, on the other hand, has a very specific meaning. It means that “D” in the model above inherits from “A”. So, if A has properties, D will have the same properties.

*Composition* describes a “has part” relationship, meaning that if an object of type “A” has several parts of type “B”, and the object of type “A” is deleted, then all the parts of type “B” will also be deleted. 

*Aggregation*, on the other hand, describes a “has member” relationships, meaning that if a parent object is deleted, the members will NOT be deleted. They exist independent of the parent. 

Relationship *cardinality* is also supported, i.e. the ability to define e.g. one-to one, one-to
many, many-to many relationships, or other combinations. The cardinality is specified on both
ends of the relationship type.
You may also give a *from-name* and a *to-name* to the relationship type.

 

