---
title: Mimris
layout: default
nav_order: 1
---

# Mimris

_Mimris_ is a modular platform for managing medical imaging repositories, analytics workflows, and AI-driven insights. This landing page highlights the mission of the project, showcases the core capabilities, and points you to the right resources to get started quickly.

<div align="center">
  <img src="https://img.shields.io/badge/status-active-success.svg" alt="Project status badge" />
  <img src="https://img.shields.io/badge/platform-web%20%7C%20cloud-blue.svg" alt="Platform badge" />
  <img src="https://img.shields.io/badge/license-Apache%202.0-lightgrey.svg" alt="License badge" />
</div>

## Why Mimris?

- **Unified data management**: Centralize ingestion, storage, and discovery of medical imaging datasets with fine-grained access controls.
- **Workflow automation**: Orchestrate repeatable pipelines for preprocessing, training, and evaluation using the built-in workflow engine.
- **Insightful analytics**: Track lineage, metrics, and audit trails to enable reproducibility and regulatory compliance.
- **Extensible foundation**: Plug in custom tooling via APIs, webhooks, and microservice integrations.

## Quick start

1. Review the [installation guide](_guides/installation.md) for prerequisites and deployment instructions.
2. Apply the SQL migrations located in the [`migrations/`](../migrations/) directory to set up the schema.
3. Configure runtime services using the [system architecture reference](_guides/system-architecture.md).
4. Explore the API endpoints and data contracts in the [specifications](_specs/) directory.

> 💡 Looking for a local playground? Check out the `nodemon` and `docker` profiles described in the [Roadmap](ROADMAP.md) to see what is coming next.

## Feature highlights

| Domain | Highlights |
| --- | --- |
| Data lifecycle | Multi-tenant repositories, ingestion adapters, policy enforcement |
| Analytics | Job orchestration, metrics tracking, artifact versioning |
| Compliance | Audit-ready logs, RBAC, customizable retention policies |
| Integrations | REST APIs, webhooks, federated search, external ML pipelines |

## Architecture snapshot

Mimris is composed of interoperable services:

- **Core API** – Responsible for CRUD operations, authentication, and access control.
- **Workflow Engine** – Coordinates data processing, triggering jobs based on events and schedules.
- **Storage Abstraction** – Provides adapters for object stores, file systems, and PACS-compatible endpoints.
- **Observability Layer** – Captures metrics, traces, and logs for reliability and compliance.

Dive deeper into each subsystem in the [System Architecture overview](_guides/system-architecture.md).

## Documentation structure

The documentation is organized into the following sections:

- **[Getting Started](_guides/)** – Installation, quick start, and system architecture
- **[Specifications](_specs/)** – Technical specifications and data models
- **[Features](_features/)** – Detailed feature documentation including icon system
- **[Community](_community/)** – Contributing guidelines, code of conduct, and support

## Contributing

We welcome community contributions! Get started by reading the [contribution guidelines](_community/contributing.md) and [code of conduct](_community/code-of-conduct.md). When you are ready to propose changes, open an issue and draft a pull request that references the relevant documentation.

## Support & roadmap

- 📬 Need help? Visit the [Support guide](_community/support.md) for contact options.
- 🗺️ Curious about our trajectory? The [Roadmap](ROADMAP.md) details planned milestones and in-progress initiatives.
- 🧭 Want to understand the bigger picture? Browse the [Additional documentation](Additional-docs.md) for deep dives and context.

---

<sub>Maintained by the Mimris community. Last updated {{ site.time | date: "%B %d, %Y" }}.</sub>
