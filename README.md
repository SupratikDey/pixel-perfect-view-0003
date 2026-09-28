````markdown
# CivicPulse

### See it. Report it. Track it. Fix it.

CivicPulse is a full-stack civic issue reporting and resolution platform that connects citizens, municipal authorities, and field workers through a single workflow.

Instead of treating every complaint as an isolated ticket, CivicPulse combines **location, community confirmations, issue severity, and how long an issue has remained unresolved** to help authorities identify and prioritize persistent problems.

The platform also closes the loop by allowing authorities to assign issues to field workers, track their progress, collect before-and-after evidence, and verify completed work before marking an issue as resolved.

---

## Problem

Local civic problems such as:

- Potholes
- Garbage accumulation
- Broken streetlights
- Water leakage
- Drainage problems
- Road damage

are often reported through disconnected channels.

This can lead to:

- Duplicate complaints for the same issue
- Difficulty identifying which issues need urgent attention
- Poor visibility into how long a problem has remained unresolved
- Limited coordination between authorities and field workers
- Lack of transparent evidence that a reported problem was actually fixed

CivicPulse addresses these problems through a connected reporting, prioritization, assignment, and resolution workflow.

---

## Solution

CivicPulse provides a complete civic issue lifecycle:

```text
Citizen Reports Issue
        ↓
Location + Photo Captured
        ↓
Duplicate Issue Detection
        ↓
Community Confirmation
        ↓
Priority Calculation
        ↓
Authority Reviews & Assigns
        ↓
Field Worker Completes Task
        ↓
Before / After Evidence
        ↓
Authority Verifies Completion
        ↓
Issue Resolved
````

This creates a closed-loop system from **citizen reporting to verified resolution**.

---

## Key Features

### 👤 Citizen Portal

Citizens can:

* Create an account and log in
* Report neighbourhood issues
* Select issue categories
* Upload photos
* Pin the issue location on a map
* Use their current location
* Track submitted issues
* View issue status and priority
* Confirm existing issues reported by other citizens
* View resolution information

---

### 🔎 Duplicate Issue Detection

CivicPulse checks whether a similar active issue has already been reported nearby.

The system considers:

* Issue category
* Geographic distance
* Active issue status

If a potential duplicate is detected, the citizen can either:

**Confirm Existing Issue**

or

**Report as a Separate Issue**

This prevents multiple reports from unnecessarily becoming multiple independent tickets while still allowing citizens to report genuinely different problems.

---

### 📈 Explainable Priority System

Issues are prioritized using an explainable scoring system based on:

```text
Category Severity
        +
Community Confirmations
        +
Issue Persistence
```

For example, a pothole that:

* has existed for several days
* has been confirmed by multiple citizens
* belongs to a higher-severity category

can receive a higher priority than a newly reported minor issue.

The system also preserves the original report time when additional citizens confirm an existing issue.

Example:

```text
First reported: 10:00 AM
Additional confirmation: 8:00 PM

Active for: 10 hours
Confirmations: 2
```

The second confirmation does not reset the issue's age.

---

### 🗺️ Location-Based Issue Mapping

Active civic issues are displayed on an interactive map.

Issues are visually differentiated by priority:

* Critical
* High
* Medium
* Low

Administrators can use the map to identify areas with multiple active problems and investigate local issue clusters.

---

### 🏛️ Municipal Admin Command Center

Administrators receive a centralized dashboard containing:

* Total issues
* Pending issues
* Urgent issues
* Resolved issues
* Issues awaiting verification
* Category analytics
* Status analytics
* Interactive issue map
* Filterable issue queue

Administrators can:

* Verify reports
* Change issue status
* Adjust priority
* Assign teams
* Assign field workers
* Add official remarks
* Review completion evidence
* Approve or request rework

---

### 👷 Field Worker Interface

Field workers receive a dedicated workspace containing their assigned tasks.

They can:

* View assigned civic issues
* View issue location
* Start assigned tasks
* Record task progress
* Upload before photos
* Upload completion photos
* Describe work performed
* Record time spent
* Submit completion evidence

A field worker cannot directly mark an issue as permanently resolved.

Instead:

```text
Field Worker
      ↓
Completion Submitted
      ↓
Authority Verification
      ↓
Resolved
```

This provides an additional verification layer.

---

### 📸 Before & After Evidence

Field workers can submit:

* Before photo
* After photo
* Work description
* Time spent
* Completion notes

Authorities can review this evidence before verifying the issue as resolved.

Citizens can then see the resolution information for transparency.

---

### 🔐 Role-Based Access

CivicPulse supports three primary roles:

| Role         | Responsibilities                 |
| ------------ | -------------------------------- |
| Citizen      | Report and track civic issues    |
| Field Worker | Complete assigned civic tasks    |
| Admin        | Manage, assign and verify issues |

Permissions are enforced through authentication and database-level authorization.

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Query
* TanStack Router
* Leaflet / React Leaflet
* Recharts
* Lucide Icons

### Backend & Data

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* Supabase API
* PostgreSQL Row Level Security (RLS)

### Architecture

```text
┌─────────────────────────────┐
│        React Frontend       │
│                             │
│ Citizen │ Worker │ Admin    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       Supabase API          │
├─────────────┬───────────────┤
│ Auth        │ PostgreSQL    │
│             │               │
│             │ Issues        │
│             │ Users         │
│             │ Confirmations │
│             │ Assignments   │
│             │ Completions   │
└─────────────┴───────────────┘
               │
               ▼
