# Indusync-Frontend

A modern web application built with Next.js, featuring user authentication, registration, and a dashboard interface.

## Features

- User Authentication
- Multi-step Registration Process
- Support for Business and Personal Accounts
- Responsive Design
- Modern UI with Tailwind CSS
- Form Validation with Zod
- Internationalization Support (German)

## Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with shadcn/ui
- **Form Handling:** Custom hooks with Zod validation
- **Authentication:** Custom auth implementation
- **Icons:** Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ErenCanYildirim/Indusync-Frontend.git
cd Indusync-Frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory and add your environment variables:

```env
NEXT_PUBLIC_API_URL=your_api_url
# Add other required environment variables
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Indusync-Frontend/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Login page
│   ├── registrieren/     # Registration page
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and types
├── public/             # Static assets
└── styles/             # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

# or

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking




## Contact


Project Link: [https://github.com/ErenCanYildirim/Indusync-Frontend.git](https://github.com/ErenCanYildirim/Indusync-Frontend.git)