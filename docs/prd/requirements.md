# Requirements

## Functional Requirements

- **FR1:** The system shall provide a single-page web form for agents to input property data.
- **FR2:** The system shall have an automated backend process to receive the data.
- **FR3:** The system shall leverage AI to generate a property narrative and social media snippets.
- **FR4:** The system shall include a "Weekend Snapshot" feature tailored to the "Target Buyer".
- **FR5:** The system must integrate with a document generation API.
- **FR6:** A library of 2-3 pre-designed PDF templates must be available.
- **FR7:** The system shall automatically deliver the final assets to the agent via email.
- **FR8:** The delivery email shall include all AI-generated text content in an easily editable format.

## Non-Functional Requirements

- **NFR1:** The user-facing platform must be a web-based application.
- **NFR2:** The generated PDF dossier must be of "design agency" quality.
- **NFR3:** The target end-to-end processing time should be under 5 minutes.
- **NFR4:** The MVP must be fully functional in French only.
- **NFR5:** The technology stack must be cost-effective and low-maintenance.
- **NFR6:** The document generation API must support advanced layout features.
- **NFR7:** All user-submitted data must be handled exclusively through the secure backend endpoint.
- **NFR8:** An automated data retention policy will permanently delete all records and files 7 days after submission.
- **NFR9:** All data must be encrypted in transit (TLS 1.2+) and at rest (AES-256).
- **NFR10 (New):** The rate limits and pricing models of all chosen third-party APIs must be analyzed to ensure the MVP can operate within its expected usage and budget.
