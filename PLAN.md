# Lexicon - Living Plan Document

**Last Updated**: November 12, 2025  
**Status**: Week 2 - Building offline migration script (Week 1 viability testing COMPLETE - 96% coverage achieved)

---

## 🎯 High-Level Requirements

### Core Value Proposition
Lexicon teaches advanced GRE/SAT vocabulary through **etymology-first learning**, making word origins and linguistic evolution the primary educational focus rather than an afterthought.

### Must-Have Features
1. **Etymology Prominence**: Etymology displayed as primary information under each definition
2. **Advanced Vocabulary**: 2,300+ curated GRE/SAT words with interesting etymological backgrounds
3. **Random Learning**: On-demand random word loading with refresh capability
4. **Personal Bookmarks**: User-controlled word collection stored locally (no authentication required)
5. **Word History**: Automatic tracking of all viewed words - users can scroll back to find previously seen words
6. **Accessible Design**: Full keyboard navigation and screen reader support
7. **Theme Flexibility**: Light/dark mode with persistence

### Non-Requirements (Removed)
- User authentication or backend user accounts
- Progress tracking (streak, level, "words learned" metrics)
- Daily word scheduling (replaced with on-demand random)
- Social features or sharing

---

## 💡 Desired Impact

### Educational Goals
- **Make etymology accessible**: Transform word origins from obscure academic footnotes into engaging primary content
- **Vocabulary retention**: Help learners remember words through understanding their linguistic history
- **Intellectual curiosity**: Encourage exploration of language evolution and cross-linguistic connections

### User Experience Goals
- **Zero friction**: No login, no setup, immediate learning
- **Distraction-free**: Clean interface focused on the word, not gamification
- **Personal control**: Users curate their own learning through bookmarks, not algorithmic recommendations
- **Easy review**: Browse complete history of viewed words to reinforce learning

### Technical Goals
- **Data resilience**: All curated words preserved in version control (JSON file)
- **API independence**: Cache strategy prevents third-party API failures from breaking the app
- **Performance**: Sub-500ms word loading at p95 through PostgreSQL caching (90-day TTL)

---

## 🎯 Current Goals

### 🚨 PRIMARY GOAL: Etymology Data Source Migration (BLOCKING)
**Objective**: Migrate from Dictionary API to Wiktionary REST API to make the app functional

**CRITICAL RATIONALE**:
- **App is currently non-functional**: Core value proposition is "etymology-first learning"
- **Current data source fails**: Dictionary API provides <5% etymology coverage
- **User experience is broken**: 95%+ words show "Etymology unavailable" fallback
- **All other work is blocked**: Cannot build features on top of incomplete core data
- **Risk of wasted effort**: Features built now will need rework after migration

**Migration Approach (Offline Bulk Migration)**:
- **Architecture**: One-time offline migration script runs BEFORE deployment
- **Data Flow**: `curated-words.json → Migration Script → Wiktionary API → PostgreSQL`
- **Primary**: Wiktionary REST API (`/api/rest_v1/page/definition/{word}`)
- **Fallback**: Wiktionary Action API (wikitext parsing for etymology gaps)
- **Scale**: 2,320 words = ~40 min runtime at 1 req/sec (runs once, offline)
- **User Experience**: App ships with 100% data pre-loaded, no runtime API calls
- **Performance**: Sub-100ms word loading from pre-populated PostgreSQL cache
- **API Etiquette**: Wikimedia-compliant User-Agent + rate limiting
- **Share-Alike**: Backend API serving adapted text must remain CC BY-SA 3.0 compatible

**Success Criteria** (MUST complete before any other work):
- [ ] **Week 1**: Test Wiktionary REST API with 50-100 sample words from curated list
- [ ] **Week 1**: Measure etymology coverage rate (target: ≥95%)
- [ ] **Week 1**: Assess data quality (educational etymologies, not "unknown origin")
- [ ] **Week 1**: Test Action API fallback for words missing etymology in REST
- [ ] **Week 1**: Go/no-go decision for full migration
- [ ] **Week 2**: Implement rate-limited API client (1-2 req/sec with exponential backoff)
- [ ] **Week 2**: Update schema to include source URL, license, retrieval timestamp
- [ ] **Week 2**: Build extraction/parsing logic with retry mechanisms
- [ ] **Week 2**: Test migration script on 100 words
- [ ] **Week 3**: Execute full migration for all 2,320 words (with backup)
- [ ] **Week 3**: Add attribution UI (source link + CC BY-SA 3.0 notice on word cards)
- [ ] **Week 3**: Validate ≥95% etymology coverage in production
- [ ] **Week 3**: Update/remove fallback messages
- [ ] **Week 3**: Architect review and approval
- [ ] **Week 3**: End-to-end testing confirms app is functional

