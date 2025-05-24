# Mimris-Modeling-App 🎨

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-3178C6?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-13.0+-000000?logo=next.js)

Open-source Modelling tool with Graphical Diagram Editor using Cyclic Entity-based Modeling and Metamodelling capabilities.
<!-- <img src="https://github.com/user-attachments/assets/ea2b6b9a-f8cc-4916-aa00-3e8693015fd3" alt="Image Description" width="200" /> -->

## Table of Contents

- [Mimris-Modeling-App 🎨](#mimris-modeling-app-)
  - [Table of Contents](#table-of-contents)
  - [Introduction to Modelling with Mimris](#introduction-to-modelling-with-mimris)
    - [Understanding Metamodels](#understanding-metamodels)
    - [Textual vs. Graphical Modelling Languages](#textual-vs-graphical-modelling-languages)
    - [CORE\_META: The Core of Custom Modelling](#core_meta-the-core-of-custom-modelling)
    - [Creating Custom Modelling Languages](#creating-custom-modelling-languages)
    - [BPMN example model](#bpmn-example-model)
  - [Authors](#authors)
  - [Tech Stack](#tech-stack)
  - [Features](#features)
  - [Quick Start �](#quick-start-)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
  - [Usage 🖌️](#usage-️)
    - [Basic user Workflow](#basic-user-workflow)
  - [Development](#development)
    - [Project Structure](#project-structure)
    - [Run Tests](#run-tests)
  - [State Management](#state-management)
    - [Redux Store Structure](#redux-store-structure)
  - [Diagram Engine](#diagram-engine)
    - [GoJS Configuration](#gojs-configuration)
  - [Contributing](#contributing)
  - [License](#license)
- [Mimris](#mimris)
- [Develop branch used for deployment of beta versjon](#develop-branch-used-for-deployment-of-beta-versjon)
  - [The codebase](#the-codebase)

## Introduction to Modelling with Mimris

![Mimris Modeller](https://github.com/user-attachments/assets/d27506a0-4fa1-4d92-b783-f2f4eb65efc2)

A modelling language is an artificial, formal language designed to express data, information, or knowledge in a structured and consistent manner. Each modelling language adheres to a clearly defined set of rules that govern its syntax and semantics.

In Mimris, the modelling language is graphical in nature, providing a visual means of representing complex information and relationships.

### Understanding Metamodels

A metamodel is a model that defines the structure and semantics of a modelling language. In practice, the term metamodel is often used interchangeably with modelling language, although the metamodel technically describes the language rather than using it. This distinction is crucial for understanding how to create and utilize custom modelling languages within Mimris.

### Textual vs. Graphical Modelling Languages

In textual modelling languages, we typically speak in terms of nouns (entities) and verbs (actions or relationships). In a graphical modelling language such as Mimris, the corresponding terms are objects and relationships. This shift from textual to graphical representation allows for a more intuitive and visual approach to modelling complex systems.

### CORE_META: The Core of Custom Modelling

The modelling language used within Mimris to define new, custom modelling languages is called `CORE_META`. `CORE_META` provides a set of modelling primitives that enable users to define custom object types (analogous to nouns) and relationship types (analogous to verbs), along with associated properties and methods.

### Creating Custom Modelling Languages

Once these custom types are specified (modelled), users can invoke the “Generate Metamodel” function to automatically produce their own metamodel. These metamodels—essentially new, domain-specific modelling languages—can then be used as the foundation for creating custom models tailored to specific needs or contexts.

By leveraging `CORE_META`, users can develop highly specialized modelling languages that cater to the unique requirements of their projects, ensuring a more precise and effective modelling process.

### BPMN example model

The Mimris version of the BPMN Metamodel as shown below is rather advanced. 
It utilizes inheritance from an abstract object type (Gateway), relationships to and from the abstract type, in addition to relationships between non-abstract object types (Start, Task, End).  

![BPMN-Meta](https://github.com/user-attachments/assets/d1cda36a-71e6-475e-8223-1b0a8a09b777)

In addition it utilizes the “template2” field in the object and relationship views. This to achieve a completely different visualization of objects and relationships in the models built using the generated template than in the metamodel itself.

Below is shown an example model built using a template generated from the metamodel above.

![BPMN-example](https://github.com/user-attachments/assets/322c2cec-c1bc-4ea4-813b-04675bbe86fe)


[Powered by GoJS](https://gojs.net)

## Authors

[Authors](docs/AUTHORS.md)



## Tech Stack

- **Frontend Framework**: Next.js 13 (Page Router)
- **Language**: TypeScript 5+
- **Diagram Library**: GoJS 3.0
- **State Management**: Redux
- **Rendering**: React
- **Build System**: npm
- **Styling**: Bootstrap and ReactStrap, CSS  
  
## Features

- **Basic Knowledge graph**
  - Object/node Relationship/edge arrays based on types defined in Metamodel with Objecttype and Relationshiptypes.
- **📐 GoJS-Powered Node Editor**
  - Objectview and Relationship in Modelviews(diagrams) for presentation of views.
  - Advanced Relationship/link routing and automatic layout.
  - Objectviewstyles to define visualisation of objects and relationships.
- **Next.js Optimized Rendering**
- **Redux State Syncing**
  - Real-time collaboration through state synchronization
  - Time-travel debugging capabilities
- **Type-Safe Development**
  - Strict TypeScript configuration
  - Generated API types from OpenAPI spe
- Customizable templates & components
- Web based Cross-platform support (Windows/Linux/macOS)

## Quick Start �

- **Clone repository

```bash
# Clone the repository
git clone https://github.com/Mimris/mimris.git
cd mimris
```bash

- **Install dependencies

```bash
# Install with npm
npm install
```

- **Launch development mode

```bash
# Start the development server
npm run dev
```

## Installation

### Prerequisites

- Node.js
- npm
- Next.js
- GoJS

See [INSTALLATION.md](/docs/INSTALLATION.md) for detailed instructions.

## Usage 🖌️

### Basic user Workflow

1. Drag Objecttypes from the Palette in to the modelling area
2. Connect nodes using relationships. Click on the obects edge and drag to another object to create a relationship
3. Arrange the objects in the modelling area by dragging them to the desired position and arrange them in Containers.
4. Click on the Hamburger menu in the top left corner to open the menu to Save, Export or Import a model.

## Development

### Project Structure

```
/public     - Static files
/docs       - Documentation files
/src
  /components - React components
    /utils      - Utility functions
  /hooks      - Custom hooks
  /styles     - CSS styles
  /Mimris       - Mimris modules
  /pages       - Next.js pages
    /api         - API routes
    /helpblogs - Help blogs
  /posts       - Blog posts
  /reducers    - Redux reducers
  /store      - Redux store
  /saga       - Redux saga
  /defs      - ?
  /modelProjects - Model projects

```

### Run Tests

```bash
npm test (no tests implemented yet)
```

## State Management

### Redux Store Structure

```typescript
initialState = {
  phData, // Metamodel and Model data
  phFocus, // Current focus data. i.e. focusModel, focusModelview, focusObjectvieiw etx.
  phUser, // User preferences
  phSource, // Sourcefile (local or github)
  lastUpdate: new Date().toISOString()
}
```

## Diagram Engine

### GoJS Configuration

```typescript
// lib/gojsConfig.ts
import * as go from 'gojs';

export function initializeDiagram(): go.Diagram {
  const $ = go.GraphObject.make;
  
  return $(go.Diagram, {
    'undoManager.isEnabled': true,
    layout: $(go.ForceDirectedLayout),
    model: $(go.GraphLinksModel, {
      linkKeyProperty: 'key'
    })
  });
}

// Custom node template
export const nodeTemplate = (
  <Node
    locationSpot={go.Spot.Center}
    selectionAdorned={true}
  >
    <Shape 
      figure="Rectangle" 
      fill="#2F80ED" 
      strokeWidth={0}
    />
    <TextBlock 
      text="{name}" 
      margin={8} 
      stroke="white"
    />
  </Node>
);
```

## Contributing

We welcome contributions to the Mimris Modelling App! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.
We welcome contributions under these guidelines:

1. Clone the repository
2. Create a feature branch
3. Submit a pull request

Review our [CONTRIBUTING GUIDE](docs/CONTRIBUTING.md) before submitting code.

Priority Areas:

- 🐛 Bug fixes
- 📖 Documentation improvements
- 🔒 Security enhancements
- 🧩 Migrate from Redux to Redux Toolkit
- 🧩 Migrate from Bootstrap CSS to TailwindCSS and Shadch
- 🧩 Enhance GoJS Dialogs and Menus (Shadcn?)
- 🧩 Add more examples and documentation
- 🧩 Add tests
- 🧩 Add more components
- 🧩 Add more features
- 🧩 Add more templates
- 🧩 Add more themes
- 🧩 Add more Metamodels
- 🧩 Add more modelling tools
- 🧩 Add more modelling languages
- 🧩 Add more modelling paradigms/metamodels
- 🧩 Add more modelling techniques
- 🧩 Add more modelling methods
- 🧩 Add more modelling frameworks
- 🧩 Add more modelling standards

## License

This project is licensed under the GNU General Public License v3.0 - see [LICENSE](LICENSE) file for details.

**Key License Requirements:**

- All derivative works must remain open-source
- Modifications must be clearly marked
- Source code must be distributed with any binaries

---

---

**Maintained by** [Mimris]

 📧 <snorres@gmail.com>

![Mimris Live Demo](mimris.vercel.app/modelling)

# Mimris

Mimris is the tool for building Active Knowledge Models, a modelling tool with integrated Use-case Modeling and Meta-modelling capabilities.

Its build on some of the same concepts implemented I Metis (1985-2007) which was written in  C++. 
Mimris is written in JavaScript and TypeScript, using libraries like:  Next.js, React, Redux, Gojs ....

# Develop branch used for deployment of beta versjon

<!-- ![vv](https://Mimris-beta.herokuapp.com/videos/Mimris-Getting-Started-1.mp4)

<!-- ![vv](https://Mimris-beta.herokuapp.com/videos/Mimris-Getting-Started-1.mp4)
![Getting started](./public/images/alive.png )
<video width="420" height="240" controls>
  <source src="https://Mimris-beta.herokuapp.com/videos/Mimris-Getting-Started-1.mp4" type="video/mp4">
</video>
-->

## The codebase


Mimris is a collection of functions and components written in TypeScript and React for this Modelling application.
There are two main code parts:

 1. Mimris code
 This code is JavaScript/TypeScript Object-oriented programming and is handling all Mimris modelling parts, i.e. the the model, modelview, object- relationship, objectview- relationshipview, and the integration with GOJS graphical  diagram library.
 The main principal for Mimris modelling is that the model has a collection of Objects and Relationships.
 Wi have modelviews that has collection of Objectviews and Reltationshipviews that refer to the Objects and Relationships. This means that and object can have many objectviews. These Objectviews can be in same or different Modelviews.

 1. The Frontend backend part, functional programmed handling the Single page App with integration with Redux store,  API's to GitHub, localStorage and the filesystem.
 To keep track of the state of the App, we have implemented a state focus object that set the focus/context of the current  situation lig current: model, modelview, object, objectview, relationship, relationshipview, current role and task, organisation and project.
 This means that when a Project file is loaded, the state will be set to current focus.
 This focus will be changed every time the user select an item in the modelling area (modelview)

 The functions and components are responsible for handling various tasks such as updating the properties of objects and relationships, handling events on the diagram, toggling tasks, dispatching data to the store, and loading data from local storage, local files or GigHub. 
 The code also includes functions for setting and updating the focus of the application, refreshing the objects, and handling the state of the application. Overall, the code is used to manage the state and behavior of the modeling application.

AKM client is a collection of functions and components written in TypeScript and React for a modeling application. The functions and components are responsible for handling various tasks such as updating the properties of objects and relationships, handling events on the diagram, toggling tasks, dispatching data to the store, and loading data from local storage. The code also includes functions for setting and updating the focus of the application, refreshing the objects, and handling the state of the application. Overall, the code is used to manage the state and behavior of the modeling application.

