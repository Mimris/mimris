---
title: 'Building a Metamodel'
date: 'October 18, 2021'
excerpt: 'Metamodels are modeled by using EntityType to represent object types and a relationship of type isRelatedTo to represent relationship types. 
Both are named or renamed to the actual type names the user wants.'
cover_image: 'images/posts/overview/image006.png'
---

## Metamodels

Metamodels are modeled by using EntityType to represent object types and a relationship of type isRelatedTo to represent relationship types. 
Both are named or renamed to the actual type names the user wants.
 
### Defining Object types

To define an object type starts with giving the type a meaningful name – a name that tells users what exactly the type represents. It is good practice to add a description to clarify the purpose. 
The next step would be to add Properties to the type definition, as shown below. 

![alt text](/images/posts/overview/image006.png)
 
In this case the object type “My Type” is specified to have two properties, “Prop A” and “Prop B”. With no further specification the two properties will be of datatype “string”.

### Defining Relationship types

Relationship types are defined by drawing a relationship of type “isRelatedTo” between object types as shown below. 

![alt text](/images/posts/overview/image007.png)

Then edit the name of relationship to give it the name of the relationship type you want. 

![alt text](/images/posts/overview/image008.png)
 
### Property modelling

AKMM offers property modelling to a much more detailed level than just saying that the property is a “string” property. 
This is shown in the next figure. In this figure properties have been modeled inside a container without drawing a relationship. This possibility has been added to simplify the modelling in case of many properties.

 ![alt text](/images/posts/overview/image009.png)

The figure shows “My Type” with the two properties as defined in an example above. But in addition the type has now 4 other properties, “P1”, “P2”, “P3” and “Pn”. Unlike the first two properties, these 4 properties have been specified to a greater detail. 


        “P1” is a date property.
        “P2” is a number property with a pattern specified 
             that limits the allowed values
        “P3” has the same definition as “P2”
        “Pn” is an Enum with 3 allowed values, 
             “V1”, “V2”, “V3”, where “V2” is the default value. 


### Property and type methods

AKMM supports two kinds of methods – property and type methods. This is illustrated in the figure below. 
In the figure two methods have been defined:
-	“calc A” is a property method that calculates the value of “Prop A” based on a formula or expression that typically contains values of other properties in the same object or in related objects, or a combination of the two
-	“Mtd” is a type method, i.e. a method that is meant to be executed on an instance of the actual type.  One example of such a method is a method that traverses a hierarchy and executes an action on each node in the hierarchy

![alt text](/images/posts/overview/image010.png)
 

Methods are of a type – a method type. Currently there are three method types defined:

        -	calculateValue
        -	aggregateValue
        -	traverse

The first two are valid for property methods, while the last is valid for type methods. Documentation of these method types and examples of use are found in a later chapter in this document. 

 
### Visualization of objects and relationships

About Object typeviews

It is the object typeview that specifies what an instance of a given type will look like when it is first created in a model. 

The figure below shows the dialog used to specify a given object typeview.

 ![alt text](/images/posts/overview/image011.png)


The fields fillcolor, strokecolor and strokewidth has to do with the shape that surrounds the object. In the examples in this document that shape is a rectangle. But in principle it can be any shape. 
The shape is defined by the node template, i.e. the template field in the dialog. 

At the time this is written, 3 templates are supported, which are:

        -	textOnly
        -	textAndIcon
        -	textAndGeo

The templates are illustrated in the following figure:

![alt text](/images/posts/overview/image012.png)

   

*textAndIcon* uses the value of the *icon* field in the typeview dialog to identify the icon. This is a reference to a file that contains the icon, such as a *bmp* file, a *png* file or *svg* file. 
The *geometry* used in *textAndGeo* is stored in the geometry field, in a format like what svg uses. 

### About Relationship typeviews

It is the relationship typeview that specifies what an instance of a relationship type will look like when it is first created in a model. 

The figure below shows the dialog used to specify a given relationship typeview, that contains the default settings.

 ![alt text](/images/posts/overview/image013.png)

The meaning of the fields *strokecolor* and *strokewidth* is self-evident. 
The field *dash* has three values: *None, Dashed and Dotted*, telling whether the line is dashed, dotted or not. 
The field *fromArrow* specifies whether the from side of the relationship will have an arrow or not, and if so, what kind of arrow. The same goes for *toArrow*. 
If the arrows contain a closed area, like a diamond or a triangle or a circle, the color of that area is specified in the fields *fromArrowColor* and *toArrowColor*. 