**Definition of "Functional"**:
- ≥95% of 2,320 words have complete data (definition + etymology + examples)
- Etymology quality is educational (explains word origins, not just "unknown")
- Caching architecture maintains performance (90-day TTL, <500ms p95)
- Fallback mechanism works for remaining <5% missing etymologies
- **Attribution compliant**: All word cards display Wiktionary source link + CC BY-SA 3.0 license

---

### Secondary Goal: Word History Feature (BLOCKED until migration complete)
**Objective**: Implement automatic word view tracking and history browsing

**Why This is Secondary**:
- Adds value only after core content is working
- Building on incomplete data risks rework
- User trust requires delivering on core promise first

**Success Criteria** (only start after Primary Goal complete):
- [ ] All viewed words automatically tracked in localStorage
- [ ] History tab shows chronological list of viewed words
- [ ] Search functionality within history (filter by word name)
- [ ] Click history item to view full word details
- [ ] History persists across sessions
- [ ] No performance degradation with large history (>1000 words)

### Tertiary Goals (Post-Migration Polish)
1. **Performance optimization**: Achieve ≤500ms word loading at p95
2. **Accessibility validation**: Internal evaluation using Replit-available tools
3. **Browser compatibility**: Test on Firefox Android, Safari iOS, Chrome desktop
4. **SEO and analytics**: Meta tags and privacy-respecting tracking

---

## ✅ Acceptance Criteria

### Feature Completeness
- [x] Random word loading with backend retry logic (max 10 attempts)
- [x] Etymology section always visible under definition
- [x] Fallback message when etymology unavailable
- [x] Bookmark button with fixed-width icon (no layout shifts)
- [x] Bookmarks tab with grid layout
- [x] Bookmark storage in localStorage (wordId, word, definition)
- [x] Click bookmark to view full word details
- [x] Refresh button to load new random word
- [x] Light/dark theme toggle with persistence
- [x] Theme preference survives page reload
- [ ] **NEW**: Word history tracking (auto-track all viewed words)
- [ ] **NEW**: History tab showing all previously viewed words (3-tab layout)
- [ ] **NEW**: Search functionality within word history
- [ ] **NEW**: Click history item to view word details
- [ ] **NEW**: History persists across sessions

### Data Quality
- [x] 2,320 curated words in database
- [x] All words stored in `server/data/curated-words-merged.json`
- [x] PostgreSQL caching with 90-day TTL
- [x] Missing words tracked in `missing_definitions` table
- [x] No duplicate words in database
- [ ] **PENDING**: >95% words have etymology data (blocked by Wiktionary migration)
- [ ] **NEW**: Word source URL stored with each definition
- [ ] **NEW**: Retrieval timestamp tracked for each word
- [ ] **NEW**: License information stored in database schema

### Licensing & Attribution
- [ ] **NEW**: Source link to Wiktionary displayed on every word card
- [ ] **NEW**: CC BY-SA 3.0 license notice shown on word cards
- [ ] **NEW**: Attribution HTML includes clickable link to original page
- [ ] **NEW**: License compliance documented and validated
- [ ] **NEW**: Share-alike compliance: Backend API serving adapted text documented as CC BY-SA 3.0
- [ ] **NEW**: Wikimedia-compliant User-Agent configured in API client

### User Experience
- [x] Word loads in <2 seconds (including API call)
- [ ] **NEW TARGET**: Word loads in ≤500ms at p95
- [x] Bookmark action provides immediate visual feedback
- [x] Toast notifications for all user actions (bookmark, refresh, errors)
- [x] No console errors or warnings in browser
- [x] Smooth transitions between tabs
- [x] Responsive design on mobile/tablet/desktop

### Accessibility
- [x] All interactive elements keyboard accessible (Tab, Enter, Space)
- [x] Bookmark button has aria-label describing state
- [x] Bookmark cards support keyboard navigation
- [x] Screen reader announces bookmark actions
- [x] Focus rings visible on all interactive elements
- [x] Semantic HTML (proper heading hierarchy)
- [ ] **NEW**: History cards keyboard accessible
- [ ] **NEW**: History search keyboard accessible

