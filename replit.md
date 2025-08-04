# LogiFlow - Replit Development Guide

## Overview
LogiFlow is a comprehensive logistics management platform for La Foir'Fouille retail stores. It centralizes order, delivery, customer order, inventory, and user administration across multiple store locations. The platform aims to streamline logistics operations, improve inventory accuracy, and enhance customer satisfaction for retail stores.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **UI/UX Decisions**: Responsive design for PC, tablet, and mobile; consistent color schemes (e.g., blue for focus elements); optimized layouts for different screen sizes; intuitive navigation with collapsing sidebar and smart tooltips.

### Backend
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM
- **Authentication**: Dual system (Replit Auth for dev, local auth for prod)
- **Session Management**: Express sessions with PostgreSQL storage
- **Security**: Rate limiting, input sanitization, security headers, PBKDF2 password hashing.

### Database
- **Primary Database**: PostgreSQL
- **Development**: Neon serverless PostgreSQL
- **Production**: Standard PostgreSQL in Docker containers
- **Schema**: Centralized in `shared/schema.ts`
- **Migrations**: Drizzle Kit

### Core Features
- **Authentication**: Secure dual authentication for development and production environments.
- **Multi-Store Management**: Global store context for data filtering, role-based access control (admin, manager, employee, directeur), and data isolation per store.
- **Business Entities**: Manages Orders (purchase orders, deliveries, status), Deliveries (tracking, completion), Customer Orders (POS, barcode generation), Suppliers (vendor info, history), and Publicities (marketing campaigns, store participation).
- **Invoice Verification**: Automated system for verifying invoices against delivery notes, including reconciliation and duplicate prevention.
- **Task Management**: Simplified task creation, assignment, and validation with status tracking and calendar integration.
- **DLC Management**: Comprehensive management of products with use-by dates, including status tracking, validation, and alerts.
- **Database Backup**: Automated daily backups and manual backup/restore capabilities with versioning.
- **Permission System**: Hardcoded 4-role system (Admin, Manager, Employee, Directeur) with granular permissions and dynamic sidebar based on user roles.

### Data Flow
- **Request Flow**: Client (React Query) -> Express middleware (auth, security) -> Route handlers (business logic) -> Drizzle ORM (DB operations) -> Client.
- **Authentication Flow**: Replit Auth (dev) / Username/password (prod) -> Secure session management -> Role-based authorization.
- **Data Synchronization**: Real-time updates with React Query, intelligent cache invalidation, and global store context for data filtering.

### Recent Fixes (February 2025)
- **Calendar Navigation Fixed**: Corrected date picker to open on current month (August) instead of staying on July. Added `defaultMonth={selectedDate || new Date()}` and forced component refresh with key prop.
- **Production Migration Error Fixed**: Disabled automatic database migrations in `server/index.production.ts` that were causing SSL connection errors and 502 errors on startup. The webhook_url column already exists in production database.
- **Modal Webhook Selector Fixed**: Resolved z-index issues with Facture/Avoir dropdown in webhook modal using `z-[70]`, `position="popper"`, and proper form reset.
- **Production Deployment Success**: Completely removed problematic auto-migration imports and calls from production server. Application now starts successfully without 502 errors. All database columns exist and no migrations are needed.
- **French Date Localization in Tasks Module**: Corrected all date displays in the Tasks module to show in French format using date-fns French locale. Applied formats "dd MMMM yyyy à HH:mm" for creation/completion dates and "dd MMMM yyyy" for due dates. Fixed TypeScript errors and null date handling with "Date inconnue" fallback.
- **CRITICAL Director Webhook Permissions Fixed**: Resolved production issue where directors couldn't send webhooks despite having correct database permissions. The `checkPermission` function in `routes.production.ts` was hardcoded to only allow admin users for `system_admin` permission, bypassing the database permission system. Replaced hardcoded role check with proper database permission verification using `getUserPermissions`. Directors now have full webhook access as intended.

## External Dependencies

### Frontend
- **UI Components**: Radix UI
- **Form Management**: React Hook Form, Zod
- **Date Handling**: date-fns
- **Query Management**: TanStack Query
- **Barcode Generation**: JsBarcode

### Backend
- **Database**: PostgreSQL (pg driver), Drizzle ORM
- **Authentication**: Passport.js (local strategy)
- **Session Storage**: connect-pg-simple
- **Security**: express-rate-limit, helmet (or equivalent)
- **Validation**: Zod
- **Cron Jobs**: node-cron (for scheduled tasks like backups)
- **Database Tools**: pg_dump/psql (for backups)

### Development
- **Build Tools**: Vite (with React plugin, TypeScript support)
- **Code Quality**: ESLint, TypeScript
- **Development Server**: Vite dev server (HMR, Replit integration)

### Integrations
- **NocoDB**: Configurable integration for invoice verification and data synchronization.
- **Webhook**: Configurable system for sending invoice data to external services (e.g., N8N) including PDF files.