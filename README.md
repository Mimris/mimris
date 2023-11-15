
# AKM Modeller

AKM Modeller is the tool for building Active Knowledge Models, a modelling tool with integrated Use-case Modeling and Meta-modelling capabilities.

Its build on some of the same concepts implemented I Metis (1985-2007) which was written in  C++. 
AKM modeller is written in JavaScript and TypeSctipt, using libraries like:  Next.js, React, Redux, Gojs ....

# Develop bransh used for deployment of beta versjon

<!-- ![vv](https://akmclient-beta.herokuapp.com/videos/AKMM-Getting-Started-1.mp4)

<!-- ![vv](https://akmclient-beta.herokuapp.com/videos/AKMM-Getting-Started-1.mp4)
![Getting started](./public/images/alive.png )
<video width="420" height="240" controls>
  <source src="https://akmclient-beta.herokuapp.com/videos/AKMM-Getting-Started-1.mp4" type="video/mp4">
</video>
-->

## The codebase

Akmclient is a collection of functions and components written in TypeScript and React for this Modelling application.
There are two main code parts:

 1. AKMM code
 This code is JavaScript/TypeScript Object-oriented programming and is handeling all AKMM modelling parts, i.e. the the model, modelview, object- relationship, objectview- relationshipview, and the integration with GOJS graphical  diagram library.
 The main principal for AKMM modelling is that the model has a collection of Objects and Relationships.
 Wi have modelviews that has collection of Objectviews and Reltationshipviews that refer to the Objects and Relationships. This means that and object can have many objectviews. These Objectviews can be in same or different Modelviews.

 2. The Frontend backend part, functional programmed handeling the Single page App with integration with Redux store,  API's to GitHub, localStorage and the filesystem.
 To keep track of the state of the App, we have implemented a state focus object that set the focus/context of the current  situation lig current: model, modelview, object, objectview, relationship, relationshipview, current role and task, organisation and project.
 This means that when a Project file is loaded, the state will be set to current focus.
 This focus will be changed every time the user select an item in the modelling area (modelview)



 The functions and components are responsible for handling various tasks such as updating the properties of objects and relationships, handling events on the diagram, toggling tasks, dispatching data to the store, and loading data from local storage, local files or GigHub. 
 The code also includes functions for setting and updating the focus of the application, refreshing the objects, and handling the state of the application. Overall, the code is used to manage the state and behavior of the modeling application.