### Technical Quality
- [x] TypeScript strict mode with no type errors
- [x] Database migrations run without errors (`npm run db:push`)
- [x] No LSP diagnostics errors
- [x] Server starts without errors
- [x] Frontend builds without errors
- [x] All API endpoints return correct data types

---

## ✔️ Definition of Done

### For Current State (Etymology Redesign)
- [x] All planned features implemented and working
- [x] Architect review passed with no critical issues
- [x] Database cleaned (913 etymology-related missing entries removed)
- [x] Documentation updated (replit.md reflects current state)
- [x] Workflow runs without errors
- [x] Manual testing confirms core flows work:
  - Random word loading
  - Etymology display (with fallback)
  - Bookmark creation/removal
  - Bookmarks tab navigation
  - Theme switching
  - Page reload persistence

### For Wiktionary Migration (CURRENT PHASE - BLOCKING ALL OTHER WORK)
- [x] **WEEK 1 DELIVERABLES** (API Viability Testing) ✅ COMPLETE:
  - [x] Test Wiktionary REST API with 50 sample words
  - [x] Measure etymology coverage rate from REST API (90% initially)
  - [x] Test Action API fallback for words missing etymology in REST
  - [x] Fix parser bug (regex for English section extraction)
  - [x] Re-test with fixed parser: **96% coverage achieved** (exceeds 95% target)
  - [x] Generate coverage report showing % with complete data
  - [x] Document API response format and parsing requirements
  - [x] Make go/no-go decision: **GO** - proceed with migration
  - [x] Document findings in WIKTIONARY_WEEK1_REPORT.md
- [ ] **WEEK 2 DELIVERABLES** (Offline Migration Implementation):
  - [ ] Build WiktionaryMigrationService class with rate limiting (1-2 req/sec)
  - [ ] Add exponential backoff with jitter for 429/5xx errors
  - [ ] Update database schema: add `source_url`, `retrieved_at`, `license` fields
  - [ ] Build REST API parser (extract definitions, etymology, pronunciation, examples)
  - [ ] Build Action API fallback parser (parse wikitext for etymology sections)
  - [ ] Write **offline bulk migration script** that runs BEFORE deployment
  - [ ] Implement progress tracking and resumable migration capability
  - [ ] Test migration script on 100 words (verify no runtime API calls)
- [ ] **WEEK 3 DELIVERABLES** (Pre-load Data & User Experience):
  - [ ] Execute full offline migration for all 2,320 words (~40 min runtime)
  - [ ] Validate 100% of words have data in PostgreSQL BEFORE app deployment
  - [ ] Confirm ≥95% etymology coverage in pre-loaded database
  - [ ] Verify app loads words from database only (NO runtime API calls)
  - [ ] Add attribution UI component (source link + CC BY-SA 3.0 notice)
  - [ ] Remove all "import in progress" or loading state messages
  - [ ] Performance benchmark: sub-100ms word loading from PostgreSQL
  - [ ] Test user experience: immediate word display, no loading delays
  - [ ] Architect review approved
  - [ ] Documentation updated (deployment instructions for data pre-load)

### For Word History Feature (BLOCKED - Cannot Start Until Migration Complete)
- [ ] Word history tracking implemented in localStorage
- [ ] History tab added to UI (Current Word | Bookmarks | History)
- [ ] PastWordsGrid component integrated and functional
- [ ] Search functionality works within history
- [ ] History persists across sessions
- [ ] Click history item navigates to word details
- [ ] Performance validated (no degradation with large history)
- [ ] Keyboard accessibility complete
- [ ] Architect review approved
- [ ] End-to-end testing passed
- [ ] Documentation updated (replit.md + PLAN.md)

### For Production Readiness
- [ ] **CRITICAL**: Wiktionary migration complete (≥95% etymology coverage)
- [ ] Word history feature complete
- [ ] Accessibility audit passed (internal evaluation using Replit-available tools)
- [ ] Performance validated: word loading ≤500ms at p95
- [ ] Browser testing complete (Firefox Android, Safari iOS, Chrome desktop)
- [ ] Error tracking implemented (console logs for now)
- [ ] SEO meta tags added
- [ ] Analytics integrated (privacy-respecting, basic)
- [ ] Published to replit.app domain

---

## 🧪 Comprehensive Validation Steps

