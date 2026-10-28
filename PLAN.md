# PLAN.md — BIM Training & Modeling Platform

## 1. Ringkasan Proyek

Nama sementara produk: **BIM Training & Modeling Platform**.

Platform ini adalah aplikasi web untuk pembelajaran BIM, praktik modeling langsung di browser, simulasi proyek, asesmen kompetensi, review trainer, revisi, dan sertifikasi.

Fokus produk bukan menggantikan Revit secara penuh, tetapi membangun **training-first BIM modeler** yang cukup kuat untuk pembelajaran dan simulasi proyek. Setiap objek model harus memiliki data semantik BIM, bukan hanya mesh 3D.

Alur utama produk:

```text
Belajar
  ↓
BIM Lab
  ↓
BIM Studio
  ↓
Model
  ↓
Validate
  ↓
Submit
  ↓
Review
  ↓
Revision
  ↓
Assessment
  ↓
Competency
  ↓
Certificate
```

## 2. Tujuan Produk

Platform harus memungkinkan peserta untuk:

- mempelajari konsep BIM;
- mengikuti learning path;
- melakukan praktik step-by-step;
- membuat model bangunan di browser;
- melihat model dalam 2D dan 3D;
- mengerjakan challenge;
- mengerjakan project simulation;
- mendapatkan validasi otomatis;
- menerima review trainer;
- memperbaiki issue;
- mendapatkan skor kompetensi;
- memperoleh sertifikat digital.

Prinsip utama:

1. Mudah digunakan peserta pemula.
2. Fokus pada pelatihan, bukan CAD/BIM authoring penuh.
3. BIM data menjadi source of truth.
4. Geometry dan renderer dipisahkan dari data BIM.
5. Semua perubahan model dapat di-undo/redo.
6. Model dapat disimpan, dibuka ulang, divalidasi, dan dinilai.
7. Struktur internal siap dikembangkan menuju IFC/Open BIM.
8. Arsitektur siap menjadi SaaS multi-lembaga.

## 3. Scope MVP

### 3.1 Objek BIM

MVP mendukung:

1. Level
2. Grid
3. Wall
4. Column
5. Beam
6. Slab
7. Door
8. Window

### 3.2 Modeling

MVP harus memiliki:

- create project;
- create level;
- create grid;
- 2D floor plan;
- 3D viewport;
- split 2D/3D;
- wall drawing;
- column placement;
- beam placement;
- slab polygon;
- door placement;
- window placement;
- select object;
- multi select;
- move;
- delete;
- properties editor;
- snap;
- measure;
- undo;
- redo;
- autosave;
- manual save;
- model tree;
- visibility control;
- validation;
- submission.

### 3.3 Training

MVP training mencakup:

- program pelatihan;
- kelas;
- modul;
- materi;
- video;
- dokumen;
- quiz;
- BIM Lab;
- challenge;
- project simulation;
- assignment;
- submission;
- review;
- revision;
- scoring;
- competency matrix;
- certificate.

## 4. Out of Scope MVP

Belum menjadi scope awal:

- MEP authoring penuh;
- parametric family editor kompleks;
- structural analysis;
- native RVT editing;
- DWG editing;
- quantity takeoff lengkap;
- BOQ penuh;
- 4D scheduling;
- 5D cost estimation;
- point cloud;
- GIS;
- digital twin;
- photorealistic renderer;
- multiplayer modeling real-time;
- clash detection penuh;
- IFC round-trip editing penuh.

## 5. Stack Teknologi

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand atau Redux Toolkit
- TanStack Query
- React Router

### BIM / 3D

- Babylon.js
- WebGL
- WebGPU jika tersedia
- Custom BIM Core Engine
- Custom Geometry Engine
- Custom Snap Engine
- Custom Command Engine
- web-ifc

### 2D

- HTML Canvas sebagai viewport utama
- SVG/HTML overlay untuk label, helper, guide, tooltip

### Backend

- Laravel 13
- PHP 8.4+
- REST API
- Laravel Sanctum
- Laravel Queue
- Laravel Events
- Laravel Policies

### Database

- PostgreSQL

Optional:

- PostGIS untuk kebutuhan site/GIS di masa depan.

### Cache & Queue

- Redis

### Storage

- S3 compatible storage
- MinIO untuk development/staging

### IFC Server

- Python
- FastAPI
- IfcOpenShell

### Infrastruktur

- Ubuntu 24.04
- Nginx
- Docker
- Docker Compose
- PostgreSQL
- Redis
- MinIO

## 6. Arsitektur Sistem

