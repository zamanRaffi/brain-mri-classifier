<div align="center">

# 🧠 MRI Prediction Platform

### AI-Powered Brain MRI Classification & Healthcare Management System

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TensorFlow.js-tfjs--node-FF6F00?logo=tensorflow&logoColor=white" alt="TensorFlow.js" />
  <img src="https://img.shields.io/badge/Auth.js-NextAuth_v5-000000" alt="Auth.js" />
</p>

A full-stack healthcare platform that combines **AI-powered MRI classification**, **explainable AI**, **doctor–patient collaboration**, and **secure role-based access** — all in one Next.js application, with model inference running **in-process** (no separate Python server).

Built with ❤️ by students of the Department of CSE, **Bangladesh University of Business and Technology (BUBT)**.

⭐ If you find this project useful, consider giving it a star.

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Authentication & Roles](#-authentication--roles)
- [Explainable AI (Grad-CAM)](#-explainable-ai-grad-cam)
- [Deployment Notes](#-deployment-notes)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Project Team](#-project-team)
- [Licensing & Ownership](#-licensing--ownership)
- [Disclaimer](#-disclaimer)
- [Contact](#-contact)

---

## 📖 Overview

**MRI Prediction Platform** is an AI-powered healthcare web app for automated brain MRI analysis and patient–doctor management.

Instead of shipping a separate Python inference server, the platform loads a trained TensorFlow.js model directly inside the **Next.js backend** (`@tensorflow/tfjs-node`) and serves predictions from a standard API route — keeping the deployment simple and self-contained.

Patients and doctors interact through one shared ecosystem:

- Brain MRI upload & classification
- Grad-CAM visual explanations
- Prediction history & doctor review workflow
- Appointment booking
- Secure in-app chat
- Role-based dashboards

---

## ✨ Key Features

<table>
<tr>
<td valign="top" width="50%">

### 🤖 AI Brain MRI Classification
- In-process TensorFlow.js inference (no Python backend)
- 4-class prediction: Glioma, Meningioma, Pituitary, No Tumor
- Confidence score + full probability distribution
- Low-confidence / inconclusive detection
- Persisted prediction history per patient

### 📊 Explainable AI
- Grad-CAM heatmap generated per prediction
- Highlights the image regions driving the model's decision
- Shown on the result page, patient history, and doctor reports

</td>
<td valign="top" width="50%">

### 👤 Patient Portal
- Register / login securely
- Upload MRI scans & view results
- Browse prediction history
- Book appointments with doctors
- Chat with assigned doctors

### 👨‍⚕️ Doctor Portal
- Review patient MRI predictions
- Approve / reject / flag predictions for review
- Inspect Grad-CAM visualizations
- Manage appointments & chat with patients

</td>
</tr>
</table>

### 🔒 Security
Auth.js authentication · hashed passwords · JWT sessions · role-based middleware · protected API routes · Prisma-parameterized queries (SQL-injection safe)

---

## 🎯 How It Works

```text
 Patient Login → Upload MRI → TensorFlow.js Model
                                     │
                       ┌─────────────┴─────────────┐
                       ▼                            ▼
              Predicted Class +               Grad-CAM Heatmap
              Confidence Score
                       │                            │
                       └─────────────┬──────────────┘
                                     ▼
                     Saved to PostgreSQL (via Prisma)
                                     │
                       ┌─────────────┴─────────────┐
                       ▼                            ▼
              Patient Dashboard              Doctor Dashboard
           (history, appointments,        (review predictions,
                chat with doctor)           Grad-CAM, chat)
```

**Prediction pipeline in detail:**

`MRI upload` → `validation` → `resize to 224×224` → `TensorFlow.js inference` → `softmax + confidence`→ `Grad-CAM overlay` → `saved to PostgreSQL` → `rendered on dashboard`

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────────┐
                         │   Browser (Patient/Doctor) │
                         └─────────────┬─────────────┘
                                       ▼
                         ┌──────────────────────────┐
                         │  Next.js App Router (UI)  │
                         └─────────────┬─────────────┘
                                       │
        ┌──────────────────────────────┼───────────────────────────────┐
        ▼                              ▼                                ▼
  Auth API (Auth.js)          Prediction API (tfjs-node)        Appointment / Chat API
        │                              │                                │
        └──────────────┬───────────────┴────────────────┬───────────────┘
                        ▼                                ▼
                PostgreSQL (Prisma ORM)          TensorFlow.js Model
                                                  (ml-model/brain-tumor-model)
```

---

## 📂 Project Structure

```text
mri-platform/
├── ml-model/brain-tumor-model/   # model.json + sharded weights (.bin)
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/
│   ├── uploads/                  # user-uploaded scans + Grad-CAM images
│   └── images/, icons/
├── src/
│   ├── app/
│   │   ├── api/                  # route handlers: predict, signup, auth,
│   │   │                         #   appointments, chat, profile, notifications
│   │   ├── patient/               # dashboard, predict-mri, history, chat,
│   │   │                         #   book-appointment, profile
│   │   ├── doctor/                # dashboard, patient-reports, appointments,
│   │   │                         #   chat, profile
│   │   ├── login/, signup/, about/, contact/
│   │   └── page.tsx
│   ├── components/               # ui/, forms/, dashboard/, navbar/, shared/
│   ├── lib/
│   │   ├── model.ts              # loads & runs the TF.js model
│   │   ├── gradcam.ts            # Grad-CAM heatmap generation
│   │   ├── tfjs-custom-layers.ts
│   │   ├── prisma.ts
│   │   └── validation.ts
│   ├── middleware.ts             # role-based route protection
│   ├── auth.ts / auth.config.ts  # Auth.js configuration
│   └── types/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Authentication | Auth.js / NextAuth v5 |
| AI Inference | TensorFlow.js — `@tensorflow/tfjs-node` |
| Explainability | Custom Grad-CAM implementation |
| Validation | Zod |
| Charts | Recharts |
| PDF export | jsPDF |

---

## 🗄️ Database Schema

Built with **Prisma ORM** on **PostgreSQL**.

```mermaid
erDiagram
    USER ||--o{ PREDICTION : "uploads"
    USER ||--o{ APPOINTMENT : "books (as patient)"
    USER ||--o{ APPOINTMENT : "attends (as doctor)"
    USER ||--o{ CHATMESSAGE : "sends"
    USER ||--o{ CHATMESSAGE : "receives"

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        Role role
        string phone
        string specialization
        string bio
    }

    PREDICTION {
        string id PK
        string patientId FK
        string imageUrl
        string gradCamUrl
        PredictionResult result
        float confidence
        json probabilities
        DoctorPredictionStatus doctorStatus
        datetime createdAt
    }

    APPOINTMENT {
        string id PK
        string patientId FK
        string doctorId FK
        datetime scheduledAt
        AppointmentStatus status
        string reason
    }

    CHATMESSAGE {
        string id PK
        string senderId FK
        string receiverId FK
        string content
        boolean read
        datetime createdAt
    }
```

| Model | Purpose |
|---|---|
| `User` | Patient & doctor accounts, role, profile fields |
| `Prediction` | Scan URL, predicted class, confidence, probabilities, Grad-CAM URL, doctor review status |
| `Appointment` | Patient ↔ doctor scheduling, status |
| `ChatMessage` | Doctor–patient messages, read state |

**Prediction classes:** `GLIOMA` · `MENINGIOMA` · `PITUITARY` · `NO_TUMOR` · `INCONCLUSIVE` (returned when the model's confidence is too low to commit to a class)

**Doctor review states:** `PENDING` · `APPROVED` · `REJECTED` · `NEEDS_REVIEW`

---

## ⚙️ Getting Started

### 1. Clone & install

```bash
git clone https://github.com/zamanRaffi/mri-platform.git
cd mri-platform
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root (see [Environment Variables](#-environment-variables) below).

Generate a secure secret:

```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run the dev server

```bash
npm run dev
```

Visit **http://localhost:3000**

### Other useful commands

```bash
npm run build                              # production build
npm start                                  # run production build
npx prisma migrate dev --name <name>       # create a new migration
npx prisma migrate reset                   # reset the database
```

---

## 🔑 Environment Variables

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/mri_platform"

# Auth.js
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

> ⚠️ This repo currently ships a `.env` for local development but no `.env.example` template — copy the block above into your own `.env` file rather than running `cp .env.example .env`.

---

## 🔐 Authentication & Roles

Authentication is handled by **Auth.js**, with JWT sessions and hashed passwords (`bcryptjs`).

`src/middleware.ts` enforces role-based access at the route level:

| Role | Access |
|---|---|
| 👤 Patient | `/patient/*` |
| 👨‍⚕️ Doctor | `/doctor/*` |

An authenticated user who hits a route outside their role is redirected to their own dashboard; an unauthenticated user is redirected to `/login`.

---

## 🔥 Explainable AI (Grad-CAM)

Every prediction is paired with a **Grad-CAM heatmap** (`src/lib/gradcam.ts`), highlighting the regions of the scan that most influenced the model's decision. This is generated as a best-effort step — if Grad-CAM generation fails, the prediction itself is still saved, so a transient rendering issue never blocks a result from reaching the patient.

Heatmaps are shown on:
- The prediction result page
- Patient prediction history
- Doctor review / patient reports

---

## 🌍 Deployment Notes

- Compatible with any Node.js host: **Vercel, Railway, Render, DigitalOcean, or a plain VPS**.
- Uploaded MRI images and Grad-CAM outputs are currently written to the **local filesystem** (`public/uploads/`). For serverless/production deployments, swap this for object storage (AWS S3, Cloudinary, Supabase Storage) since local disk doesn't persist across invocations on platforms like Vercel.
- Make sure the `ml-model/brain-tumor-model/` files are deployed alongside the app and remain accessible to the inference code in `src/lib/model.ts`.

---

## 🚀 Roadmap

**AI**
- [ ] Multi-model ensemble prediction
- [ ] MRI image segmentation
- [ ] DICOM support
- [ ] Confidence calibration
- [ ] Automated clinical report generation

**Healthcare**
- [ ] Video consultation
- [ ] Email notifications
- [ ] Prescription management
- [ ] Doctor verification
- [ ] Electronic Health Record (EHR) support
- [ ] Admin dashboard

**Platform**
- [ ] Docker support
- [ ] CI/CD pipeline
- [ ] Cloud storage integration
- [ ] Real-time chat via WebSockets
- [ ] Mobile app
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions, feature suggestions, and bug reports are welcome.

```bash
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature
```

Then open a Pull Request.

---

## 👥 Project Team

| Name | Responsibilities |
|---|---|
| **Raffi Zaman** | Full-stack development — frontend, backend, database design, authentication, API development, TensorFlow.js integration, Grad-CAM integration, UI/UX, and deployment |
| **Md. Jony Islam** | Brain MRI classification model — development, training, evaluation, and TF.js conversion |
| **Ahanaf Ibant Abani** | Academic project member |
| **Surovi Rani** | Academic project member |
| **Entezer Ahmed** | Academic project member |

Developed as an academic group project in the Department of Computer Science & Engineering, **Bangladesh University of Business and Technology (BUBT)**.

---

## 📄 Licensing & Ownership

This repository bundles two components with distinct ownership:

- **Application source code** (web app, backend, UI, auth, database integration, TF.js integration) — developed primarily by **Raffi Zaman**.
- **Brain MRI classification model** — developed and trained by **Md. Jony Islam**, included here with permission for academic/research use. Ownership of the trained model remains with its original author; get in touch with them before reusing or redistributing it elsewhere.

---

## ⚠️ Disclaimer

This project was built for **academic and research purposes**. Predictions generated by this platform are **not a substitute for professional medical diagnosis** — always consult a qualified healthcare professional for clinical decisions.

---

## 📬 Contact

**Raffi Zaman** — CSE, BUBT
GitHub: [@zamanRaffi](https://github.com/zamanRaffi) · Email: raffizaman7@gmail.com

**Md. Jony Islam** — CSE, BUBT
Email: 22235103399@cse.bubt.edu.bd

<div align="center">

---

**Made by the MRI Prediction Platform Team**
⭐ Thank you for visiting this repository!

</div>
