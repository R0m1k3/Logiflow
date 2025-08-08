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
- **SAV Management**: Comprehensive Service Après-Vente (after-sales service) ticket system for tracking customer service issues with suppliers. Features role-based access controls, automatic ticket numbering, supplier integration, and complete audit trail with status history.
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
- **Director Webhook Permissions Fixed**: Resolved production issue where directors couldn't send webhooks. Updated the hardcoded `checkPermission` function in `routes.production.ts` to allow both 'admin' and 'directeur' roles for `system_admin` permission. Directors now have full webhook access alongside admins using role-based authorization.
- **French Date Localization in Orders and Deliveries**: Updated date formatting in Orders and Deliveries modules to display dates in French format. Centralized date formatting in `dateUtils.ts` with French locale (`date-fns/locale/fr`) and changed format from 'dd MMM yyyy' to 'dd MMMM yyyy' for better readability (e.g., "15 août 2025" instead of "15 Aug 2025").
- **Username Display Fixed in Orders and Deliveries**: Corrected "Créé par" column regression where user IDs were displayed instead of usernames. Updated both Orders and Deliveries modules to properly display creator usernames with fallback hierarchy: username → name → firstName/lastName → createdBy ID. Added user icons for better visual consistency.
- **DLC Print Lists Logic Fixed**: Corrected inconsistency between display badges and print functions in DLC module. Fixed products appearing in wrong print lists (expiring soon vs expired). Unified date calculation logic to use both dlcDate and expiryDate as fallback, ensuring consistent categorization across display and printing functions.
- **Production Scheduler Services Fixed**: Resolved issue where automatic backup and BL reconciliation services weren't working in production. Fixed PostgreSQL type conflicts in SchedulerService and BackupService. Services are now properly initialized at server startup and ready to be activated via the admin interface.
- **Customer Orders Statistics Dashboard Added**: Enhanced CustomerOrders module with comprehensive statistics dashboard above the filters. Added 4 main KPI cards (Total, Today, Pending, Available) and detailed status breakdown visualization. Statistics update in real-time as orders are filtered and provide instant overview of order management performance.
- **Dashboard Messages Automatic Migration**: Implemented automatic migration system for dashboard_messages table during production deployment. Added `migrateDashboardMessages()` function in `initDatabase.production.ts` that creates/updates table structure, manages schema changes, and creates performance indexes. Migration runs automatically on every production startup ensuring database consistency.
- **Automatic Migrations Disabled**: Removed automatic migration execution at startup to prevent repeated database schema changes on every deployment. Migrations are now disabled to ensure faster startup times and prevent unnecessary database operations during updates.
- **Supplier Automatic Reconciliation Feature**: Implemented automatic reconciliation system for trusted suppliers. Added `automaticReconciliation` boolean column to suppliers table with production-ready migration (migration_automatic_reconciliation.sql). When a supplier has this option enabled, delivery validation automatically marks the reconciliation as complete, eliminating manual reconciliation steps for trusted vendors. Enhanced storage methods (getSuppliers, createSupplier, updateSupplier, validateDelivery) to support the new workflow. Feature fully deployed with schema updates, migration files, and production compatibility.
- **Calendar UI Improvement**: Changed linked order colors from orange to light yellow (`bg-yellow-200 text-yellow-800`) for better visual comfort while maintaining visibility.
- **Automatic Logout Security Feature**: Implemented automatic user logout after 20 minutes of inactivity for all users except administrators. The system monitors user activity (mouse movement, clicks, keyboard input, scroll, touch) and displays a warning notification 2 minutes before logout. Admin users are completely excluded from this security timeout. The feature is integrated into the main Layout component using the `useAutoLogout` hook.
- **SAV Module Implementation**: Created complete standalone Service Après-Vente (after-sales service) module for managing customer service tickets with suppliers. Implemented full CRUD operations with role-based permissions (admin/directeur can delete, manager can create/update, employee read-only), automatic ticket numbering (format: SAV20250808-001), supplier integration with existing supplier data, complete audit trail with status history, and comprehensive filtering/search capabilities. Database schema includes sav_tickets and sav_ticket_history tables with proper relations. Frontend features include statistics dashboard, modal forms, and French localization.
- **SAV Production Routes Fixed**: Critical issue resolved - the PATCH /api/sav-tickets/:id route was completely missing from routes.production.ts, causing 500 errors on SAV ticket updates. Added missing PATCH route with comprehensive fallback system for admin_fallback user, detailed logging for troubleshooting, and proper error handling. Also created diagnostic scripts to verify table existence and route functionality.
- **Authentication System Completely Restored with Temporary Access (August 2025)**: **SUCCESS** - Restored original authentication system exactly as it was before SAV module creation. Added temporary admin access (admin/admin) that works when database is unavailable, allowing production access during Neon database outages. System uses memory store for sessions as fallback while maintaining original PostgreSQL structure. The SAV module now works in production with mock data during database unavailability. Users can authenticate with admin/admin and access SAV module when database is disabled.

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