```text
Browser
  |
  +-- React + TypeScript
      |
      +-- Training Platform
      |
      +-- BIM Studio
          |
          +-- BIM Core
          +-- 2D Engine
          +-- Geometry Engine
          +-- Babylon Renderer
          +-- Snap Engine
          +-- Command Engine
          +-- Validation Engine
          +-- web-ifc
  |
  +-- Laravel API
      |
      +-- Auth
      +-- Tenant
      +-- Training
      +-- Project
      +-- Submission
      +-- Review
      +-- Assessment
      +-- Certificate
      |
      +-- PostgreSQL
      +-- Redis
      +-- S3 / MinIO
      |
      +-- IFC Service
          |
          +-- FastAPI
          +-- IfcOpenShell
```

## 7. Multi-Tenant

Platform dipersiapkan untuk banyak lembaga.

```text
Platform
  |
  +-- Organization A
  |    +-- Admin
  |    +-- Trainer
  |    +-- Participant
  |    +-- Programs
  |    +-- Projects
  |
  +-- Organization B
       +-- Admin
       +-- Trainer
       +-- Participant
       +-- Programs
       +-- Projects
```

Semua data bisnis utama wajib memiliki `organization_id`.

Tenant isolation wajib diterapkan di query, policy, API, dan file access.

## 8. Role

### Super Admin

- organisasi;
- paket;
- billing;
- global master;
- system monitoring;
- konfigurasi platform.

### Organization Admin

- users;
- trainers;
- participants;
- programs;
- classes;
- projects;
- reports;
- certificates.

### Trainer

- learning content;
- BIM Lab;
- challenge;
- assignment;
- project simulation;
- review;
- issues;
- scoring;
- competency.

### Participant

- belajar;
- quiz;
- BIM Lab;
- BIM Studio;
- project;
- submission;
- revision;
- competency;
- certificate.

## 9. Menu Participant

1. Beranda
2. Belajar
3. BIM Lab
4. BIM Studio
5. Project
6. Kompetensi
7. Profil & Sertifikat

## 10. Layout BIM Studio

### Top Bar

- project name;
- level selector;
- undo;
- redo;
- save;
- autosave status;
- 2D;
- 3D;
- split view;
- validate;
- submit;
- export.

### Left Toolbar

- Select
- Pan
- Grid
- Wall
- Column
- Beam
- Slab
- Door
- Window
- Measure
- Delete

### Left Panel

Tabs:

- Model Tree
- Levels
- Layers
- Library

### Center

Viewport:

- 2D Plan
- 3D
- Split View

### Right Panel

Tabs:

- Properties
- Geometry
- Material
- BIM Data
- Issues

### Bottom Status Bar

- coordinates;
- active snap;
- selected element;
- active tool;
- units;
- zoom;
- save status.

## 11. BIM Core Architecture

Babylon.js hanya renderer, bukan source of truth.

```text
BIM Data
   ↓
Geometry Generator
   ↓
Renderable Geometry
   ↓
Babylon.js
```

Source of truth adalah BIM document internal.

## 12. Base BIM Element

```typescript
interface BIMElement {
  id: string;
  projectId: string;
  levelId?: string;

  type:
    | "grid"
    | "wall"
    | "column"
    | "beam"
    | "slab"
    | "door"
    | "window";

  name: string;
  code?: string;
  ifcClass?: string;

  transform: {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
  };

  materialId?: string;
  properties: Record<string, unknown>;

  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

## 13. Wall

```typescript
interface BIMWall extends BIMElement {
  type: "wall";
  ifcClass: "IfcWall";

  geometry: {
    start: Vector2;
    end: Vector2;
    height: number;
    thickness: number;
    baseOffset: number;
  };

  properties: {
    wallTypeId: string;
    materialId?: string;
    fireRating?: string;
    acousticRating?: string;
  };
}
```

## 14. Column

```typescript
interface BIMColumn extends BIMElement {
  type: "column";
  ifcClass: "IfcColumn";

  geometry: {
    width: number;
    depth: number;
    height: number;
    baseOffset: number;
  };
}
```

## 15. Beam

```typescript
interface BIMBeam extends BIMElement {
  type: "beam";
  ifcClass: "IfcBeam";

  geometry: {
    start: Vector3;
    end: Vector3;
    width: number;
    height: number;
  };
}
```

## 16. Slab

```typescript
interface BIMSlab extends BIMElement {
  type: "slab";
  ifcClass: "IfcSlab";

  geometry: {
    polygon: Vector2[];
    thickness: number;
    baseOffset: number;
  };
}
```

## 17. Door

```typescript
interface BIMDoor extends BIMElement {
  type: "door";
  ifcClass: "IfcDoor";

  hostWallId: string;

  geometry: {
    offset: number;
    width: number;
    height: number;
    sillHeight: number;
  };
}
```

## 18. Window

```typescript
interface BIMWindow extends BIMElement {
  type: "window";
  ifcClass: "IfcWindow";

  hostWallId: string;

