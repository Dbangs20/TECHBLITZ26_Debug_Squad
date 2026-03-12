# ClinicFlow

ClinicFlow is a full-stack scheduling operating system for clinics with doctor and receptionist workflows, conflict-aware appointment booking, waitlist management, queue visibility, and schedule optimization insights.

## Stack

- Frontend: Next.js 14, React, Tailwind CSS, Framer Motion
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- Auth: JWT

## Local development

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.example` to `frontend/.env.local`

3. Run the app:

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Deployment

- Frontend is prepared for Vercel.
- Backend is prepared for Render or Railway.
