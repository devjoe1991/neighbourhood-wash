# Technology Choices & Setup Instructions

This document outlines the key technology choices made for the Neighbourhood Wash project and provides detailed setup instructions beyond the basic README.

## Core Technologies

- **Next.js 14 (App Router)**: Chosen for its comprehensive features for building modern React applications, including server-side rendering, static site generation, routing, and API routes.
- **TypeScript**: For static typing, improving code quality and maintainability.
- **TailwindCSS**: A utility-first CSS framework for rapid UI development. Custom theme is configured in `tailwind.config.ts`.
- **pnpm**: Used as the package manager for efficiency and speed.

## Backend (Planned)

- **Supabase**: Intended for use as the backend-as-a-service, providing database, authentication, storage, and real-time capabilities.

## UI Components

- **Radix UI**: For unstyled, accessible primitive components.
- **shadcn/ui**: (To be added) For pre-built, customizable components based on Radix UI and TailwindCSS.

## Code Quality & Testing

- **ESLint**: For identifying and fixing code style issues and potential bugs.
- **Prettier**: For automated code formatting, integrated with `prettier-plugin-tailwindcss` for class sorting.
- **Husky & lint-staged**: For pre-commit hooks to enforce code quality.
- **Playwright**: For end-to-end testing.

## Detailed Setup

(Refer to `README.md` for initial setup. This section can be expanded with more specific environment setup details, e.g., Supabase integration steps once implemented.)
