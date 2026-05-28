# VedaAI 🛡️

**VedaAI** is an enterprise-grade, high-performance AI Assessment Creator platform built for modern educators. It enables teachers to configure assessments, generate syllabus-aligned question papers utilizing advanced LLMs, process document/image uploads via OCR, stream real-time progression over WebSockets, manage student groups, and export beautifully formatted, print-ready PDFs.

<p align="center">
  <strong>Decoupled, Resilient, Event-Driven Architecture for Digital Education</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="Build Status" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License" />
  <img src="https://img.shields.io/badge/React-19.0.0-61dafb.svg" alt="React 19" />
  <img src="https://img.shields.io/badge/Next.js-15.1.2-000000.svg" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/Node.js-22-339933.svg" alt="Node.js 22" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248.svg" alt="MongoDB" />
  <img src="https://img.shields.io/badge/BullMQ-Workers-E34F26.svg" alt="BullMQ" />
</p>

---

## 📑 Table of Contents
- [✨ Features Spotlight](#-features-spotlight)
- [🏗️ System Architecture & Data Flow](#️-system-architecture--data-flow)
- [🚀 Architectural & Design Decisions](#-architectural--design-decisions)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Structure](#-project-structure)
- [🔑 Demo Access](#-demo-access)
- [⚙️ Local Development Setup](#️-local-development-setup)
- [🐳 Docker Orchestration](#-docker-orchestration)
- [📡 API Mappings](#-api-mappings)
- [🌍 Production Deployment Guide](#-production-deployment-guide)
- [🔒 Security Hardening Status](#-security-hardening-status)

---

## ✨ Features Spotlight

| Feature | Tech | Benefit |
| :--- | :--- | :--- |
| **AI Assessment Generator** | Groq (`llama-3.3-70b-versatile`) | Builds verified, syllabus-aligned test papers in seconds. |
| **Contextual OCR Uploads** | Groq Vision / LLM | Upload reference PDFs or images to act as syllabus context. |
| **Decoupled Architecture** | BullMQ + Redis + Workers | Guaranteed backend uptime; no request timeouts during heavy LLM generation. |
| **Real-time Live Stream** | Socket.io + Redis Pub/Sub | Streams step-by-step progress from queueing to generation directly to the client. |
| **Multi-format PDF Generation**| pdf-lib (Server & Client side) | Generates pristine, print-ready PDFs with automatic pagination and margins. |
| **Clean Multi-tenant Workspace** | Zustand + Mongoose | Beautiful HSL colors, responsive sidebar layout, and absolute state persistence. |

---

## 🏗️ System Architecture & Data Flow

VedaAI is architected as a highly scalable, decoupled, multi-tier system. It separates lightweight API serving from computationally heavy AI parser background workers, guaranteeing rapid request processing and uninterrupted service even under peak assessment generation demands.

### Technical Architecture Diagram

```mermaid
flowchart LR
  %% Define Styles
  classDef frontend fill:#3178c6,stroke:#fff,stroke-width:2px,color:#fff;
  classDef backend fill:#4caf50,stroke:#fff,stroke-width:2px,color:#fff;
  classDef database fill:#ff9800,stroke:#fff,stroke-width:2px,color:#fff;
  classDef external fill:#9c27b0,stroke:#fff,stroke-width:2px,color:#fff;

  subgraph Client [Frontend Tier]
    UI["Next.js 15 UI"]:::frontend
  end

  subgraph Server [Backend Tier (Express.js)]
    API["API Gateway & Routes"]:::backend
    WS["Socket.io Server"]:::backend
    Worker["BullMQ Background Workers"]:::backend
  end

  subgraph DataLayer [Data Layer]
    DB[("MongoDB (Mongoose)")]:::database
    Redis[("Redis (Pub/Sub & Cache)")]:::database
    Queue["BullMQ Queue"]:::database
  end

  subgraph External [External Services]
    Groq["Groq LLM Engine"]:::external
    Vision["OCR / Vision API"]:::external
  end

  %% Connections
  UI -->|REST API Requests| API
  UI <-->|Real-time Streams| WS
  API -->|Read/Write Operations| DB
  API -->|Enqueue Jobs| Queue
  Queue <-->|Broker State| Redis
  Worker <-->|Process Jobs| Queue
  Worker -->|Socket Event Triggers| Redis
  Redis -->|Broadcasts| WS
  Worker -->|Persistent State Updates| DB
  Worker -->|JSON System Prompts| Groq
  API -->|Upload Parsers| Vision
```

### End-to-End Data Pipeline

```mermaid
sequenceDiagram
  autonumber
  actor T as Teacher
  
  box "Frontend Application" #F3F4F6
    participant FE as Next.js UI
  end
  
  box "Backend Services" #E0F2FE
    participant API as Express API
    participant W as AI Worker (BullMQ)
    participant S as Socket.io
  end

  box "Data & AI" #FEF3C7
    participant DB as MongoDB
    participant G as Groq LLM
  end

  T->>FE: Configure assignment & attach files
  FE->>API: POST /api/assignments (with contexts)
  
  rect rgb(240, 253, 244)
    Note right of API: Phase 1: Initialization
    API->>DB: Save assignment settings (Status: Queued)
    API->>W: Enqueue Question Generation Job
    API-->>FE: 201 Created (Assignment ID)
    FE->>S: Subscribe to Assignment Room
  end
  
  rect rgb(254, 252, 232)
    Note right of W: Phase 2: AI Processing
    W->>S: Broadcast: [Started] Event
    W->>G: Send Structural JSON Prompt & File Context
    G-->>W: Return Raw JSON Output
    W->>W: Run 4-Stage Zod Validation Pipeline
  end
  
  rect rgb(238, 242, 255)
    Note right of W: Phase 3: Post-Processing & Export
    W->>DB: Save generated Question Paper
    W->>W: Compile structured PDF via pdf-lib
    W->>DB: Save PDF buffer to Database
    W->>DB: Update Assignment (Status: Completed)
    W->>S: Broadcast: [Completed] Event
    S-->>FE: Trigger UI update & confetti
  end
```

---

## 🚀 Architectural & Design Decisions

### 1. Teacher-First UX Design
Every interaction is designed to minimize friction. Teachers configure an entire syllabus-aligned assignment in under 60 seconds and receive a complete, exam-ready paper with robust editing tools.

### 2. BullMQ-Powered Reliability
AI generation is offloaded to BullMQ workers, preventing API server blocks and enabling intelligent retry policies (exponential backoff) on transient LLM/network failures.

### 3. Rigorous Schema Validation Pipeline
Raw LLM output passes through a 4-stage pipeline before reaching your database, ensuring absolute structure integrity:
```text
Raw Output → JSON Extraction → Schema Validation → Question/Marks Verification → Database
```

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 App Router, React 19, TypeScript
- TailwindCSS, Framer Motion, lucide-react
- Zustand, React Hook Form, Zod
- Axios, Socket.io Client, react-hot-toast
- pdf-lib for client-side export

**Backend:**
- Node.js, Express, TypeScript
- MongoDB + Mongoose
- Redis + BullMQ
- Socket.io
- Groq SDK with `llama-3.3-70b-versatile`
- pdf-lib for backend PDF generation
- JWT auth with demo teacher credentials

---

## 📂 Project Structure

```text
VedaAI/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Redis, and environment configs
│   │   ├── controllers/     # Route request handlers
│   │   ├── middlewares/      # Auth security middleware, error handlers
│   │   ├── models/           # Mongoose schemas (User, Assignment, Paper, Log)
│   │   ├── queues/           # BullMQ queue & job definitions
│   │   ├── routes/           # Express API endpoints
│   │   ├── services/         # Core business logic & LLM generation pipes
│   │   ├── sockets/          # Socket.io connection systems
│   │   └── workers/          # BullMQ worker processes
│   └── .env.example
├── frontend/
│   ├── app/                  # Next.js App Router (Layouts & Pages)
│   ├── components/           # Reusable UI component libraries
│   ├── features/             # Business feature modules (Auth, Assignments)
│   ├── services/             # Axios and Socket connections
│   ├── store/                # Zustand State Stores
│   ├── types/                # Typescript Definitions
│   └── utils/                # Formatting and styling utils
└── docker-compose.yml
```

---

## 🔑 Demo Access

The platform includes demo credentials to quickly review features:

```text
Email: teacher@vedai.demo
Password: VedaAI@123
```
* With `NEXT_PUBLIC_DEMO_MODE=true`, these credentials unlock offline Zustand state simulation.
* With `NEXT_PUBLIC_DEMO_MODE=false`, the signup and login features authenticate against the live MongoDB cluster.

---

## ⚙️ Local Development Setup

### 1. Backend Server & Workers
```bash
cd backend
cp .env.example .env
# Edit backend/.env and append your GROQ_API_KEY
npm install
npm run dev

# (In a separate terminal tab) Run the background BullMQ Worker
npm run dev:worker
```

### 2. Frontend Application
```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_DEMO_MODE=false to enable database persistence
npm install
npm run dev
```

---

## 🐳 Docker Orchestration

You can spin up the entire cluster (MongoDB, Redis, API Server, Worker, Frontend) with a single command:
```bash
docker compose up --build
```
**Addresses**:
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:4000`
* **MongoDB**: `mongodb://localhost:27017/vedai`
* **Redis**: `redis://localhost:6379`

---

## 📡 API Mappings

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new teacher account |
| `POST` | `/api/auth/login` | Authenticate and receive JWT cookie |
| `GET` | `/api/auth/me` | Fetch active teacher profile |
| `POST` | `/api/assignments` | Create assessment and trigger AI generation |
| `GET` | `/api/assignments` | List all assignments for active teacher |
| `GET` | `/api/assignments/:id` | Fetch detailed assignment paper |
| `POST` | `/api/assignments/:id/regenerate` | Re-queue paper generation |
| `GET` | `/api/assignments/:id/pdf` | Download formatted PDF paper |
| `GET` | `/api/health` | Service Health check (DB + Cache status) |

---

## Environment Variables

**Backend:**
```bash
PORT=4000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/vedai
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-long-random-secret
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
RUN_WORKERS_IN_PROCESS=false
```

**Frontend:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_DEMO_MODE=true
```

---

## 🌍 Production Deployment Guide

VedaAI is deployed as an decoupled, multi-tier system. For a production deployment, prepare a **Frontend Web App** and a **Backend API Server**, along with managed database servers.

### 1. Databases
* **MongoDB**: Deploy a managed cluster using [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database).
* **Redis**: Provision high-performance Pub/Sub caching using [Upstash](https://upstash.com).

### 2. API Server & Workers (Render / Railway)
Deploy the backend directory as a Web Service. By default, VedaAI requires two separate processes (API and Worker), but for a free-tier compatible setup (like Render's Free Web Service), you can run them in the same process using `RUN_WORKERS_IN_PROCESS=true`.

* **Root Directory**: `backend`
* **Build Command**: `npm install && npm run build`
* **Start Command**: `npm run start`

**Required Environment Variables**:
```env
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-veda-frontend.vercel.app
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...
JWT_SECRET=your-production-jwt-secret-key-32-chars
GROQ_API_KEY=gsk_...
RUN_WORKERS_IN_PROCESS=true
```

### 3. Frontend App (Vercel)
Point your Vercel project to the `/frontend` root and add the backend variables:
```env
NEXT_PUBLIC_API_URL=https://your-backend-api.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend-api.onrender.com
NEXT_PUBLIC_DEMO_MODE=false
```
*Note: Make sure to update the backend's `FRONTEND_URL` environment variable with your Vercel URL once deployed to avoid CORS blocks.*

---

## 🔒 Security Hardening Status

- [x] **Strict Content-Security-Policies**: Integrated via `Helmet` middleware.
- [x] **CORS Origin Filtering**: Secured backend endpoints to trust only verified hosts.
- [x] **Zod Validation Layers**: Sanitizes all payload parameters on entry.
- [x] **Database Password Hashing**: Secured via robust Bcrypt (12-salt factors).
- [x] **HTTP-only Cookie Authorization**: Protects auth sessions from XSS risks.