### Pre-Deployment Checklist

#### 1. Data Integrity
```bash
# Verify word count
node -e "console.log(require('./server/data/curated-words-merged.json').length)"
# Expected: 2320

# Check database word count
# Run SQL: SELECT COUNT(*) FROM curated_words;
# Expected: 2320

# Verify no duplicate words
# Run SQL: SELECT word, COUNT(*) FROM curated_words GROUP BY word HAVING COUNT(*) > 1;
# Expected: 0 rows
```

#### 2. API Endpoints
```bash
# Test random word endpoint
curl http://localhost:5000/api/words/random
# Expected: JSON with word, definition, etymology (or null), examples

# Test word by ID endpoint
curl http://localhost:5000/api/words/{some-uuid}
# Expected: JSON with specific word details

# Test all words endpoint
curl http://localhost:5000/api/words
# Expected: JSON array of all words
```

#### 3. Frontend Functionality
**Manual Testing Flow**:
1. Load homepage → Verify word displays
2. Check etymology section → Verify content or fallback message
3. Click bookmark → Verify icon changes + toast appears
4. Click "Bookmarks" tab → Verify bookmark appears in grid
5. Click bookmarked word → Verify navigates to word + tab switches
6. Click bookmark again → Verify removal + toast
7. Check bookmarks tab → Verify bookmark removed
8. Click "New Word" button → Verify new word loads + toast
9. **NEW**: Click "History" tab → Verify previously viewed words appear
10. **NEW**: Use search in history → Verify filtering works
11. **NEW**: Click history item → Verify navigates to word
12. Click theme toggle → Verify colors change
13. Reload page → Verify theme persists + bookmarks persist + history persists

#### 4. Keyboard Accessibility
**Testing Flow**:
1. Use Tab key to navigate through all interactive elements
2. Verify visible focus rings on: bookmark button, refresh button, theme toggle, tabs, bookmark cards, history cards
3. Press Enter on bookmark button → Verify bookmark toggles
4. Press Space on bookmark button → Verify bookmark toggles
5. Tab to bookmark card → Press Enter → Verify navigation
6. Tab to bookmark card → Press Space → Verify navigation
7. **NEW**: Tab to history card → Press Enter → Verify navigation
8. **NEW**: Tab to history search → Type query → Verify filtering

#### 5. Accessibility Testing
**Internal Evaluation (Replit-available tools)**:
1. **Keyboard Navigation**: Tab through all interactive elements, verify focus rings
2. **Screen Reader Testing** (if available in Replit):
   - Verify app title announced: "Lexicon"
   - Navigate to bookmark button → Verify state announced
   - Toggle bookmark → Verify toast announced
   - Navigate to tabs → Verify tab names announced
   - Navigate to cards → Verify word names announced
3. **Automated Tools** (run in browser DevTools):
   - Lighthouse accessibility audit (target: 95+ score)
   - Check for ARIA label completeness
   - Verify semantic HTML structure
4. **Visual Testing**:
   - Verify focus indicators visible in both light/dark themes
   - Check color contrast ratios (WCAG AA minimum)
   - Test text scaling up to 200%

#### 6. Performance Testing
**Target: ≤500ms word loading at p95**

```bash
# Backend API performance (measure p95 latency)
# Method 1: Manual sampling (50 requests)
for i in {1..50}; do
  curl -w "%{time_total}\n" -o /dev/null -s http://localhost:5000/api/words/random
done | sort -n | awk 'NR==48 {print "p95: " $1 "s"}'
# Expected: <0.5s

# Method 2: Check database query performance
# Run SQL: EXPLAIN ANALYZE SELECT * FROM word_definitions WHERE word_id = '...';

# Frontend bundle size
npm run build
ls -lh dist/assets/*.js
# Main bundle should be <500KB

# Full page load (with browser)
# Use browser DevTools Network tab → reload 10 times → check p95 of total load time
# Expected: <1s for full page including API call
```

**Performance Benchmarks**:
- API response time (p95): ≤500ms
- Database query time: ≤50ms
- Frontend bundle size: <500KB gzipped
- Time to interactive: <2s

#### 7. Error Handling
**Test Scenarios**:
1. Disconnect internet → Verify cached data loads
2. API returns 404 → Verify word marked as missing + new word attempted
3. API timeout → Verify fallback to cached data or error message
4. Invalid word ID → Verify 404 error handled gracefully
5. Database connection failure → Verify error message shown