  geometry: {
    offset: number;
    width: number;
    height: number;
    sillHeight: number;
  };
}
```

## 19. Grid

```typescript
interface BIMGrid {
  id: string;
  projectId: string;
  axis: "X" | "Y";
  label: string;
  position: number;
}
```

## 20. Level

```typescript
interface BIMLevel {
  id: string;
  projectId: string;
  name: string;
  elevation: number;
  order: number;
}
```

## 21. Unit dan Coordinate System

Internal unit:

```text
millimeter
```

Contoh:

```text
1 m = 1000
3.5 m = 3500
```

Renderer dapat menggunakan conversion adapter:

```text
1000 internal unit = 1 Babylon unit
```

## 22. Command Pattern

Semua perubahan model harus melalui command.

```typescript
interface BIMCommand {
  execute(): void;
  undo(): void;
  redo(): void;
}
```

Command utama:

- AddWallCommand
- MoveWallCommand
- DeleteWallCommand
- UpdatePropertyCommand
- AddColumnCommand
- AddBeamCommand
- AddSlabCommand
- AddDoorCommand
- AddWindowCommand

Tujuan:

- undo;
- redo;
- audit;
- version diff;
- command replay.

## 23. Undo / Redo

Gunakan:

```text
undoStack
redoStack
```

Flow:

```text
execute command
  ↓
push undoStack
  ↓
clear redoStack
```

## 24. Tool System

```typescript
interface StudioTool {
  activate(): void;
  pointerDown(event: PointerEvent): void;
  pointerMove(event: PointerEvent): void;
  pointerUp(event: PointerEvent): void;
  keyDown(event: KeyboardEvent): void;
  cancel(): void;
  deactivate(): void;
}
```

Tools:

- SelectTool
- PanTool
- GridTool
- WallTool
- ColumnTool
- BeamTool
- SlabTool
- DoorTool
- WindowTool
- MeasureTool

## 25. Wall Drawing Workflow

```text
Activate Wall
   ↓
Click Start
   ↓
Snap Start
   ↓
Move Pointer
   ↓
Preview Wall
   ↓
Show Length
   ↓
Orthogonal / Grid Snap
   ↓
Click End
   ↓
Create Wall Command
   ↓
Add BIMWall
   ↓
Generate Geometry
   ↓
Render
```

## 26. Snap Engine

Minimum snap:

- grid;
- endpoint;
- midpoint;
- intersection;
- perpendicular;
- horizontal;
- vertical;
- wall centerline.

Priority:

```text
intersection
endpoint
midpoint
grid
orthogonal
free
```

Snap harus menampilkan visual helper.

## 27. Selection Engine

Harus mendukung:

- single select;
- multi select;
- click selection;
- box selection;
- deselect;
- highlight;
- isolate.

State:

```typescript
selectedIds: string[]
```

## 28. Geometry Engine

Geometry Engine bertugas mengubah BIM semantic object menjadi geometry.

Contoh wall:

```text
BIMWall
  ↓
Direction
  ↓
Perpendicular
  ↓
Wall Polygon
  ↓
Opening Calculation
  ↓
Extrude
  ↓
Mesh
```

Geometry harus dapat di-regenerate ketika properties berubah.

## 29. Door & Window Hosting

Door dan window wajib menjadi child dari wall.

```text
Wall
 ├── Door
 └── Window
```

Jika wall berpindah:

- door ikut;
- window ikut.

Jika wall dihapus:

- tampilkan confirmation;
- door/window host ikut dihapus pada MVP.

## 30. Model Tree

```text
Gedung Kantor
 |
 +-- Level 1
 |    +-- Walls (18)
 |    +-- Columns (8)
 |    +-- Beams (12)
 |    +-- Slabs (1)
 |    +-- Doors (6)
 |    +-- Windows (12)
 |
 +-- Level 2
      +-- Walls
      +-- Columns
      +-- Beams
```

Actions:

- select;
- rename;
- hide;
- show;
- isolate;
- delete.

## 31. Material Library

Material awal:

- Concrete
- Brick
- Glass
- Steel
- Wood
- Gypsum

MVP fields:

```text
id
name
code
color
opacity
```

Future:

- density;
- thermal conductivity;
- fire rating;
- manufacturer.

## 32. Properties Panel

### Identity

- ID
- Name
- Code
- Type
- IFC Class

### Constraints

- Level
- Base Offset
- Top Constraint

### Dimensions

- Length
- Width
- Height
- Thickness

### Material

- Material

### BIM Data

- Classification
- Description
- Custom Properties

## 33. Persistence

Jangan menyimpan mesh sebagai data utama.

Simpan BIM document:

```json
{
  "schemaVersion": "1.0.0",
  "project": {},
  "levels": [],
  "grids": [],
  "elements": [],
  "materials": [],
  "settings": {}
}
```

## 34. Autosave

Autosave:

- debounce 3–5 detik;
- berjalan hanya ketika dirty;
- batch operation;
- tidak memblok UI.

Status:

```text
Saved
Saving...
Unsaved changes
Offline
Save failed
```

## 35. Local Draft

Gunakan IndexedDB sebagai safety layer.

Flow:

```text
Edit
 ↓
