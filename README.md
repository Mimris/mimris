
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

 2. The Frontend backend part, functional programmed handeling the Single page App with integration with Redux store,  API's to GitHub, localStorage and the filesystem.
 

 The functions and components are responsible for handling various tasks such as updating the properties of objects and relationships, handling events on the diagram, toggling tasks, dispatching data to the store, and loading data from local storage. The code also includes functions for setting and updating the focus of the application, refreshing the objects, and handling the state of the application. Overall, the code is used to manage the state and behavior of the modeling application.