#### 8. Data Migration Validation (For Wiktionary)
**Pre-Migration**:
```bash
# Backup current database
pg_dump $DATABASE_URL > lexicon_backup_$(date +%Y%m%d).sql

# Export current word_definitions
# Run SQL: COPY word_definitions TO '/tmp/definitions_backup.csv' CSV HEADER;
```

**Post-Migration**:
```bash
# Verify etymology coverage
# Run SQL: 
# SELECT 
#   COUNT(*) as total,
#   COUNT(etymology) as with_etymology,
#   ROUND(100.0 * COUNT(etymology) / COUNT(*), 2) as coverage_pct
# FROM word_definitions;
# Expected coverage_pct: >95%

# Sample 20 random etymologies for quality check
# Run SQL: 
# SELECT word, etymology FROM word_definitions 
# WHERE etymology IS NOT NULL 
# ORDER BY RANDOM() LIMIT 20;
```

#### 9. Browser Compatibility
**Test Priority Order** (test in this sequence):
1. **PRIMARY**: Firefox on Android (latest)
2. **SECONDARY**: Safari on iOS (latest) 
3. **TERTIARY**: Chrome on Desktop (latest)

**For Each Browser**:
1. Verify word display (definition, etymology, pronunciation)
2. Verify bookmark functionality (add, remove, navigate)
3. Verify history functionality (view, search, navigate)
4. Verify theme toggle (light/dark switching)
5. Verify localStorage persistence (reload test)
6. Check console for errors
7. Test responsive layout (portrait/landscape on mobile)
8. Verify touch interactions (tap, scroll, swipe)

#### 10. Regression Testing
**After Any Code Change**:
1. Run LSP diagnostics → 0 errors
2. Start workflow → No errors in logs
3. Load homepage → Word displays correctly
4. Create bookmark → Appears in bookmarks tab
5. View word history → Previously viewed words appear
6. Theme toggle → Persists after reload
7. Check browser console → No errors
8. Performance check → API responds in <500ms

---

## 📊 Data Source Preservation

### Curated Word List
**Location**: `server/data/curated-words-merged.json`

**Purpose**:
1. **Data Source Evaluation**: Compare new etymology sources (Wiktionary, Oxford, etc.) against our curated list
2. **Database Restoration**: Re-seed database if we switch etymology sources
3. **Version Control**: Permanent record of our vocabulary selection
4. **Backup**: Recover from data loss scenarios

**Schema**:
```json
[
  {
    "word": "string",
    "difficulty": 1-10
  }
]
```

**Word Selection Criteria**:
- 1,985 words: Core GRE/SAT vocabulary from test prep sources
- 335 words: Advanced vocabulary with particularly interesting etymologies
  - Words that have changed minimally since Proto-Indo-European
  - Words that have changed minimally since Proto-Germanic, Sanskrit, etc
  - Words that are surprisingly modern
  - Words that are surprisingly onomatopoeic 
  - Greek/Latin compound words
  - Mythological origins (e.g., narcissistic → Narcissus)
  - Surprising linguistic histories
  - Cross-linguistic borrowings

**Validation**:
```bash
# Verify file exists and has correct count
test -f server/data/curated-words-merged.json && \
  node -e "console.log(require('./server/data/curated-words-merged.json').length)" && \
  echo "✓ Word list preserved"
```

### Database Seeding
**Command**: `npm run db:seed` (if implemented) or manual seeding via `server/index.ts`

**Process**:
1. Read `curated-words-merged.json`
2. For each word, insert into `curated_words` table if not exists
3. Skip `word_definitions` seeding (fetched on-demand from API)

---

## 🔄 Workflow State Machine

### Current State: **APP_NON_FUNCTIONAL** (Blocked on data source)

**Entry Criteria**: ✅
- Etymology prominently displayed (with fallback message)
- Bookmarks feature implemented
- Theme toggle working
- Accessibility complete
- **BLOCKER**: 95%+ words show "Etymology unavailable" - core functionality broken

**Exit Criteria**: 🚨 (CRITICAL PATH)
- Wiktionary/Kaikki dataset evaluated (Week 1)
- Migration strategy designed (Week 2)
- Migration executed successfully (Week 3)
- ≥95% etymology coverage achieved

### Next State: **WIKTIONARY_EVALUATION** (Week 1 - BLOCKING)