Local Draft
 ↓
Internet tersedia
 ↓
Sync Server
```

## 36. Versioning

Version dibuat saat:

- manual checkpoint;
- submission;
- revision submission;
- final submission.

Contoh:

```text
v1 Initial
v2 Submission 1
v3 Revision 1
v4 Final
```

## 37. Validation Engine

### Model Validation

Contoh:

- wall tanpa level;
- door tanpa host;
- window tanpa host;
- slab polygon tidak closed;
- element tanpa material;
- invalid dimensions;
- invalid parent relationship.

### Training Validation

Contoh rule challenge:

```text
2 Level
12 Wall
4 Column
4 Beam
1 Slab
3 Door
6 Window
```

## 38. Rule Engine

```typescript
interface ValidationRule {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  weight: number;
}
```

Rule types:

- MIN_ELEMENT_COUNT
- MAX_ELEMENT_COUNT
- REQUIRED_ELEMENT
- REQUIRED_PROPERTY
- PROPERTY_RANGE
- REQUIRED_LEVEL
- REQUIRED_MATERIAL
- HOST_REQUIRED
- DIMENSION_RANGE

## 39. Auto Assessment

Komponen skor awal:

```text
Task Completion       40%
Model Accuracy        30%
BIM Compliance        20%
Submission Discipline 10%
```

Rumus:

```text
final_score =
completion * 0.40 +
accuracy * 0.30 +
compliance * 0.20 +
discipline * 0.10
```

Trainer dapat memberikan manual adjustment dengan audit log.

## 40. BIM Lab

BIM Lab bersifat guided practice.

Step memiliki:

```text
id
title
instruction
required_action
validation_rule
hint
```

Contoh:

```text
Step 1
Buat wall sepanjang 5000 mm.
```

Sistem otomatis mendeteksi jika step selesai.

## 41. Challenge

Challenge memiliki:

- title;
- description;
- difficulty;
- duration;
- project template;
- rules;
- maximum score;
- passing score.

Contoh:

```text
Challenge: Model Rumah 2 Lantai
Duration: 120 menit
Passing Score: 75
```

## 42. Project Simulation

Project Simulation memiliki:

- briefing;
- drawing/reference;
- project template;
- milestone;
- BIM requirements;
- task;
- validation rules;
- rubric;
- deadline.

## 43. Submission

Status:

```text
draft
submitted
under_review
revision_required
resubmitted
approved
final
```

Submission menyimpan:

- participant;
- project;
- project version;
- submitted_at;
- auto score;
- trainer score;
- status.

## 44. Trainer Review

Trainer dapat:

- membuka model;
- memilih element;
- membuat issue;
- memberi komentar;
- severity;
- assign revision;
- memberi nilai;
- approve.

## 45. Issue Management

Fields:

```text
id
project_id
element_id
title
description
severity
status
assigned_to
created_by
created_at
resolved_at
camera_state
```

Severity:

- info
- minor
- major
- critical

Status:

- open
- in_progress
- resolved
- closed

## 46. Issue Camera State

```json
{
  "position": [0, 0, 0],
  "target": [0, 0, 0],
  "zoom": 1
}
```

Saat issue dibuka:

- kamera pindah ke lokasi;
- element di-highlight.

## 47. Kompetensi

Skill matrix:

- BIM Fundamental
- Architecture Modeling
- Structure Modeling
- MEP Modeling
- BIM Coordination
- Clash Detection
- BIM Management

MVP fokus:

- BIM Fundamental
- Architecture Modeling
- BIM Coordination Basic

## 48. Sertifikat

Certificate memiliki:

- certificate number;
- participant;
- program;
- competency level;
- final score;
- issue date;
- QR verification;
- public verification URL.

## 49. Database Utama

Tabel:

```text
organizations
users
organization_users
roles
permissions

training_programs
training_classes
training_enrollments

modules
lessons
lesson_contents
quizzes
quiz_questions
quiz_attempts

bim_labs
bim_lab_steps
challenges
challenge_rules

projects
project_members
project_levels
project_grids
project_elements
project_materials
project_versions

assignments
submissions
submission_versions

issues
issue_comments

assessments
assessment_scores
competencies
user_competencies

certificates
files
audit_logs
```

## 50. Table projects

```text
id UUID
organization_id UUID
owner_id UUID
training_program_id UUID nullable
title varchar
code varchar
description text
status varchar
unit varchar
schema_version varchar
settings jsonb
created_at
updated_at
deleted_at
```

## 51. Table project_levels

```text
id UUID
project_id UUID
name varchar
elevation integer
sort_order integer
created_at
updated_at
```

## 52. Table project_grids

```text
id UUID
project_id UUID
axis varchar
label varchar
position integer
created_at
updated_at
```

## 53. Table project_elements

```text
id UUID
project_id UUID
level_id UUID nullable
parent_id UUID nullable

