# God Eyes - Agent Instructions

## Project Overview

**God Eyes** - Defense-Grade Satellite Intelligence Platform
- **Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS, Mapbox GL JS, Zustand, Recharts
- **Backend:** Convex (managed TypeScript backend + PostgreSQL)
- **Auth:** Convex Auth with GitHub OAuth and password auth
- **Deploy:** Frontend on Vercel, Backend on Convex Cloud
- **Repo:** https://github.com/TRAPZZY/God-Eyes

## Convex Setup (Required)

The backend is now Convex. Before running locally, you must:

1. **Initialize Convex:**
   ```bash
   npx convex dev
   ```
   This requires interactive login to your Convex account.

2. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add:
   VITE_CONVEX_URL=your_convex_deployment_url
   VITE_MAPBOX_TOKEN=your_mapbox_token
   ```

3. **Update convex.json:**
   Replace `"REPLACE_WITH_YOUR_CONVEX_TEAM_SLUG"` with your actual team slug from the Convex dashboard.

## Commands

```
Frontend:
  npm run dev          # Start dev server (requires Convex running)
  npm run build        # Production build (tsc -b && vite build)
  npm run preview      # Preview production build

Convex:
  npx convex dev       # Start Convex backend (interactive)
  npx convex deploy   # Deploy to production
```

## Code Conventions

### Frontend (React/TypeScript)
- Functional components with hooks (no class components)
- Named exports preferred
- TypeScript strict mode
- Components co-located: `Component.tsx` in `src/components/Feature/`
- Services in `src/services/`, stores in `src/store/`, types in `src/types/`
- Real API calls only — NO mock data ever
- Error boundaries wrap all routes
- Auto-refresh polling on data-heavy pages
- Loading states for all async operations
- Graceful degradation when backend unreachable

### Backend (FastAPI/Python)
- Cross-database UUID support (GUID type for SQLite + PostgreSQL)
- JWT auth with access + refresh tokens
- Password hashing with bcrypt
- All endpoints require authentication unless explicitly public
- Graceful scheduler startup (non-critical failure handling)
- SQLite default, PostgreSQL for production

## Boundaries

### Always Do
- Write specs before significant code changes
- Break work into small, verifiable tasks (<5 files each)
- Implement in thin vertical slices — test after each slice
- Run build (`npm run build`) before committing frontend changes
- Use real API calls — never mock data in production code
- Add error handling for all network requests
- Follow existing code style and conventions
- Write tests for logic, bug fixes, and behavior changes
- Keep commits atomic and descriptive

### Ask First
- Database schema changes
- Adding new dependencies
- Changing deployment configuration
- Modifying authentication flow
- Removing existing features

### Never Do
- Commit secrets, tokens, or .env files
- Use mock data when real backend is available
- Leave build broken
- Skip tests to make suite pass
- Write code without understanding the spec
- Mix refactoring with feature work in same commit
- Edit vendor directories or node_modules
- Remove failing tests without fixing the underlying issue

## Engineering Skills (Always Applied)

### Spec-Driven Development
- Write specs before coding for any significant change
- Surface assumptions immediately
- Define concrete success criteria (not vague goals)
- Save specs to version control
- Keep specs alive — update when decisions change

### Planning & Task Breakdown
- Decompose work into small, verifiable tasks
- Each task completable in single focused session
- Explicit acceptance criteria per task
- Order by dependency (foundation first)
- Slice vertically (full feature path), not horizontally
- No task should touch more than ~5 files

### Incremental Implementation
- Build in thin vertical slices
- Implement → Test → Verify → Commit → Next slice
- Each increment leaves system in working state
- One thing at a time — don't mix concerns
- Keep it compilable after each increment
- Feature flags for incomplete features
- Scope discipline — touch only what the task requires

### Test-Driven Development
- Write failing test before code that makes it pass
- Bug fixes: reproduce with test first, then fix
- Test pyramid: 80% unit, 15% integration, 5% E2E
- DAMP over DRY in tests — each test tells a complete story
- Prefer real implementations over mocks
- Arrange-Act-Assert pattern
- Test state, not interactions
- The Beyonce Rule: if you liked it, put a test on it

### Code Quality & Review
- Simplicity first — "simplest thing that could work"
- Three similar lines > premature abstraction
- Chesterton's Fence: understand why code exists before changing it
- Rule of 500: if a file/module exceeds 500 lines, consider splitting
- Five-axis review: correctness, design, complexity, testing, security
- Change sizing ~100 lines per commit
- Severity labels: Nit / Optional / FYI / Blocking

### Security & Hardening
- OWASP Top 10 prevention
- Validate all user input at boundaries
- Never log secrets or tokens
- JWT tokens stored in localStorage with refresh rotation
- CORS configured for known origins only
- Rate limiting on auth endpoints
- Password hashing with bcrypt (cost factor 12)

### Performance
- Measure first, optimize second
- Frontend targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Bundle analysis — watch for large chunks (>500KB)
- Code-splitting for large dependencies
- Auto-refresh polling with reasonable intervals (30-60s)
- Lazy loading for heavy components

### Git Workflow
- Trunk-based development on `master`
- Atomic commits — one logical change per commit
- Descriptive commit messages (conventional commits preferred)
- Commit-as-save-point pattern — commit frequently
- Never commit broken tests
- Push to remote after each meaningful milestone

### Shipping & Deployment
- Frontend: Vercel auto-deploys on push to master
- Backend: Railway deploys from `backend/` directory
- Environment variables set in platform dashboards
- Health check endpoint at `/health`
- Graceful degradation when services unavailable
- Feature flags for staged rollouts

## Anti-Rationalization Table

| Excuse | Reality |
|--------|---------|
| "This is simple, I don't need a spec" | Simple tasks need acceptance criteria. Two-line spec is fine. |
| "I'll write tests after the code works" | You won't. Tests written after test implementation, not behavior. |
| "I'll test it all at the end" | Bugs compound. Test each slice. |
| "It's faster to do it all at once" | Feels faster until something breaks and you can't find the cause. |
| "I'll add tests later" | Later never comes. Test debt accumulates silently. |
| "The tasks are obvious" | Write them down. Explicit tasks surface hidden dependencies. |
| "Planning is overhead" | Planning IS the task. Implementation without a plan is just typing. |
| "This is just a prototype" | Prototypes become production code. |
| "I tested it manually" | Manual testing doesn't persist. Tomorrow's change might break it. |
| "I'll clean up adjacent code while I'm here" | Scope creep. Note it, don't fix it. Create a separate task. |

## Red Flags

- Writing code without written requirements
- More than 100 lines without running tests
- Multiple unrelated changes in single commit
- "Let me just quickly add this too" scope expansion
- Build or tests broken between increments
- Using mock data when real backend exists
- No error handling for network requests
- Skipping the test/verify step to move faster
- Building abstractions before the third use case demands it
- Touching files outside task scope

## Verification Checklist

Before any commit:
- [ ] Build succeeds (`npm run build` for frontend)
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Changes are atomic and focused
- [ ] No mock data in production code
- [ ] Error handling in place for all async operations
- [ ] Commit message is descriptive

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