**Entry Criteria**:
- Plan re-prioritized to make migration #1
- Team aligned on "data first, features second"

**Exit Criteria**:
- Downloaded and parsed Wiktionary/Kaikki dataset
- Coverage report generated (≥95% target)
- Data quality assessed
- Migration path documented
- Go/no-go decision made

### Future State: **WIKTIONARY_MIGRATION** (Weeks 2-3 - BLOCKING)

**Entry Criteria**:
- Evaluation complete with positive results
- Migration strategy approved

**Exit Criteria**:
- ≥95% words have etymology
- App functionality restored
- Fallback message updated/removed
- Performance validated
- **APP NOW FUNCTIONAL** - unblocks all other work

### Future State: **WORD_HISTORY_IMPLEMENTATION** (Post-Migration)

**Entry Criteria**:
- Migration complete and validated
- App is functional with full etymology coverage

**Exit Criteria**:
- Word history tracking implemented
- History tab functional
- Search within history works
- Architect review approved
- Testing complete

### Final State: **PRODUCTION_READY**

**Entry Criteria**:
- All acceptance criteria met
- Accessibility audit passed
- Browser testing complete

**Exit Criteria**:
- Published to replit.app
- Monitoring enabled
- User feedback collected

---

## 📝 Change Log

### v0.4.1 - API-First Migration Strategy (November 12, 2025)
**Migration Approach Decision**: Switched to Wiktionary REST API instead of bulk dumps

**Technical Decision**:
- **Approach**: REST API + Action API fallback (not Kaikki dumps)
- **Rationale**: 2,320 words is manageable scale for API approach (~30-40 min runtime)
- **Benefits**: Simpler implementation, always-current data, easier to maintain
- **Trade-offs**: Requires rate limiting, but well worth the simplicity

**Updated 3-Week Plan**:
- Week 1: Test REST API viability with 50-100 sample words
- Week 2: Build rate-limited API client and migration script
- Week 3: Execute full migration + implement attribution UI

### v0.4.0 - CRITICAL RE-PRIORITIZATION (November 12, 2025)
**Status Change**: App marked as NON-FUNCTIONAL due to missing etymology data

**Strategic Shift**:
- Recognized app cannot fulfill core promise without etymology data
- Re-prioritized Wiktionary migration from "secondary" to "PRIMARY BLOCKING" goal
- All feature work (word history, performance, polish) now blocked until data source fixed
- 3-week sprint plan created for data source migration

**Rationale**:
- Core value proposition: "etymology-first learning"
- Current reality: 95%+ words show "Etymology unavailable" fallback
- Risk: Building features on incomplete data leads to rework
- Decision: Data first, features second

**Critical Requirements Added**:
- Attribution compliance (CC BY-SA 3.0 license)
- Source URL and retrieval timestamp tracking
- Clickable Wiktionary links on all word cards

### v0.3.1 - Word History Feature Planning (November 12, 2025)
- Added word history to requirements (3-tab layout)
- Designed localStorage tracking for all viewed words
- Integrated PastWordsGrid component into plan
- **BLOCKED**: Implementation deferred until etymology data fixed

### v0.3.0 - Etymology-Focused Redesign (November 12, 2025)
- Discovered Dictionary API has <5% etymology coverage
- Implemented etymology-always-visible UI with fallback message
- Removed all "learned" tracking (streak, level, progress)
- Added bookmarks feature with localStorage storage
- Implemented light/dark theme toggle
- Full keyboard accessibility and screen reader support
- Cleaned 913 etymology-related missing entries from database

### v0.2.0 - Random Word System (November 2025)
- Migrated from daily word to random word loading
- Added refresh button for on-demand learning
- Implemented backend retry logic (max 10 attempts)
- Expanded word list to 2,320 curated GRE/SAT words
- Added PostgreSQL caching with 90-day TTL
- Implemented missing_definitions table for 404 tracking

### v0.1.0 - Initial Implementation
- Basic word display with Dictionary API integration
- User authentication with progress tracking
- Daily word scheduling

---

## 🚀 Next Actions (Re-Sequenced - Data First)

### 🚨 WEEK 1 (IMMEDIATE - BLOCKING PRIORITY)
**Wiktionary REST API Viability Testing**

