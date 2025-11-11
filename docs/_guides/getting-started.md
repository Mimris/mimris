---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started

This guide walks you through setting up Mimris for development and exploring the core workflows that power the platform.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Access to a medical imaging dataset for ingestion testing

Refer to the [Installation guide](INSTALLATION.md) for platform-specific instructions and environment configuration.

## Local development setup

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/Mimris/mimris.git
   cd mimris
   npm install
   ```
2. Copy the example environment variables and update secrets:
   ```bash
   cp .env.example .env.local
   ```
3. Run database migrations:
   ```bash
   npm run migrate
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Creating your first dataset

1. Launch the Mimris UI and sign in with your administrator account.
2. Navigate to **Datasets → New dataset** and supply metadata including modality, acquisition date, and access rules.
3. Use the upload wizard or API client to ingest imaging files.
4. Tag the dataset with relevant labels for discovery and downstream workflows.

## Automating a workflow

1. Open **Workflows → Create workflow**.
2. Define triggers (schedule, dataset event) and select processing stages.
3. Attach analysis templates or custom containers.
4. Save and activate the workflow to begin processing incoming datasets.

## Next steps

- Explore the [System Architecture](SYSTEM-ARCHITECTURE.md) overview to understand how services communicate.
- Review the [API specification](spec/README.md) for programmatic integrations.
- Visit the [Roadmap](ROADMAP.md) to align contributions with upcoming milestones.
