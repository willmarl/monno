# PRD: Remove Article Feature

## Introduction

Remove the article feature from the active codebase by moving all article-related files to the `legacy/` folder for future reference. This includes API routes, frontend UI components, database schemas, and associated tests. The Prisma database will be reset to remove article-related tables.

## Goals

- Move all article feature code to `legacy/` folder (for human reference)
- Remove article API endpoints from active codebase
- Remove article UI components and routes
- Remove article database schema and reset Prisma
- Remove all article-related tests
- Ensure all remaining features and tests continue to work

## User Stories

### US-001: Move article API routes to legacy folder
**Description:** As a developer, I want article API routes moved to legacy so they remain accessible for future reference.

**Acceptance Criteria:**
- [ ] Identify all API routes related to articles
- [ ] Create `legacy/` directory if it doesn't exist
- [ ] Move article routes to `legacy/` folder
- [ ] Update any backend tests to point to new legacy paths
- [ ] Verify API routes in legacy work correctly (for reference)
- [ ] Typecheck passes

### US-002: Move article frontend UI components to legacy
**Description:** As a developer, I want article frontend components moved to legacy so they remain for future reference.

**Acceptance Criteria:**
- [ ] Identify all React components related to articles
- [ ] Move article components to `legacy/` folder
- [ ] Update any component tests to point to new legacy paths
- [ ] Verify components in legacy render correctly (for reference)
- [ ] Typecheck passes

### US-003: Remove article database schema
**Description:** As a developer, I want article database tables removed so the Prisma schema reflects the current state.

**Acceptance Criteria:**
- [ ] Locate article models in Prisma schema
- [ ] Remove article-related models and relations
- [ ] Reset Prisma database (drop and recreate)
- [ ] Generate new Prisma client
- [ ] Typecheck passes

### US-004: Remove article API endpoints from backend
**Description:** As a developer, I want article API endpoints removed from active backend so they're not accessible.

**Acceptance Criteria:**
- [ ] Remove article endpoint handlers from backend code
- [ ] Remove article routes from main API file
- [ ] Remove any article middleware or utilities
- [ ] Update any remaining references in non-article code
- [ ] Typecheck passes
- [ ] Backend tests pass

### US-005: Remove article frontend routes and pages
**Description:** As a developer, I want article pages and routes removed from frontend so they're not accessible.

**Acceptance Criteria:**
- [ ] Remove article route definitions from frontend
- [ ] Remove article page components
- [ ] Remove article layout components
- [ ] Remove article navigation links
- [ ] Typecheck passes
- [ ] Frontend tests pass
- [ ] Verify frontend works correctly in browser

### US-006: Remove article tests
**Description:** As a developer, I want article tests removed so they don't interfere with test suite.

**Acceptance Criteria:**
- [ ] Identify all tests related to articles
- [ ] Remove article test files
- [ ] Remove article test fixtures or data
- [ ] Run full test suite to verify no broken tests
- [ ] Typecheck passes

### US-007: Verify all remaining features work
**Description:** As a developer, I want to verify all remaining features still work after article removal.

**Acceptance Criteria:**
- [ ] Run backend tests and verify all pass
- [ ] Run frontend tests and verify all pass
- [ ] Run integration tests and verify all pass
- [ ] Start application and verify it loads without errors
- [ ] Test core features manually in browser
- [ ] No console errors in browser
- [ ] Typecheck passes

## Non-goals

- Moving article code to legacy should NOT affect imports in active codebase (legacy is for human reference only)
- Database migrations will be dropped and recreated (no article tables in final state)
- Article-related tests will be removed entirely
- Article API endpoints will be removed (not just moved)

## Technical Considerations

- **Legacy folder purpose:** Human reference only - code should NOT import from legacy
- **Database:** Prisma schema will be reset (drop + recreate) to remove article tables
- **Test strategy:** Run full test suite after each major step to catch issues early
- **Backwards compatibility:** None - this is a complete feature removal
- **Dependencies:** After removing article code, check for any remaining unused dependencies