# PLAN.md Consistency Issues - Review

## 🔴 Critical Inconsistencies

### 1. Word History Feature Conflict
**Location**: Line 18 - Must-Have Features #5

**Issue**: Lists "history of words seen so far - so the user can scroll back to find things" as a must-have feature, but:

- **Current Implementation**: This feature was REMOVED in v0.3.0 (Etymology Redesign)
- **Change Log** (line 408): "Removed all 'learned' tracking (streak, level, progress)"
- **Codebase State**: `PastWordsGrid.tsx` and `userStats.ts` exist but are not active
- **Replaced By**: Bookmarks feature (which stores only bookmarked words, not all viewed words)

**Resolution Needed**: 
- **Option A**: Remove line 18 if word history is intentionally removed
- **Option B**: Add word history as a NEW future requirement with implementation tasks
- **Option C**: Clarify that bookmarks serve as the history feature (but they don't auto-track views)

---

### 2. Acceptance Criteria Missing New Requirement
**Location**: Lines 74-118 - Acceptance Criteria section

**Issue**: Line 18 adds word history as must-have, but Acceptance Criteria has no checkboxes for:
- [ ] Word history tracking implemented
- [ ] View all previously seen words
- [ ] Search through word history

**Resolution Needed**: Either remove the requirement or add acceptance criteria for it.

---

### 3. Definition of Done Missing New Requirement
**Location**: Lines 122-157 - Definition of Done section

**Issue**: No mention of word history feature in any DoD phase, despite being listed as must-have.

**Resolution Needed**: Add word history to DoD checklist if it's a real requirement.

---

### 4. Validation Steps Don't Cover New Requirement
**Location**: Lines 160-295 - Validation Steps section

**Issue**: No testing procedures for word history feature:
- No manual testing flow for viewing history
- No validation of history persistence
- No checks for history search functionality

**Resolution Needed**: Add validation steps or remove the requirement.

---

## ⚠️ Minor Inconsistencies

### 5. Performance Metric Validation Gap
**Location**: Lines 152 & 224-236

**Issue**: 
- Production Readiness requires "<500 millisecond (p95)" word loading
- Performance Testing section doesn't validate this specific metric (uses `time curl` which gives total time, not p95)

**Resolution Needed**: Add specific p95 performance validation procedure or adjust requirement.

---

### 6. User Testing Contradiction
**Location**: Lines 149-157 (Production Readiness) vs Lines 454-457 (Medium-term goals)

**Issue**:
- Production Readiness REMOVED "User testing with 5+ participants" (was in original)
- Medium-term goals STILL include "User testing - Recruit 5+ test users"

**Resolution Needed**: 
- **Option A**: User testing is NOT required for production (remove from medium-term)
- **Option B**: User testing IS required (add back to Production Readiness)

---

### 7. Accessibility Audit Wording Ambiguity
**Location**: Line 151

**Issue**: Changed from "third-party validation" to "internal evaluation" but:
- Validation Steps section 5 (lines 216-222) references external screen readers (NVDA/JAWS/VoiceOver)
- Medium-term goals (lines 449-451) mention "automated tools (axe, WAVE)"
- Unclear if "internal" means "using external tools ourselves" or "no external tools"

**Resolution Needed**: Clarify what "internal evaluation" means in context.

---

### 8. Browser Compatibility Scope Reduction
**Location**: Lines 275-279

**Issue**: Reduced from 6 browsers to 3:
- Removed: Safari (desktop), Edge, Chrome Mobile, Safari Mobile
- Kept: Chrome, Firefox, "Mobile" (generic)

**Potential Conflict**:
- Must-Have Features line 19: "Accessible Design" implies broad compatibility
- User Experience line 102: "Responsive design on mobile/tablet/desktop" requires mobile testing
- But Production Readiness line 153 removed "Mobile testing complete (iOS Safari, Android Chrome)"

**Resolution Needed**: Ensure reduced browser testing still meets responsive design requirements.

---

## ✅ Consistency Checks Passed

### Word Selection Criteria Expansion
Lines 320-329 added new etymology criteria - consistent with etymology-first learning goal. ✓

### Production Readiness Simplifications
Changes to monitoring/analytics are consistent with "console logs for now" approach. ✓

### Browser Testing Reduction
Aligns with removing Safari/Edge/specific mobile browsers. ✓

---

## 📋 Recommended Actions

### High Priority (Blocking Issues)
1. **Resolve Word History Requirement** - Decide if this is:
   - A mistake (remove from line 18)
   - A new requirement (add implementation tasks, acceptance criteria, DoD, validation)
   - Satisfied by bookmarks (clarify and update wording)

### Medium Priority (Clarity Issues)
2. **Align User Testing** - Decide if required for production or optional post-launch
3. **Clarify Accessibility Audit** - Define what "internal evaluation" includes
4. **Add Performance Validation** - Specify how to measure p95 latency

### Low Priority (Nice to Have)
5. **Verify Browser Testing** - Confirm 3 browsers sufficient for responsive design claims
6. **Update Validation Steps** - Add any missing validation procedures for new/changed requirements

---

## Summary

**Total Issues Found**: 8
- Critical (blocking): 4
- Minor (clarity): 4

**Main Issue**: Word history feature (line 18) appears to be accidentally added or inadequately specified. This ripples through acceptance criteria, DoD, and validation sections.

**Recommendation**: Start by resolving the word history requirement question, as it affects multiple sections of the plan.
