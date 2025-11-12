# Lexicon - Living Plan Document

**Last Updated**: November 12, 2025  
**Status**: Etymology-focused redesign complete, word history feature pending

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

### Primary Goal: Word History Feature
**Objective**: Implement automatic word view tracking and history browsing

**Rationale**:
- Users need to revisit words they've seen before
- Manual bookmarking doesn't capture exploration patterns
- History enables review without explicit curation
- Complements bookmarks (history = everything, bookmarks = favorites)

**Success Criteria**:
- [ ] All viewed words automatically tracked in localStorage
- [ ] History tab shows chronological list of viewed words
- [ ] Search functionality within history (filter by word name)
- [ ] Click history item to view full word details
- [ ] History persists across sessions
- [ ] No performance degradation with large history (>1000 words)

### Secondary Goal: Wiktionary Migration
**Objective**: Migrate from Dictionary API (dictionaryapi.dev) to Wiktionary/Kaikki dataset

**Rationale**:
- Current Dictionary API has <5% etymology coverage (discovered via data analysis)
- Most words display fallback: "Etymology unavailable — Wiktionary import in progress"
- Wiktionary/Kaikki provides >95% etymology coverage for our word list

**Success Criteria**:
- [ ] Evaluate Wiktionary/Kaikki dataset against our 2,320 curated words
- [ ] At least 95% of words have etymology data available
- [ ] Etymology quality is educational and accurate (not just "unknown origin")
- [ ] Integration maintains current caching architecture (90-day TTL)
- [ ] Fallback mechanism still works if Wiktionary data unavailable

### Tertiary Goals
1. **Performance optimization**: Achieve ≤500ms word loading at p95
2. **Accessibility validation**: Internal evaluation using Replit-available tools
3. **Browser compatibility**: Test on Firefox Android, Safari iOS, Chrome desktop
4. **Content quality**: Review etymology fallback messages for educational value

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

### For Word History Feature (Next Phase)
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

### For Wiktionary Migration (Future Phase)
- [ ] Data source evaluation complete
- [ ] Migration script written and tested
- [ ] >95% etymology coverage achieved
- [ ] Fallback message updated or removed
- [ ] Cache invalidation strategy implemented
- [ ] Performance benchmarked (no regression)
- [ ] End-to-end testing passed
- [ ] Architect review approved
- [ ] Documentation updated

### For Production Readiness
- [ ] Word history feature complete
- [ ] Wiktionary migration complete
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

### Current State: **ETYMOLOGY_REDESIGN_COMPLETE**

**Entry Criteria**: ✅
- Etymology prominently displayed
- Bookmarks feature implemented
- "Learned" concept removed
- Theme toggle working
- Accessibility complete

**Exit Criteria**: 🔄 (Next Phase)
- Word history feature implemented
- Wiktionary data source evaluated
- Migration path documented

### Next State: **WORD_HISTORY_IMPLEMENTATION**

**Entry Criteria**:
- Etymology redesign complete
- Plan updated with word history requirements

**Exit Criteria**:
- Word history tracking implemented
- History tab functional
- Search within history works
- Architect review approved
- Testing complete

### Future State: **WIKTIONARY_EVALUATION**

**Entry Criteria**:
- Word history feature complete
- Download Wiktionary/Kaikki dataset
- Parse data format
- Match against our 2,320 words

**Exit Criteria**:
- Coverage report generated (target: >95%)
- Data quality assessed
- Integration feasibility confirmed

### Future State: **WIKTIONARY_INTEGRATED**

**Entry Criteria**:
- Migration script written
- Database schema updated (if needed)
- Caching strategy adapted

**Exit Criteria**:
- >95% words have etymology
- Fallback message updated/removed
- Performance validated
- End-to-end testing passed

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

### v0.4.0 - Word History Feature (Upcoming)
- Add automatic word view tracking
- Implement History tab with 3-tab layout (Current Word | Bookmarks | History)
- Integrate PastWordsGrid component with search
- Enable history persistence in localStorage
- Full keyboard accessibility for history navigation

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

## 🚀 Next Actions

### Immediate (This Week)
1. **Implement Word History Feature**
   - Add History tab to UI (3-tab layout)
   - Implement word view tracking in localStorage
   - Integrate PastWordsGrid component
   - Add search functionality
   - Test history persistence
   - Architect review

2. **Performance baseline**
   - Measure current word loading time (p95)
   - Document in PLAN.md for future comparison
   - Validate ≤500ms goal

### Short-term (Next 2 Weeks)
1. **Wiktionary migration**
   - Evaluate Wiktionary/Kaikki dataset
   - Write migration script
   - Test on staging data
   - Execute migration
   - Validate etymology coverage

2. **Browser compatibility testing**
   - Test on Firefox Android (primary)
   - Test on Safari iOS (secondary)
   - Test on Chrome desktop (tertiary)
   - Document issues and fixes

3. **Accessibility audit**
   - Run Lighthouse accessibility audits
   - Keyboard navigation testing
   - Document issues and fixes

### Medium-term (Next Month)
1. **Production deployment**
   - Final performance validation
   - SEO meta tags
   - Basic analytics integration
   - Publish to replit.app

2. **Post-launch** (optional)
   - Collect user feedback
   - Monitor performance metrics
   - Prioritize improvements

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
