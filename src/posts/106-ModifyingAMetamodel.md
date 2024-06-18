---
title: 'Modifying your Type Definition Model'
date: 'November 8, 2021'
excerpt: 'Detailing the Type Definition Model by adding properties and specifying typeviews'
cover_image: 'images/posts/modelling/image_model002.png'
---

## Modify the type definition model
If something is wrong in your metamodel, or you want to change anything, go back to the type definition model, do the necessary changes, and generate the metamodel again.

If you want to add symbols and colors to your types, go back to your type definition model to add view specifications, and generate the metamodel again.

The view specifications are done by editing “*Object View*” of the “*EntityType*” objects and by editing “*Relationship View*” of the “*isRelatedTo*” relationships. 
The “*Object View*” and “*Relationship View*” definitions are used to define the corresponding “*Object Typeview*” and “*Relationship Typeview*” definitions in the generated metamodel.

### Detailing the type definition model

The first thing you do when you want to add more details to your metamodel than just defining object and relationship types is to add properties to your object types. This is done in the model of your metamodel. 
For example, in our test metamodel defined above, we could add properties to “Person”, like:

    -   Phone number
    -   Email address
    -   Birth date
    -   Etc.

And to the “House”:

    -   Address
    -   Size
    -   Year built
    -   Etc.

If you do that, and then regenerate the metamodel, those properties will appear as attributes in the “*Edit Object*” dialog of the "*Person*" and "*House*" objects.

If nothing further is said about the properties, they will all be “*string*” properties, with no restrictions on the values.

By adding “*Datatype*” to a property, you start adding constraints to the allowed values. The potential constraints are covered by the part of the AKMM initial metamodel, shown in the figure below.

![alt text](/images/posts/modelling/image_model0351.png)

The built-in datatypes are:

    -	string
    -	integer
    -	number
    -	boolean
    -	date

All custom datatypes will be based on one of these. This means that you as a metamodeller can define your own datatypes that combine the built-in types with additional specifications. 

E.g., to define an enumeration list, you may define:

    -	one or more "hasAllowed" relationships to a "Value"
    -	one "isDefault" relationship to one of the "Values"

Combine this with a **FieldType** “*radio*” or “*select*” and this field will in the property dialog appear as a dropdown list, with the default value being the initial value.

The **FieldTypes** currently supported by the Modeller are the following:

    -	checkbox
    -	color
    -	date
    -	email
    -	file
    -	image
    -	month
    -	number
    -	password	
    -	radio
    -	range
    -	select
    -	text
    -	textarea
    -	time
    -	url
    -	week

**InputPatterns** are used to check if values entered by the user are valid / allowed values. 
The mechanism to check this is “**Regular Expressions**”. A regular expression engine has been embedded in AKMM for this purpose.
Ref: https://www.w3schools.com/jsref/jsref_obj_regexp.asp 
and https://www.regular-expressions.info/examples.html

**ViewFormats** are included as a mechanism to format how attribute values are shown in dialogs. The formatting mechanism used is the **printf** C functions family, implemented in Javascript.
Ref: https://alvinalexander.com/programming/printf-format-cheat-sheet/

#### Containers

If you want an object to be visualized as a container, then you should change the value of the "*viewkind*" attribute. This attribute has two values: “*Object*” and “*Container*”. 

A “*Container*” acts like a folder in a file system, you can put objects inside the container and those objects will follow the container when the container is moved. The effect of changing the value from "*Object*" to "*Container*" is illustrated below:

![alt text](/images/posts/modelling/image_model0361.png)

To the left we see two object views of the same object, both with “*viewkind*” having the value “*Object*”. To the right we see the same object views, but in the one to the right “*viewkind*” has the value “*Container*”.

BUT: If you want a generated type to behave like a container, you need to give “*viewkind*” of the “*Object*” the value “*Container*”. In this case the value in the “*Objectview*” is ignored when the metamodel is generated.