type varchar
name varchar
code varchar nullable
ifc_class varchar nullable

geometry jsonb
transform jsonb
properties jsonb
metadata jsonb

material_id UUID nullable

created_by UUID
updated_by UUID

created_at
updated_at
deleted_at
```

## 54. API Base

```text
/api/v1
```

## 55. Project API

```text
GET    /projects
POST   /projects
GET    /projects/{id}
PUT    /projects/{id}
DELETE /projects/{id}
```

## 56. Level API

```text
GET    /projects/{id}/levels
POST   /projects/{id}/levels
PUT    /projects/{id}/levels/{level}
DELETE /projects/{id}/levels/{level}
```

## 57. Element API

```text
GET    /projects/{id}/elements
POST   /projects/{id}/elements
PUT    /projects/{id}/elements/{element}
DELETE /projects/{id}/elements/{element}
POST   /projects/{id}/elements/batch
```

Batch digunakan untuk autosave.

## 58. Operation API

Frontend sebaiknya mengirim perubahan sebagai operation.

```json
{
  "operations": [
    {
      "type": "UPDATE_ELEMENT",
      "id": "uuid",
      "payload": {}
    }
  ]
}
```

## 59. Version API

```text
GET  /projects/{id}/versions
POST /projects/{id}/versions
GET  /projects/{id}/versions/{version}
```

## 60. Validation API

```text
POST /projects/{id}/validate
```

Contoh response:

```json
{
  "valid": false,
  "score": 82,
  "errors": [],
  "warnings": [],
  "rules": []
}
```

## 61. Submission API

```text
POST /projects/{id}/submit
GET  /submissions/{id}
POST /submissions/{id}/review
POST /submissions/{id}/revision
POST /submissions/{id}/approve
```

## 62. IFC API

```text
POST /projects/{id}/ifc/import
POST /projects/{id}/ifc/export
GET  /ifc/jobs/{id}
```

Proses berat harus melalui queue.

## 63. File Upload

File:

- PDF drawing;
- image reference;
- template;
- IFC;
- issue attachment;
- learning document.

Gunakan signed upload URL ke object storage.

## 64. Frontend Structure

```text
src/
 |
 +-- app/
 +-- components/
 +-- pages/
 +-- services/
 +-- stores/
 +-- types/
 +-- utils/
 +-- features/
      +-- auth/
      +-- training/
      +-- project/
      +-- studio/
           +-- core/
           +-- elements/
           +-- commands/
           +-- geometry/
           +-- renderer/
           +-- snapping/
           +-- selection/
           +-- validation/
           +-- tools/
           +-- panels/
           +-- persistence/
```

## 65. Studio Core Structure

```text
studio/
 |
 +-- BIMDocument.ts
 +-- BIMElement.ts
 |
 +-- elements/
 |    +-- Wall.ts
 |    +-- Column.ts
 |    +-- Beam.ts
 |    +-- Slab.ts
 |    +-- Door.ts
 |    +-- Window.ts
 |
 +-- geometry/
 |    +-- WallGeometry.ts
 |    +-- ColumnGeometry.ts
 |    +-- BeamGeometry.ts
 |    +-- SlabGeometry.ts
 |
 +-- renderer/
 |    +-- BabylonRenderer.ts
 |
 +-- commands/
 +-- tools/
 +-- snapping/
 +-- validation/
```

## 66. Keyboard Shortcuts

```text
ESC       Cancel
DELETE    Delete
CTRL+Z    Undo
CTRL+Y    Redo
CTRL+S    Save
V         Select
W         Wall
C         Column
B         Beam
S         Slab
D         Door
N         Window
M         Measure
```

## 67. Camera

3D:

- orbit;
- pan;
- zoom;
- top;
- front;
- back;
- left;
- right;
- isometric.

2D:

- orthographic top camera.

## 68. Performance Target

Target MVP:

- nyaman sampai sekitar 1.000 BIM elements;
- 60 FPS ideal;
- minimum 30 FPS;
- project kecil load < 5 detik;
- autosave tidak freeze UI.

Optimasi:

- mesh pooling;
- instancing;
- debounce geometry regeneration;
- spatial index;
- lazy loading;
- Web Worker.

## 69. Web Worker

Pindahkan proses berat:

- validation;
- polygon calculation;
- large model diff;
- IFC parsing jika memungkinkan;
- geometry preparation.

## 70. Spatial Index

2D:

- Quadtree.

3D:

- Babylon picking;
- BVH/Octree jika dibutuhkan.

## 71. Audit Log

Catat:

- create element;
- update element;
- delete element;
- save;
- validation;
- submission;
- review;
- score change;
- issue change;
- certificate issuance.

## 72. Security

Minimum:

- HTTPS;
- Laravel Sanctum;
- RBAC;
- tenant isolation;
- backend validation;
- rate limiting;
- signed file URLs;
- MIME validation;
- CSRF protection;
- CSP;
- XSS protection;
- audit log.

## 73. Laravel Policies

Minimal:

- ProjectPolicy
- TrainingProgramPolicy
- SubmissionPolicy
- IssuePolicy
- AssessmentPolicy
- CertificatePolicy

## 74. Backup

Database:

- daily backup;
- minimum retention 30 hari.

Storage:

- object versioning;
- lifecycle rule.

## 75. Logging & Monitoring

- Laravel logs;
- queue logs;
- IFC worker logs;
- frontend error tracking;
- server monitoring.

Optional:

- Sentry.

## 76. Testing

### Backend

- Unit Test
- Feature Test
- API Test
- Policy Test
- Tenant Isolation Test

### Frontend

- Unit Test
- Component Test
- Integration Test

### BIM Engine

Test:

- wall geometry;
- column geometry;
- beam geometry;
- slab polygon;
- host relationship;
- snapping;
- undo/redo;
- serialization;
- deserialization;
- validation.

### E2E

Gunakan Playwright.

## 77. Geometry Test Example

Input:

```text
Wall
start: 0,0
end: 5000,0
thickness: 150
height: 3000
```

Expected:

```text
length = 5000
height = 3000
bounding box valid
volume valid
```

## 78. Data Integrity Test

Scenario:

```text
Create Model
 ↓
