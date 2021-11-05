---
title: 'Getting Started with AKM Modeller'
date: 'Oct 18, 2021'
excerpt: 'AKM Modeller is a tool for modeling, creating and managing AKM models and metamodels. 
This Guide help you getting starte and show  you how to load and save Project with models and metamodels from local Json-files. These files can also be syncronized with a GitHub Repository'
cover_image: 'images/posts/overview/image00.png'
---

## Introduction

AKM Modeller is a tool for modeling, creating and managing AKM models and metamodels.
The models are stored in Json-files and can be loaded and saved from local and GitHub.

table of contents:

  - [Getting Started](#getting-started)
  - [Loading a model project](#loading-a-model-project)
  - [Saving a model project](#saving-a-model-project)
  - [Crash Recovery](#crash-recovery)
  - [Using GitHub](#using-github) 
 
---

## Getting Started

When you start AKM Modeller you will see a welcome screen.

![Homepage](/images/posts/overview/image00.png)

Here you will find some useful information about AKM (Active Knowledge Model) and the AKM Modeller Tool.
There are more information about AKM Modeller in the [About page](/about).

Open the modeller by clicking on the modelling page in the top menu.

![Modellingpage](/images/posts/overview/image01.png)

An initial project will be opened. 

![Modellingpage](/images/posts/overview/image02.png)

---
 - [-back to the top-](#introduction)
---

## Loading a model project

To load a project from a local file you can use the following command:

1 Click on the blue "Model file" button at the top of the modelling area. 

![Modellingpage](/images/posts/overview/image03.png)

2 Click on the "Choose file" button and Select the model file you want to load (.json file).

![Open File](/images/posts/overview/image04.png)

3 Click on the "Done" button.

The project will be loaded and the modelling area will be filled with the new model.
The project might have more than one model. To select a model you can click on the model name (4) in the top right.

4 Select the model you want to load.

---
 - [-back to the top-](#introduction)
---

## Saving a model project

To save a project to a local file you can use the following command:

"Save Project (all) to file"

![Modellingpage](/images/posts/overview/image05.png)

This will save all models and metamodels in the project to a local file.

In the same way you can save a model or a modelview to a local file with the buttons "Save Current Model to file" and "Save Current Modelview to file".

You can also save the metamodel to a local file with the button "Save Current Metamodel to file".

---
 - [-back to the top-](#introduction)
---

## Crash Recovery

In case of a crash or hang (browser not responding) you can recover the last refreshed version of the current project from the Browser LocalStorage.

- Fist clikc on the Local (white button) at the top of the modelling area.
- Then Click on the "Recover Project ( last refreshed version" button at the bottom of the dialog vindow.
- 

---
 - [-back to the top-](#introduction)
---

## Using GitHub

Using GitHub to store your model projects.

Because the Project model files are Json-files, you can also store your model projects in GitHub repository.
Create a repository in GitHub and add a folder were you can store your model files.
Clone the repository to your local computer and open and save your model project file from you local repository as described above.

When you have savee your project, you can **Add, Commit and Push** your repository to GitHub as normal.

---
 - [-back to the top-](#introduction)
---