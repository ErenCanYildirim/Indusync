# InduSync Website – Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)  
2. [Current Project Status](#current-project-status)  
3. [Prerequisites & Setup](#prerequisites--setup)  
4. [Environment Variables](#environment-variables)  
5. [Folder & Module Structure](#folder--module-structure)  
6. [Technology Stack & Architecture](#technology-stack--architecture)  
7. [Routing & Pages](#routing--pages)  
8. [Shared Components](#shared-components)  
9. [Custom Hooks & Data Layer](#custom-hooks--data-layer)  
10. [API Integration & Extending Services](#api-integration--extending-services)  
11. [Adding New Features](#adding-new-features)  
12. [Styling & Theming](#styling--theming)  
13. [Internationalization (i18n)](#internationalization-i18n)  
14. [State Management & Global Context](#state-management--global-context)  
15. [Testing & Linting](#testing--linting)  
16. [Building, Deployment & CI/CD](#building-deployment--ci-cd)  
17. [Troubleshooting & Resources](#troubleshooting--resources)

---

## Project Overview
InduSync is a business-oriented web application that allows companies to register, create projects, and manage orders.  
Key user flows:
- **Visitor**: Browse landing pages, About Us, Services, Contact  
- **Registration**: Multi-step company signup with validation  
- **Authentication**: Login / Logout with NextAuth.js  
- **Dashboard**: Overview of projects and orders, metrics charts  
- **Project & Order Management**: Create, view, filter, and update orders  

---

## Current Project Status
Authentication and routing are complete. Main features implemented:
- **User Authentication**  
  - NextAuth.js + custom `use-auth` hook  
  - Pages: `/login`, `/registrieren`  
- **Landing & Marketing Pages**  
  - Components in `components/landing/*`: Hero, Services, Testimonials, Contact  
- **Dashboard**  
  - Layout: `app/dashboard/layout.tsx`  
  - Routes: `/dashboard`, `/dashboard/auftraege`, `/dashboard/auftraege/[id]`  
  - Data fetching via React Query and hooks (`use-orders`, `use-projects`)  
  - Charts: `components/dashboard-chart.tsx` (Chart.js)  
- **Project Creation**  
  - Multi-step form: `components/project-creation-stepper.tsx`  
  - Uses Zod for schema validation  
- **Order Management**  
  - Forms and filtering in `hooks/use-orders`, UI in `app/dashboard/auftraege/*`  
- **Internationalization**  
  - English & German translations in `lib/i18n/translations.ts`  
  - Hook: `use-translations`  
- **Theming**  
  - Light/Dark mode via `components/theme-provider.tsx` and Tailwind config  
- **Error Handling & Notifications**  
  - Use Sonner toast (`components/ui/toaster.tsx`)  
- **Utilities**  
  - `lib/utils.ts` for common helpers  
  - `lib/validation.ts` for Zod schemas  

---

## Prerequisites & Setup
1. Node.js ≥ 18.x and pnpm ≥ 7.x  
2. Clone repository:  
   ```bash
   git clone https://github.com/ErenCanYildirim/Indusync-Frontend.git
   cd Indusync-Frontend
   pnpm install
   ```  
3. Copy and populate environment file:  
   ```bash
   cp .env.example .env.local
   ```  
4. Run development server:  
   ```bash
   pnpm dev
   # http://localhost:3000
   ```

---

## Environment Variables
Set in `.env.local`:
- NEXTAUTH_URL=http://localhost:3000  
- DATABASE_URL=postgresql://user:pass@host:port/db  
- API_BASE_URL=https://api.your-backend.com  
- NEXTAUTH_SECRET=your-secret  
- (Any third-party keys)

---

## Folder & Module Structure
```
/app
  globals.css, layout.tsx, page.tsx, not-found.tsx
  /login, /registrieren, /agb, /datenschutz, /auftrag-erstellen
  /dashboard/[...]
/components
  /landing    static marketing components
  /ui         Radix/Shadcn primitives & wrappers
  dashboard-*, main-nav.tsx, mobile-nav.tsx, theme-provider.tsx
/hooks
  use-auth.tsx, use-orders.ts, use-projects.ts, use-form.ts, use-toast.ts, ...
/lib
  api.ts           HTTP client (axios/fetch wrapper)
  projects-service.ts, orders-service.ts
  utils.ts, validation.ts
  /types           Type definitions (company, project, order, registration)
/public            static assets (images, icons)
/styles            global and theme styles
next.config.mjs
tailwind.config.ts
tsconfig.json
package.json
pnpm-lock.yaml
```

---

## Technology Stack & Architecture
- **Framework**: Next.js 13.x (App Router)  
- **Language**: TypeScript 5.x  
- **Styling**: Tailwind CSS 3.x, Radix UI & Shadcn/ui primitives  
- **Data**: React Query, axios/fetch wrapper in `lib/api.ts`  
- **Validation**: Zod schemas in `lib/validation.ts`  
- **Auth**: NextAuth.js + `use-auth` hook  
- **Visualization**: Chart.js via `components/dashboard-chart.tsx`  
- **CI/CD**: GitHub Actions (lint, test, build, deploy)  

---

## Routing & Pages
| Route                          | Description                                |
| ------------------------------ | ------------------------------------------ |
| `/`                            | Landing page (`app/page.tsx`)              |
| `/login`                       | Login page                                 |
| `/registrieren`                | Registration stepper                       |
| `/agb`, `/datenschutz`, `/fachbereiche` | Static informational pages       |
| `/dashboard`                   | Dashboard shell & metrics overview         |
| `/dashboard/auftraege`         | Orders list                                |
| `/dashboard/auftraege/[id]`    | Order detail view                          |
| `/auftrag-erstellen`           | Project/order creation wizard              |

---

## Shared Components
- **UI Primitives**: `components/ui/*` (Button, Input, Dialog, Table)  
- **Layout**: `components/dashboard-layout.tsx`, `components/dashboard-shell.tsx`  
- **Navigation**: `components/main-nav.tsx`, `components/mobile-nav.tsx`  
- **Forms & Steppers**: `registration-stepper.tsx`, `project-creation-stepper.tsx`  

---

## Custom Hooks & Data Layer
| Hook                 | Service                   | Description                          |
| -------------------- | ------------------------- | ------------------------------------ |
| use-auth             | NextAuth API              | Authentication state & helpers       |
| use-projects         | projects-service.ts       | Fetch list of projects               |
| use-orders           | orders-service.ts         | Fetch and mutate orders              |
| use-form-data        | —                         | Form state management                |
| use-toast            | —                         | Sonner toast notifications           |

Services export functions like `getProjects()`, `createOrder()`, `updateOrder()`. They use `http` from `lib/api.ts`:
```ts
export async function getProjects(): Promise<Project[]> {
  return http.get('/projects');
}
```

---

## API Integration & Extending Services
1. **Define Type**: Add interface in `lib/types/<domain>.ts`:  
   ```ts
   export interface Customer { id: string; name: string; ... }
   ```
2. **Service**: In `lib/<domain>-service.ts`, add method:  
   ```ts
   import { http } from './api';
   import { Customer } from './types';

   export async function fetchCustomers(): Promise<Customer[]> {
     return http.get('/customers');
   }
   ```
3. **Hook**: Create `hooks/use-customers.ts`:  
   ```ts
   import { useQuery } from '@tanstack/react-query';
   import { fetchCustomers } from '../lib/customers-service';
   export function useCustomers() { return useQuery(['customers'], fetchCustomers); }
   ```
4. **Consume**: Use in a component:  
   ```tsx
   const { data, isLoading, error } = useCustomers();
   if (isLoading) return <Spinner />;
   ```

---

## Adding New Features
1. Update routes under `app/` or `components/`.  
2. Add types and service methods for any backend changes.  
3. Create or extend hook in `hooks/`.  
4. Update navigation (`main-nav`, mobile menu).  
5. Write UI with Tailwind and Shadcn primitives.  
6. Add tests (recommended Jest + React Testing Library).  
7. Commit using Conventional Commits.

---

## Styling & Theming
- Global styles: `app/globals.css`  
- Tailwind config: `tailwind.config.ts` (extend colors, fonts)  
- Theme context: `components/theme-provider.tsx` (switch light/dark)

---

## Internationalization (i18n)
- Language files: `lib/i18n/translations.ts`  
- Hook: `use-translations()`  
- Wrap pages or components with locale switcher (`components/landing/LanguageSwitcher.tsx`)

---

## State Management & Global Context
- **Local**: React `useState` / `useReducer`  
- **Server**: React Query caches & mutations  
- **Global**: Context in `components/dashboard-shell.tsx` for auth and user data  

---

## Testing & Linting
- **Unit & Integration**: Jest + React Testing Library  
- **Lint**: ESLint (`pnpm lint`)  
- **Format**: Prettier (`pnpm format`)  

---

## Building, Deployment & CI/CD
- **Build**: `pnpm build` ➔ `.next/`  
- **Deployment**: Vercel (recommended) or custom Node server  
- **CI**: GitHub Actions config in `.github/workflows/` (lint, test, build, deploy)

---