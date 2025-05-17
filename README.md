# Neighbourhood Wash

Neighbourhood Wash is a Next.js-based community marketplace connecting individuals seeking laundry services with local "Washers" who offer their laundry facilities. The platform enables users without laundry facilities to find local washers, while allowing washers to monetize their underutilized equipment.

## Project Overview

This project is built with:

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS (with a custom blue theme)
- Supabase (planned for backend services)

## Getting Started

First, ensure you have Node.js (version 20.x or later recommended) and pnpm installed.

1.  **Clone the repository (if you haven't already):**

    ```bash
    git clone https://github.com/devjoe1991/neighbourhood-wash.git
    cd neighbourhood-wash
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project by copying the example file (if one exists, typically `.env.example` - to be created later if needed).

    ```bash
    cp .env.example .env.local
    ```

    Update `.env.local` with your specific configuration (e.g., Supabase keys when integrated).

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

In the project directory, you can run:

- `pnpm dev`: Runs the app in development mode.
- `pnpm build`: Builds the app for production.
- `pnpm start`: Starts a production server.
- `pnpm lint`: Lints the codebase using Next.js's ESLint configuration.
- `pnpm format`: Formats the code using Prettier.

## Branching Strategy (Initial)

- `main`: This branch is for production-ready code. All development should happen in feature branches.
- `develop`: (Optional, for larger teams) A pre-production branch where features are merged before going to `main`.
- Feature branches: `feature/name-of-feature` (e.g., `feature/user-auth`)
- Bugfix branches: `bugfix/fix-description` (e.g., `bugfix/login-error`)

All pull requests should be reviewed before merging into `main` (or `develop`).

## Technology Choices & Setup

- **Framework**: Next.js 14 with App Router for server-side rendering, static site generation, and modern React features.
- **Language**: TypeScript for type safety and improved developer experience.
- **Styling**: TailwindCSS for utility-first CSS, with a custom theme configured in `tailwind.config.ts`.
- **UI Components**: Radix UI and shadcn/ui (to be integrated for pre-built, accessible components).
- **Backend**: Supabase (planned) for database, authentication, and other backend services.
- **Code Quality**: ESLint for linting, Prettier for code formatting.
- **Version Control**: Git and GitHub.
- **Package Manager**: pnpm.

## Project Structure

(A brief overview of the main directories as per the initial setup will be here. You can expand this later.)

- `app/`: Next.js 14 App Router structure (route groups for auth, landing, dashboard).
- `components/`: Reusable UI components (ui, layout, landing, forms, dashboard subdirectories).
- `lib/`: Utility functions (`utils.ts`) and shared code/constants (`constants.ts`).
- `public/`: Static assets (images, icons).
- `styles/`: Global stylesheets (`globals.css`) and TailwindCSS configuration.
- `types/`: TypeScript type definitions (`index.ts`).

## Next Steps

With the project initialized, the next phase involves developing the core landing pages and further UI components.