Save
 ↓
Reload
```

Semantic model sebelum dan sesudah reload harus sama.

## 79. Responsive Strategy

Desktop menjadi target utama modeling.

Target:

- minimum 1280 px;
- optimal 1440 px+.

Mobile hanya untuk:

- dashboard;
- belajar;
- quiz;
- project status;
- issue;
- review;
- certificate.

Full BIM authoring mobile tidak termasuk MVP.

## 80. Design System

Tone:

- property;
- architecture;
- engineering;
- premium;
- professional;
- modern.

Palette:

```text
Charcoal     #22272B
Warm White   #F7F5F1
Sand         #E8DFD2
Bronze       #B98542
Gold Accent  #C89C54
Olive Green  #66745B
Danger       #B94A48
```

## 81. Fase 0 — Foundation

Task:

- monorepo;
- Docker;
- Laravel;
- React;
- PostgreSQL;
- Redis;
- MinIO;
- auth;
- tenant;
- roles;
- permissions;
- CI/CD.

Acceptance:

- user login;
- organisasi tersedia;
- project dapat dibuat.

## 82. Fase 1 — BIM Studio Shell

Task:

- Babylon.js setup;
- 2D viewport;
- 3D viewport;
- camera;
- model tree;
- properties panel;
- toolbar;
- BIM document;
- dummy object selection.

Acceptance:

- BIM Studio terbuka;
- scene tampil;
- object dummy dapat dipilih;
- properties muncul.

## 83. Fase 2 — Level & Grid

Task:

- level CRUD;
- grid CRUD;
- grid rendering;
- snapping;
- active level.

Acceptance:

- user dapat membuat multi-level;
- user dapat membuat grid X/Y;
- object dapat snap ke grid.

## 84. Fase 3 — Wall

Task:

- WallTool;
- preview;
- length input;
- orthogonal mode;
- snap;
- geometry;
- properties;
- move;
- delete;
- undo/redo.

Acceptance:

- user dapat menggambar floor plan sederhana;
- wall tersimpan;
- wall reload dengan benar.

## 85. Fase 4 — Column & Beam

Task:

- column placement;
- column size;
- beam placement;
- beam snapping;
- properties.

Acceptance:

- structural frame sederhana dapat dibuat.

## 86. Fase 5 — Slab

Task:

- polygon draw;
- polygon close;
- thickness;
- geometry;
- validation.

Acceptance:

- user dapat membuat slab dari polygon tertutup.

## 87. Fase 6 — Door & Window

Task:

- host wall;
- placement;
- opening;
- width;
- height;
- sill height;
- reposition;
- delete.

Acceptance:

- door/window melekat ke wall;
- host relationship tersimpan.

## 88. Fase 7 — Persistence

Task:

- autosave;
- batch operations;
- local draft;
- recovery;
- save status.

Acceptance:

- refresh browser tidak menghilangkan model.

## 89. Fase 8 — Validation

Task:

- model validation;
- challenge rules;
- validation report;
- scoring.

Acceptance:

- sistem dapat mengecek aturan project.

## 90. Fase 9 — Training Integration

Task:

- BIM Lab;
- guided steps;
- challenge;
- template;
- assignment;
- project simulation.

Acceptance:

- lesson dapat membuka BIM Studio dengan task tertentu.

## 91. Fase 10 — Submission & Review

Task:

- version snapshot;
- submit;
- trainer review;
- issues;
- revision;
- resubmit.

Acceptance:

- trainer dapat mereview model dan membuat issue per object.

## 92. Fase 11 — Assessment & Competency

Task:

- rubric;
- auto score;
- trainer score;
- final score;
- skill matrix.

Acceptance:

- participant memiliki competency score.

## 93. Fase 12 — Certificate

Task:

- certificate template;
- QR;
- public verification;
- PDF export.

Acceptance:

- certificate dapat diverifikasi publik.

## 94. Fase 13 — IFC

Urutan implementasi:

1. IFC Viewer
2. IFC Property Reader
3. IFC Import
4. IFC Export
5. IFC Validation

Jangan memulai full round-trip IFC pada MVP awal.

## 95. IFC Mapping

```text
Level  -> IfcBuildingStorey
Wall   -> IfcWall
Column -> IfcColumn
Beam   -> IfcBeam
Slab   -> IfcSlab
Door   -> IfcDoor
Window -> IfcWindow
```

## 96. IFC Service Structure

```text
ifc-service/
 |
 +-- app/
 |    +-- main.py
 |    +-- import_ifc.py
 |    +-- export_ifc.py
 |    +-- validate_ifc.py
 |    +-- mapper.py
 |
 +-- tests/
 +-- Dockerfile
