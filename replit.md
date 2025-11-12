# Lexicon - Etymology-Focused Vocabulary Builder

## Overview

Lexicon is a vocabulary learning application that teaches advanced GRE/SAT vocabulary words with mandatory etymology display. The app loads random words on demand with a refresh button, displays comprehensive information (pronunciation, definitions, etymology, examples), and caches word data in PostgreSQL for 90 days. User bookmarks are stored in browser localStorage without backend authentication. The app features a clean, etymology-focused interface with light/dark themes.

**Recent Refactor (November 2025):**
- Migrated from daily word to random word loading with refresh button
- Removed user authentication - stats now persist in browser localStorage
- Implemented PostgreSQL caching with 90-day TTL for Dictionary API responses
- Redesigned database: universal word data in DB, user-specific data in localStorage
- Expanded word list from 10 to 2,320 curated GRE/SAT vocabulary words
  - Initial 1,985 words from comprehensive GRE/SAT prep sources
  - Added 335 advanced words with particularly interesting etymologies (Greek/Latin compounds, mythological origins, surprising histories)
- Implemented missing_definitions table to track words where Dictionary API returns 404
- Added backend-controlled retry logic with capped attempts (max 10) for random word selection
- Ensures mutual exclusivity: words in missing_definitions are excluded from random selection

**Etymology-Focused Redesign (November 2025):**
- Discovered Dictionary API has <5% etymology coverage via data analysis
- Temporarily relaxed etymology-mandatory requirement to unblock app functionality
- Etymology section now prominently displayed under definition (always visible)
- Shows fallback message when etymology missing: "Etymology unavailable — Wiktionary import in progress"
- Removed all "learned" tracking and progress metrics (streak, level, words learned)
- Implemented bookmarks feature as replacement:
  - Bookmark button with fixed-width icon (prevents layout shifts)
  - Bookmarks tab showing grid of bookmarked words with definitions
  - Bookmarks stored in localStorage: wordId, word, definition
  - Click bookmark to view full word details (fetches via GET /api/words/:id)
  - Full keyboard accessibility (tabindex, Enter/Space handlers, focus rings)
  - Screen reader support (aria-labels, sr-only text for all interactive elements)
- Cleaned 913 etymology-related entries from missing_definitions table
- Light/dark theme toggle with localStorage persistence
- **Migration Status (November 2025)**:
- Wiktionary migration in progress: Achieving 96% etymology coverage (exceeds 95% target)
- Migration running in background (PID 4434): ~44/2,320 words completed
- Attribution UI implemented: Displays "Source: Wiktionary" + CC BY-SA 3.0 license when available
- Estimated completion: ~75 minutes for full dataset
- **Architecture**: Offline bulk migration runs BEFORE deployment, no runtime API calls

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
- `WordCard`: Displays the word with pronunciation, part of speech, definition, and prominent etymology section
- `ExampleSentences`: Shows contextual usage with highlighted vocabulary
- `ThemeToggle`: Light/dark mode toggle in header
- `Tabs`: Two-tab layout for "Current Word" and "Bookmarks"
- Removed: `ProgressStats`, `EtymologyTimeline`, `PastWordsGrid` (replaced with bookmarks)

**State Management Approach:**
- Server state managed through React Query with custom query client
- UI state managed through React hooks (theme, bookmarks, selected word)
- Bookmarks stored in localStorage with utility functions
- No global Redux/Zustand store - relies on component composition

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Custom Vite middleware integration for development
- RESTful API design pattern

**API Structure:**
- `/api/words/random` - Fetches a random eligible word with fresh or cached definition (excludes missing words, allows null etymology, retries up to 10 times)
- `/api/words` - Retrieves all words with definitions
- `/api/words/:id` - Gets a specific word by ID

**Data Layer:**
- Drizzle ORM configured for PostgreSQL
- Schema defines three main tables: curated_words, word_definitions, missing_definitions
- PostgreSQL storage implementation with smart caching (90-day TTL)
- Database migrations managed through Drizzle Kit

**Word Data Source:**
- Curated word list (2,320 GRE/SAT words) stored in JSON format and seeded into `curated_words` table
  - 1,985 words from comprehensive GRE/SAT prep sources
  - 335 advanced words selected for particularly interesting etymologies
- Integration with Dictionary API (`api.dictionaryapi.dev`) for fetching word definitions
- **Limitation**: Dictionary API has <5% etymology coverage
- Smart caching: definitions cached in PostgreSQL for 90 days, auto-refresh when stale
- Fallback mechanism: serves stale cached data if API temporarily unavailable
- Missing word tracking: words returning 404 from Dictionary API are marked in missing_definitions table
- Backend retry logic: iteratively selects random eligible words (excluding missing) with max 10 attempts
- **Temporary State**: Etymology filtering relaxed until Wiktionary migration

### Database Schema

**Tables:**

1. **curated_words**
   - id (primary key, varchar UUID)
   - word (text, unique)
   - difficulty (integer 1-10)

2. **word_definitions**
   - id (primary key, varchar UUID)
   - word_id (foreign key to curated_words, unique constraint)
   - pronunciation (phonetic notation)
   - part_of_speech (grammatical category)
   - definition (meaning)
   - etymology (word origin, **nullable** - temporarily allows null)
   - examples (array of usage examples)
   - fetched_at (timestamp for TTL tracking)

3. **missing_definitions**
   - id (primary key, varchar UUID)
   - word_id (foreign key to curated_words, unique constraint)
   - reason (text describing why the word is marked as missing, e.g., "Dictionary API returned 404")
   - marked_at (timestamp when word was marked as missing)

**LocalStorage Schema:**

1. **lexicon_bookmarked_words** (replaces lexicon_word_views)
   - Array of {wordId, word, definition, bookmarkedAt}

2. **theme** (for light/dark mode)
   - String: "light" or "dark"

**Design Decisions:**
- Separated universal word data (DB) from user-specific data (localStorage)
- Unique constraint on word_definitions.word_id ensures one-to-one relationship
- 90-day TTL (fetched_at) enables automatic definition refresh without manual cleanup
- Array type for examples allows flexible storage of multiple usage contexts
- localStorage eliminates need for backend authentication while preserving UX
- Etymology nullable to accommodate Dictionary API limitations (temporary)

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
- **Limitation**: <5% etymology coverage
- **Planned Migration**: Wiktionary/Kaikki dataset for >95% etymology coverage
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