┌─────────────────────────────┐
│      Supabase Storage       │
│                             │
│ Issue Photos                │
│ Completion Evidence         │
└─────────────────────────────┘
```

---

## Database Design

The platform uses PostgreSQL because CivicPulse contains several related entities and workflows.

Core entities include:

```text
Profiles
   │
   ├── Citizens
   ├── Field Workers
   └── Admins

Issues
   │
   ├── Confirmations
   ├── Assignments
   └── Completion Records
```

Important relationships include:

```text
User → Reports → Issue

User → Confirms → Issue

Admin → Assigns → Field Worker

Field Worker → Completes → Issue

Admin → Verifies → Completion
```

---

## Issue Lifecycle

The issue workflow is:

```text
REPORTED
    ↓
VERIFIED
    ↓
ASSIGNED
    ↓
IN_PROGRESS
    ↓
COMPLETION_SUBMITTED
    ↓
RESOLVED
```

Issues can also be rejected when appropriate.

---

## Priority Model

CivicPulse uses an explainable prototype scoring model.

Example category weights:

| Category      | Base Score |
| ------------- | ---------- |
| Water Leakage | 8          |
| Drainage      | 8          |
| Pothole       | 6          |
| Road Damage   | 6          |
| Garbage       | 5          |
| Streetlight   | 4          |
| Other         | 3          |

Community confirmations and issue persistence contribute additional points, with caps to prevent either factor from dominating the entire score.

Example priority levels:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

The model is intentionally deterministic and explainable rather than being presented as production-grade AI.

---

## Security

CivicPulse uses multiple layers of security:

* Supabase Authentication
* Role-based authorization
* PostgreSQL Row Level Security
* Protected administrative operations
* Restricted field-worker task access
* Controlled storage access
* Input validation
* Duplicate confirmation protection

Examples:

```text
Citizen
  ✕ Cannot perform admin operations

Field Worker
  ✕ Cannot modify arbitrary issues
  ✕ Cannot assign themselves tasks
  ✕ Cannot directly resolve issues

Admin
  ✓ Can manage and verify issues
```

---

## Responsive Design

CivicPulse is designed for:

* Desktop
* Tablet
* Mobile

The field-worker interface is particularly optimized for mobile usage because field workers may access tasks while working in the field.

---

## Getting Started

### Prerequisites

Make sure you have:

* Node.js
* npm
* A Supabase project

### Installation

Clone the repository:

```bash
git clone https://github.com/SupratikDey/endtoend-wonder.git
```

Navigate into the project:

```bash
cd endtoend-wonder
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file based on the project's environment example.

Configure the required Supabase variables, such as:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Do not commit secrets or private credentials to GitHub.

### Run the Development Server

```bash
npm run dev
```

The application will be available at the local development URL shown in the terminal.

---

## Demo Workflow

A recommended demonstration flow is:

### 1. Citizen

Create a civic report:

```text
Pothole
↓
Description
↓
Photo
↓
Location
```

### 2. Duplicate Detection

Submit another report near the same location.

CivicPulse identifies the existing issue.

Choose:

```text
"I have this problem too"
```

The original issue gains another community confirmation.

### 3. Priority

Show that the issue's priority considers:

* Category severity
* Confirmations
* Persistence

### 4. Admin

Log into the admin dashboard.

Show:

* Issue metrics
* Charts
* Map
* Priority queue

Assign the issue to a field worker.

### 5. Field Worker

Log in as the assigned worker.

Show:

```text
My Tasks
↓
Open Issue
↓
Start Task
↓
Upload Before Photo
↓
Complete Work
↓
Upload After Photo
↓
Enter Time Spent
↓
Submit Completion
```

### 6. Admin Verification

Admin reviews:

* Before photo
* After photo
* Work description
* Time spent

Then:

```text
Verify & Resolve
```

### 7. Citizen

Return to the issue as a citizen and show the completed resolution.

---

## Why CivicPulse?

Most civic reporting systems focus primarily on collecting complaints.

CivicPulse focuses on the **entire lifecycle of a civic issue**:

```text
REPORT
   ↓
UNDERSTAND
   ↓
PRIORITIZE
   ↓
ASSIGN
   ↓
FIX
   ↓
VERIFY
   ↓
RESOLVE
```

The goal is not simply to create another complaint form, but to create a transparent connection between **citizens, authorities, and the people actually performing the work**.

---

## Future Improvements

Potential future enhancements include:

* Multilingual issue reporting
* Voice-based reporting
* Automated issue categorization
* More advanced geospatial clustering
* SMS/email notifications
* Municipal organization management
* Historical civic analytics
* Predictive maintenance insights
* Integration with existing municipal grievance systems

---

## Project Status

CivicPulse was developed as a full-stack hackathon project focused on building a practical, end-to-end civic issue reporting and resolution workflow.

### Core workflow

```text
Citizen
  ↓
Report
  ↓
Community Confirmation
  ↓
Priority
  ↓
Admin Assignment
  ↓
Field Worker
  ↓
Completion Evidence
  ↓
Admin Verification
  ↓
Resolution
```

---

## Team

**CivicPulse — Full Stack Hackathon Project**

Built using React, TypeScript, Supabase, PostgreSQL and modern web technologies.

---

## License

This project was created for educational and hackathon purposes.

```

### One change I'd make before putting this on GitHub

Don't claim features in the README as **fully functional** until your final testing confirms them. In particular, the new **Field Worker**, completion evidence, and persistence scoring features are things you're still implementing.

Once those are actually working, this README will give judges a very clear picture of the project.

Also, your GitHub repository is currently named **`endtoend-wonder`**, while the actual product is **CivicPulse**. If you have time before submission, renaming the repository to something like `CivicPulse` or `CivicPulse-Hackathon` would make the project look much more polished.
```