```

## 97. Project Template

Project template dapat berisi:

- levels;
- grids;
- materials;
- reference image;
- PDF drawing;
- starter model;
- challenge rules.

## 98. Learning Integration

Materi dapat memiliki tombol:

```text
Praktikkan Sekarang
```

Saat dibuka:

- BIM Studio aktif;
- project template dimuat;
- tool tertentu dapat otomatis aktif;
- instruction panel muncul.

Contoh:

```text
Materi: Membuat Wall

Instruction:
1. Klik Grid A1
2. Tarik ke Grid A4
3. Set thickness 150 mm
4. Set height 3000 mm
```

## 99. Gamification Future

Setelah core stabil:

- XP;
- level;
- badge;
- streak;
- leaderboard.

Badge contoh:

- First Wall
- First Model
- Zero Error
- BIM Modeler
- BIM Coordinator

## 100. Reporting

Trainer dashboard:

- participant progress;
- challenge completion;
- average score;
- competency distribution;
- issue count;
- revision count.

Organization dashboard:

- active participants;
- active classes;
- project completion;
- certificate issued.

## 101. Analytics Events

Track event:

- project_open;
- project_save;
- element_created;
- element_deleted;
- validation_run;
- challenge_started;
- challenge_completed;
- submission_created;
- issue_created;
- revision_completed;
- certificate_issued.

## 102. Repository Strategy

Gunakan monorepo:

```text
bim-platform/
 |
 +-- backend/
 +-- frontend/
 +-- ifc-service/
 +-- infrastructure/
 +-- docs/
 +-- PLAN.md
