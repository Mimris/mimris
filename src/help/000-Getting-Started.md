---
title: 'Getting Started with Mimris Modeller'
date: 'Oct 23, 2025'
excerpt: 'Mimris Modeller is a tool for Active Knowledge Modelling (AKM). 
This Guide help you getting started and show you how to load and save a Project with models and metamodels from local Json-files and a GitHub Repository'
cover_image: ''
---

# **Getting Started with Mimris**

## **1. Introduction**

Mimris is a **metamodel-based modelling environment** designed for constructing and maintaining **Active Knowledge Models (AKMs)**.  
It enables you to define metamodels, build structured models, and visualize semantic relationships between entities, properties, and datatypes.

---

## **2. System Requirements**

| Component | Requirement |
|------------|--------------|
| Platform | Web application (Next.js / React) |
| Browser | Chrome, Edge, or Safari |
| Hosting Options | Localhost or Vercel (Prod, Beta, Alpha) |
| File Format | `.mimris` – JSON-based project file |

---

## **3. Access Points**

You can access Mimris from any of these environments:


- **Production:** [https://akmmclient.vercel.app/modelling](https://akmmclient.vercel.app/modelling)
- **Beta:** [https://akmmclient-beta.vercel.app/modelling](https://akmmclient-beta.vercel.app/modelling)
- **Alpha:** [https://akmmclient-alpha.vercel.app/modelling](https://akmmclient-alpha.vercel.app/modelling)

Your active version is indicated in the top bar, e.g., `version: local`.

---

## **4. Interface Overview**

| Area | Function |
|------|-----------|
| **Top Bar** | Access version selector, Help, Videos, and About pages |
| **Project Bar** | Manage project files (`Open Project File`, `File`, `Reload`) |
| **Mode Toggle** | Switch between *Metamodel* and *Model* modes |
| **Palette (Left)** | Lists object types (drag-and-drop to canvas) |
| **Modelling Canvas (Center)** | Build and visualize model structures |
| **Object List (Right)** | View or drag existing objects into the model |
| **Object Details Panel** | Edit metadata and attributes for the selected object |
| **Tabs (Top)** | Navigate between model views, e.g. `01-TypeDef_CORE`, `02-Concept_IRTV` |

---

## **5. Basic Workflow**

### **Step 1 — Open or Create a Project**

- Click **Open Project File** and select an existing `.mimris` file  
- Or start a new model from a template (e.g., *BPMN-Template*)

### **Step 2 — Select Mode**

- **Metamodel Mode:** define reusable types, datatypes, and relationships  
- **Model Mode:** instantiate and link objects using a chosen metamodel

### **Step 3 — Create and Connect Objects**

1. Drag an object type (e.g., `EntityType`, `Property`, `Datatype`) from the **Palette** to the **Canvas**  
2. Connect objects by dragging from one to another (arrow indicates relationship)  
3. Name and configure each object in the **Object Details** panel

### **Step 4 — Organize**

- Use **Tabs** to separate conceptual layers or domains  
- Apply filters or sorting via **Filter/Sort** dropdown

### **Step 5 — Save and Export**

- Use **File → Save** to preserve progress  
- **File → Export** to generate a portable `.mimris` file

---

## **6. Working with Metamodels**

Use the **Change Metamodel** dropdown to switch between:

- **CORE_META** – Core ontology layer  
- **IRTV_META** – Information Reference and Type Vocabulary  
- **POPS_META** – Process and Operations metamodel  
- **BPMN_META** – Business Process Modelling Notation  

Switching metamodels updates the palette and permissible object types.

---

## **7. Import and Integration**

| Feature | Purpose |
|----------|----------|
| **OSDU Imp** | Imports schemas and definitions from the OSDU standard |
| **File Import** | Load previously saved Mimris projects |
| **Export** | Save `.mimris` models for collaboration or reuse |

---

## **8. Interface Controls**

| Action | Control |
|---------|----------|
| Toggle Palette | Left arrow `-->` |
| Show Object Details | Right panel toggle |
| Reload Current Model | Top bar `Reload` |
| Switch Metamodel | Dropdown `Change Metamodel` |
| Access Help | [http://localhost:3000/helpblog](http://localhost:3000/helpblog) |

---

## **9. Example**

To build a BPMN-based model:

1. Switch to **BPMN_META**
2. Add **Process**, **Task**, and **Flow** objects
3. Connect using directional links
4. Save as `Process_BPMN.mimris`

---

## **10. Support**

| Resource | Link |
|-----------|------|
| **Help Blog** | [http://localhost:3000/helpblog](http://localhost:3000/helpblog) |
| **Video Tutorials** | [http://localhost:3000/videos](http://localhost:3000/videos) |
| **About / Documentation** | [http://localhost:3000/about](http://localhost:3000/about) |
| **Developer** | Mimris – *Modeller 2025* |

---
