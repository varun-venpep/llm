# LMS Platform - Technical Documentation

This document provides a comprehensive overview of the technical architecture, database schema, and API structure of the LMS platform.

## 1. System Architecture

The platform is built as a **Multi-tenant SaaS** using the following stack:
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Deployment**: Optimized for Vercel/Node.js environments.

### Multi-Tenancy Implementation
Multi-tenancy is achieved via **subdomain-based isolation** managed in `src/middleware.ts`.
- **Super Admin**: Accessed via `admin.lvh.me` (Rewritten to `/admin`)
- **Tenant Workspaces**: Accessed via `[subdomain].lvh.me` (Rewritten to `/t/[subdomain]`)
- **Landing Page**: Root domain (Rewritten to `/landing`)

## 2. Database Schema

The database is managed via Prisma. The main entities are:

### Core Entities
- **Tenant**: Represents an institute or organization. Holds subdomain, branding, and plan limits.
- **User**: Unified user model with roles (`SUPER_ADMIN`, `TENANT_ADMIN`, `STUDENT`). 
- **Course**: The primary educational unit, belonging to a Tenant.
- **Module**: Sections within a Course.
- **Lesson**: Individual content pieces (Video, PPT, Text, Quiz).

### Resource Management
Resources can be attached at multiple levels:
- **Lesson Resource**: Specific to a single lesson.
- **Module Resource**: Shared across all lessons in a module.
- **Course Resource**: Global documents for the entire course.

### Engagement & Progress
- **Enrollment**: Links a Student to a Course.
- **LessonProgress**: Tracks completion status and last-watched position for videos/PPTs.
- **Quiz / Question / Option**: Structural components for assessments.
- **QuizAttempt**: Records student performance on quizzes.
- **Announcement**: Tenant-wide communications.

## 3. API Route Map

All API routes follow a structured naming convention:

### Super Admin (`src/app/api/admin/`)
- `GET /api/admin/stats`: Platform-wide analytics.
- `GET /api/admin/tenants`: Manage all registered tenants.

### Tenant Admin & Student (`src/app/api/t/[domain]/`)
Routes are scoped to the `[domain]` parameter extracted by the middleware.

| Route | Purpose |
|-------|---------|
| `/courses` | List and create courses. |
| `/courses/[courseId]` | Full course details (including modules/lessons). |
| `/resources` | Multi-level resource management (Create/Delete). |
| `/announcements` | Tenant announcements with unread tracking. |
| `/progress` | Progress calculation and updates. |
| `/generate-quiz` | Whisper AI automated quiz generation. |

## 4. Migrations & Development

### Local Development
1. **Schema Changes**: Modify `prisma/schema.prisma`.
2. **Sync DB**: Run `npx prisma db push` to synchronize the local database.
3. **Regenerate Client**: Run `npx prisma generate` to update types.

### Production
- Use `npx prisma migrate dev` during development to generate migration files.
- Run `npx prisma migrate deploy` in the CI/CD pipeline.

## 5. Key Features Logic

### Video Security
The platform implements native video controls to:
- Disable right-click and context menus.
- Restrict fast-forwarding (Linear playback enforcement).
- Hide download buttons.

### Progress Calculation
Progress is calculated dynamically:
- Denominator excludes inactive modules and lessons.
- Percentage is cached on the student dashboard for performance.