**Monday-Tuesday**:
1. Set up API client and test infrastructure
   - Implement basic HTTP client with User-Agent header
   - Test REST API endpoint: `GET https://en.wiktionary.org/api/rest_v1/page/definition/{word}`
   - Test Action API endpoint for fallback: `GET https://en.wiktionary.org/w/api.php?action=query&prop=revisions...`
   - Understand response formats (JSON structure from both endpoints)

**Wednesday-Thursday**:
2. Test with sample words and measure coverage
   - Select 50-100 diverse words from curated list (various POS, difficulty levels)
   - Fetch data from REST API for each word
   - For words missing etymology in REST, test Action API fallback
   - Track coverage metrics: % with definition, % with etymology, % with examples
   - Generate coverage report

**Friday**:
3. Quality assessment and go/no-go decision
   - Sample 50 random etymologies for educational quality review
   - Assess if etymologies are educational vs "unknown origin"
   - Evaluate API reliability and response times
   - Document API response format and parsing requirements
   - Make go/no-go decision for full API migration
   - Document findings in PLAN.md

**Week 1 Deliverable**: Coverage report + quality assessment + API viability decision

---

### WEEK 2 (IMPLEMENTATION - Assuming Week 1 Go Decision)
**API Client and Migration Script Development**

1. Implement production-grade API client
   - Wikimedia-compliant User-Agent: "Lexicon/1.0 (contact: [project-url])"
   - Rate limiter with token bucket (1-2 req/sec)
   - Exponential backoff with jitter for 429/503/502 errors
   - Retry logic (max 5 attempts with timeout)
   - HTTP conditional requests (ETag/If-None-Match, Last-Modified/If-Modified-Since)
   - Raw response persistence for potential reprocessing
   - Progress tracking and logging

2. Update database schema
   - Add fields: `source_url` (TEXT), `retrieved_at` (TIMESTAMP), `license` (TEXT)
   - Run migrations safely
   - Test schema changes on development database

3. Build data extraction and parsing
   - REST API parser: extract definitions, etymology, pronunciation, examples
   - Action API fallback parser: parse wikitext for etymology sections
   - Handle English language filtering
   - Normalize and validate extracted data

4. Write and test migration script
   - Orchestrate API calls with rate limiting
   - Transform API responses to database schema
   - Handle errors gracefully (log and continue)
   - Test on 100 sample words
   - Backup current database

**Week 2 Deliverable**: Production-ready migration script + tested on 100 words + database backup

---

### WEEK 3 (EXECUTION - Restores App Functionality)
**Full Migration and Attribution Implementation**

1. Execute full migration
   - Run migration script for all 2,320 words (~30-40 min runtime)
   - Monitor progress and handle errors
   - Log API failures and retry statistics

2. Validation
   - Verify ≥95% etymology coverage in database
   - Sample quality check (50 random entries for educational value)
   - Performance benchmark (confirm <500ms p95, no regression)

3. Attribution UI implementation
   - Create Attribution component (source link + CC BY-SA 3.0 notice)
   - Integrate into word display card
   - Format: "Source: [word - Wiktionary](url). Text available under CC BY-SA 3.0"
   - Test license compliance requirements

4. UI updates and finalization
   - Update/remove fallback messages for missing etymologies
   - Verify etymology display works with real data
   - Test attribution links (clickable, correct URLs)

5. Testing and approval
   - End-to-end testing with real migrated data
   - License compliance validation
   - Architect review and approval
   - Document results in PLAN.md

**Week 3 Deliverable**: **APP NOW FUNCTIONAL** - ≥95% etymology coverage + full attribution compliance

---

### POST-MIGRATION (Weeks 4+)
**Feature Development (Unblocked)**

1. **Word History Feature** (Week 4-5)
   - Now safe to build on complete data
   - Add History tab, tracking, search
   
2. **Polish** (Week 6+)
   - Performance optimization (≤500ms p95)
   - Browser testing (Firefox Android, Safari iOS, Chrome)
   - Accessibility audit (Lighthouse, keyboard nav)
   - SEO and analytics
   
3. **Production Deployment** (Week 7)
   - Final validation
   - Publish to replit.app

---

## 📚 Reference Documentation

- **Technical Architecture**: See `replit.md`
- **Database Schema**: See `shared/schema.ts`
- **API Documentation**: See `server/routes.ts` comments
- **Component Documentation**: See component JSDoc comments
- **Accessibility Guidelines**: WCAG 2.1 Level AA

---

**Document Owner**: Replit Agent  
**Review Frequency**: After each major feature completion  
**Next Review**: After word history implementation