```

## 103. Git Strategy

```text
main
develop
feature/*
fix/*
```

Setiap fase harus memiliki commit yang jelas.

## 104. CI/CD

Pipeline:

```text
Lint
 ↓
Test
 ↓
Build
 ↓
Docker Image
 ↓
Deploy Staging
 ↓
Smoke Test
 ↓
Production Approval
```

Environment:

- local;
- staging;
- production.

## 105. Definition of Done

Feature dianggap selesai jika:

- implementation selesai;
- lint pass;
- test pass;
- error state ada;
- loading state ada;
- authorization benar;
- tenant isolation benar;
- audit requirement terpenuhi;
- acceptance criteria terpenuhi;
- dokumentasi diperbarui.

## 106. MVP Acceptance Criteria

MVP dianggap berhasil jika participant dapat:

1. login;
2. memilih program;
3. membuka BIM Lab;
4. membuka BIM Studio;
5. membuat project;
6. membuat level;
7. membuat grid;
8. menggambar wall;
9. membuat column;
10. membuat beam;
11. membuat slab;
12. menambah door;
13. menambah window;
14. melihat 2D;
15. melihat 3D;
16. mengubah properties;
17. undo/redo;
18. save;
19. reload model;
20. validate;
21. submit;
22. menerima review;
23. melihat issue;
24. melakukan revision;
25. resubmit;
26. mendapatkan score;
27. melihat competency;
28. mendapatkan certificate.

## 107. Prioritas

### P0 — Wajib

- authentication;
- multi-tenant;
- project;
- BIM document;
- level;
- grid;
- wall;
- 2D;
- 3D;
- save;
- undo/redo.

### P1 — Core Modeling

- column;
- beam;
- slab;
- door;
- window;
- snap;
- validation.

### P2 — Training

- BIM Lab;
- challenge;
- submission;
- issues;
- review;
- scoring;
- competency;
- certificate.

### P3 — Open BIM

- IFC viewer;
- IFC import;
- IFC export;
- advanced validation.

## 108. Risiko dan Mitigasi

### Geometry Complexity

Mitigasi:

- objek dibatasi;
- hindari family editor kompleks;
- geometry unit test wajib.

### Browser Performance

Mitigasi:

- batching;
- Web Worker;
- lazy rendering;
- spatial index;
- instancing.

### IFC Complexity

Mitigasi:

- IFC bukan dependency MVP;
- mulai dari viewer;
- mapping bertahap.

### Scope Creep

Mitigasi:

Jangan berubah menjadi proyek "Revit clone".

Fokus:

```text
Training-first BIM Modeler
```

## 109. Prinsip Engineering

1. Semantic first.
2. Geometry second.
3. Rendering third.
4. BIM data adalah source of truth.
5. Mesh tidak boleh menjadi data utama.
6. Semua BIM element serializable.
7. Semua edit harus undoable.
8. Semua project memiliki schema version.
9. IFC dikerjakan setelah internal model stabil.
10. UI harus sederhana dan cepat.
11. Training workflow adalah pembeda utama produk.

## 110. Roadmap Lanjutan

### V2

- IFC viewer;
- IFC import;
- IFC export;
- model comparison;
- advanced issue.

### V3

- Architecture;
- Structure;
- MEP viewer;
- coordination;
- clash detection.

### V4

- real-time collaboration;
- comments;
- presence;
- object locking.

### V5

- quantity takeoff;
- BOQ;
- 4D;
- 5D;
- AI BIM assistant.

## 111. AI Future

AI dapat membantu:

- menjelaskan validation error;
- memberikan hint;
- menghasilkan challenge;
- membuat assessment;
- memberikan feedback;
- mendeteksi modeling anomaly;
- membuat report.

AI tidak boleh mengubah model otomatis tanpa konfirmasi user.

## 112. Deliverable Teknis

MVP harus menghasilkan:

- source frontend;
- source backend;
- source IFC service;
- migrations;
- seeders;
- Docker config;
- API documentation;
- BIM schema documentation;
- test suite;
- deployment guide;
- user guide;
- trainer guide.

## 113. Prompt Induk Coding Agent

```text
Bangun BIM Training & Modeling Platform sesuai PLAN.md.

Prinsip utama:
- Laravel 13 sebagai backend API.
- React + TypeScript sebagai frontend.
- Babylon.js sebagai renderer 3D.
- PostgreSQL sebagai database.
- Redis untuk queue/cache.
- S3/MinIO untuk storage.
- FastAPI + IfcOpenShell untuk IFC service.
- BIM data menjadi source of truth.
- Jangan menyimpan Babylon mesh sebagai model utama.
- Semua BIM object wajib serializable.
- Semua perubahan model harus menggunakan Command Pattern.
- Aplikasi harus multi-tenant.
- Scope modeling awal hanya Level, Grid, Wall, Column, Beam, Slab, Door, Window.
- Kerjakan sesuai fase pada PLAN.md.
- Jangan mengerjakan fitur di luar scope sebelum P0 dan P1 stabil.
```

## 114. Urutan Prompt Coding Agent

Jangan membangun semuanya sekaligus.

Gunakan urutan:

```text
01 Foundation
02 Authentication + Multi Tenant
03 Project Management
04 BIM Studio Shell
05 BIM Document
06 Level
07 Grid
08 Wall
09 Persistence
10 Undo / Redo
11 Snap Engine
12 Column
13 Beam
14 Slab
15 Door
16 Window
17 Validation Engine
18 BIM Lab
19 Challenge
20 Submission
21 Issue
22 Trainer Review
23 Assessment
24 Competency
25 Certificate
26 IFC Viewer
27 IFC Import
28 IFC Export
```

Setiap tahap harus:

1. selesai;
2. diuji;
3. lint pass;
4. acceptance criteria terpenuhi;
5. di-commit;
6. baru lanjut tahap berikutnya.

## 115. Keputusan Arsitektur Final

```text
Frontend
React + TypeScript + Tailwind

BIM Studio
Custom BIM Core + Babylon.js

2D
Canvas + SVG/HTML Overlay

IFC Browser
web-ifc

Backend
Laravel 13

Database
PostgreSQL

Queue / Cache
Redis

Storage
S3 / MinIO

IFC Server
FastAPI + IfcOpenShell

Deployment
Docker + Ubuntu + Nginx
```

## 116. Batas Scope yang Harus Dijaga

> Kita tidak membuat Revit baru. Kita membuat BIM Modeler berbasis web yang sederhana, terstruktur, dan cukup kuat untuk proses belajar, latihan, simulasi proyek, penilaian, review, dan sertifikasi BIM.

## 117. Target MVP Produk

Target akhir MVP:

```text
Learning Platform
        +
Guided BIM Lab
        +
Browser BIM Modeler
        +
Auto Validation
        +
Trainer Review
        +
Competency Assessment
        +
Digital Certificate
```

Dengan struktur ini, produk sudah memiliki diferensiasi yang jelas dibanding LMS biasa dan tetap memiliki jalur teknis untuk berkembang menuju platform Open BIM yang lebih lengkap.
