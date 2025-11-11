# Lexicon - Daily Vocabulary Builder

## Overview

Lexicon is a vocabulary learning application that presents users with one advanced word per day. The application provides comprehensive information about each word including pronunciation, definitions, etymology, and contextual examples. Users can track their learning progress through statistics like daily streaks and total words learned. The app features a clean, educational-focused interface inspired by Duolingo's learning-centered design and Notion's information hierarchy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens

**Design System:**
- Uses a "new-york" style variant from shadcn/ui
- Custom color system with light/dark theme support via CSS variables
- Typography based on Inter font family from Google Fonts
- Spacing follows Tailwind's utility classes (4, 6, 8, 12 unit increments)
- Component-based architecture with reusable UI primitives

**Key UI Components:**
- `WordCard`: Displays the daily word with pronunciation and part of speech
- `EtymologyTimeline`: Expandable section showing word origin and evolution
- `ExampleSentences`: Shows contextual usage with highlighted vocabulary
- `ProgressStats`: Displays user metrics (streak, words learned, level)
- `PastWordsGrid`: Searchable grid of previously learned words

**State Management Approach:**
- Server state managed through React Query with custom query client
- UI state managed through React hooks and context (theme, mobile detection)
- No global Redux/Zustand store - relies on component composition and prop drilling where needed

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Custom Vite middleware integration for development
- RESTful API design pattern

**API Structure:**
- `/api/words/daily` - Fetches the daily word
- `/api/words` - Retrieves all words
- `/api/progress/stats` - Gets user progress statistics
- `/api/progress` - Manages user learning progress

**Data Layer:**
- Drizzle ORM configured for PostgreSQL
- Schema defines three main tables: users, words, user_progress
- In-memory storage implementation (`MemStorage`) for development/testing
- Database migrations managed through Drizzle Kit

**Word Data Source:**
- Curated word list stored in JSON format (`curated-words.json`)
- Integration with Dictionary API (`api.dictionaryapi.dev`) for fetching additional word data
- Fallback mechanism: curated data serves as primary source, API enriches when available

### Database Schema

**Tables:**

1. **users**
   - id (primary key, UUID)
   - username (unique)
   - password (hashed)

2. **words**
   - id (primary key, UUID)
   - word (text)
   - pronunciation (phonetic notation)
   - partOfSpeech (grammatical category)
   - definition (meaning)
   - etymology (word origin)
   - examples (array of usage examples)
   - difficulty (integer 1-10)
   - dateAdded (timestamp)

3. **user_progress**
   - id (primary key, UUID)
   - userId (foreign key to users)
   - wordId (foreign key to words)
   - learned (integer flag: 0 or 1)
   - dateViewed (timestamp)

**Design Decisions:**
- UUID primary keys for distributed-friendly IDs
- Array type for examples allows flexible storage of multiple usage contexts
- Difficulty scoring enables adaptive learning in future iterations
- Progress tracking separated to allow many-to-many user-word relationships

### Architectural Patterns

**Separation of Concerns:**
- `client/` - All frontend React code
- `server/` - Backend Express application
- `shared/` - Common TypeScript types and schemas (Zod validation)

**Type Safety:**
- Shared schema definitions using Drizzle Zod integration
- End-to-end type safety from database to frontend
- TypeScript strict mode enabled

**Development Workflow:**
- Vite dev server with HMR for rapid frontend development
- Express middleware mode allows single dev server
- Separate build processes for client (Vite) and server (esbuild)

**Error Handling:**
- Custom error overlay for development (Replit plugin)
- Query client configured to not refetch on window focus
- Toast notifications for user-facing errors

## External Dependencies

### Third-Party Services

**Dictionary API:**
- Service: `api.dictionaryapi.dev`
- Purpose: Fetch word definitions, pronunciations, and usage examples
- Fallback: Curated local JSON data if API unavailable
- No authentication required

### Database

**PostgreSQL (via Neon):**
- Connection: `@neondatabase/serverless` driver
- Configuration: Environment variable `DATABASE_URL`
- ORM: Drizzle for type-safe queries
- Migration strategy: Push-based using `drizzle-kit push`

### UI Component Libraries

**Radix UI Primitives:**
- Comprehensive set of headless UI components
- Provides accessible foundation for custom components
- Components include: Dialog, Dropdown, Popover, Tabs, Toast, and 20+ others

**shadcn/ui:**
- Component collection built on Radix UI
- Customizable through Tailwind config
- Components copied into project for full control

### Fonts and Assets

**Google Fonts:**
- Primary: Inter (weights 400, 500, 600, 700)
- Preconnect optimization for faster loading
- Fallback to system fonts

### Development Tools

**Replit Plugins:**
- `@replit/vite-plugin-runtime-error-modal` - Enhanced error display
- `@replit/vite-plugin-cartographer` - Code navigation
- `@replit/vite-plugin-dev-banner` - Development mode indicator

**Build Tools:**
- esbuild for server bundling (ESM format, node platform)
- Vite for client bundling with React plugin
- PostCSS with Tailwind and Autoprefixer

### Key Dependencies

**Data Fetching & Validation:**
- `@tanstack/react-query` - Async state management
- `zod` - Runtime type validation
- `drizzle-zod` - Schema validation integration

**Styling:**
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Component variant management
- `clsx` & `tailwind-merge` - Conditional class composition

**Date Handling:**
- `date-fns` - Date manipulation and formatting

**Routing:**
- `wouter` - Lightweight React router (alternative to React Router)