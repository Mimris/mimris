const Help = `

## Table of Contents
    - [Introduction](#introduction)
    - [Example Metamodel](#example - metamodel)
    - [Creating a Type Definition Model](#creating - a - type - definition - model)
    - [Step 1: Create Initial Containers](#step - 1 - create - initial - containers)
    - [Step 2: Create EntityTypes](#step - 2 - create - entitytypes)
    - [Step 3: Create Relationship Types](#step - 3 - create - relationship - types)
    - [Step 4: Add Properties](#step - 4 - add - properties)
    - [Step 5: Add Values](#step - 5 - add - values)
    - [Step 6: Add Advanced Type Elements](#step - 6 - add - advanced - type - elements)
    - [Generating Your New Metamodel](#generating - your - new- metamodel)
    - [Building Models with Your Custom Metamodel](#building - models -with-your - custom - metamodel)
-[Customizing Visual Appearance](#customizing - visual - appearance)
    - [Reference: The AKM - CORE_MM Metamodel](#reference - the - akm - core_mm - metamodel)

## Introduction

Metamodeling allows you to create custom modeling languages for your specific domain.In MIMRIS, we define ** Object Types ** and ** Relationship Types ** that form the building blocks of your custom modeling language.

The metamodeling process uses the ** AKM - CORE_MM ** metamodel as its foundation:

![AKM - CORE Metamodel](images / posts / CustomMeta / Picture1.png)

    > 💡 ** Want to learn more ?** Check out our[detailed guide on building custom metamodels](http://localhost:3000/helpblog/002-BuildCustomMetamodels#AKMM%20Help)

## Example Metamodel

To illustrate the metamodeling process, we'll build a simple domain model for property ownership with:

* Four object types: ** Person **, ** House **, ** Apartment ** and ** Car **
* Two relationship types: ** owns ** and ** rents **

    Our completed metamodel will look like this:

![Example Metamodel](images / posts / modelling / image_model031.png)

This type definition model will generate a new metamodel that lets you model people, properties, and their ownership relationships.
`
export default 