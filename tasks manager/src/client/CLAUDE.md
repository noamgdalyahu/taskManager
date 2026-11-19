# Client: React / TypeScript

Applies to everything under `src/client`. The server is documented in `src/server/CLAUDE.md`; the API contract is the
running server's OpenAPI document.

## Stack (decided by the user)
- **Vite + React + TypeScript** (strict). Plain single-page app talking to the C# API. No Next.js, no server components.
- **MUI** (`@mui/material`, Emotion) for every component. Style through the theme and `sx`/`styled`, not ad-hoc CSS files.
- **Server communication: `axios`** (decided by the user), only inside `src/api/http.ts`. Components and hooks call `http()`;
  nothing else imports axios or `fetch`.
- Router: `react-router-dom`. Server state: TanStack Query. Motion/springs: `motion`. Drag and drop: `@dnd-kit`.
- Language of the UI: English. Mockups: `https://claude.ai/artifact/1fzaYj6C4crzqHGvjQfYAp` (sprint planning, sprint board,
  manager dashboard, my tasks). They set the layout and colours; the apple-design skill sets how it feels.

## File tree rules (decided by the user, do not drift)
The tree mirrors the server's one-folder-per-page idea:

1. **Each part (page) of the website gets its own folder** in `src/` (for example `Dashboard/`, `Board/`, `SprintPlanning/`).
2. **Each component has its own folder**, named after the component, holding the component file
   (`StatCard/StatCard.tsx`) and anything that belongs only to it (hook, styles, test, types).
3. **A component's child components live inside the parent component's folder**, nested as deep as the real
   parent/child relationship goes:
   ```
   Dashboard/
     Dashboard.tsx
     BurndownChart/
       BurndownChart.tsx
       BurndownLegend/
         BurndownLegend.tsx
   ```
4. **A component used in more than one part of the website goes in `src/common/`.** A component used only in one part
   stays inside that part's folder, inside the parent that uses it. When a second part starts using it, move it to `common/`.
5. **Not components** live beside the pages, not inside them: `src/api/` (HTTP client, generated types, query hooks),
   `src/theme/` (MUI theme, tokens, springs), `src/auth/`, `src/routes/`.
6. **No barrel files** (`index.ts` re-exports). Import each file by its path (`@/common/StatCard/StatCard`). This is both
   the Vercel bundle rule and keeps "go to definition" honest.
7. One component per file, named export, file name equals component name. Hooks start with `use` and sit next to the
   component that owns them.

## Design (apple-design skill, applied through the MUI theme)
- **Response:** press feedback is instant (`:active` scale 0.97, 100 ms), on pointer-down, not on release.
- **Direct manipulation:** drags track 1:1 and keep the grab offset; release hands velocity to a spring.
- **Interruptible motion:** use springs (`motion`), default critically damped (`bounce: 0`, 0.3-0.4 s); add bounce only
  after a flick. Never CSS transitions for anything gesture-driven.
- **Materials:** sidebar and top bar are translucent (`backdrop-filter: blur(20px) saturate(180%)`), content scrolls under.
  Never stack a light translucent surface on another. Hairline top edge on materials.
- **Typography:** system font first (`-apple-system`, SF Pro, `system-ui`), Inter as the fallback to match the mockups.
  Tracking is size-specific: negative on large headings, near 0 on body. Leading is tight on large text, looser on body.
  Sizes in `rem`.
- **Accessibility:** honour `prefers-reduced-motion` (cross-fade, no springs/overshoot), `prefers-reduced-transparency`
  (solid surfaces), `prefers-contrast: more` (solid with border). Touch targets at least 44 px. Real buttons and links.
- **Principles to reason with:** purpose, agency (undo for slips, confirm only destructive actions), familiarity,
  simplicity (not minimalism), craft. Labels are specific ("Sprint board"), never vague ("Home").
- The mockup palette is the source of truth for colour: primary `#3B4FD9`, canvas `#F6F7F9`, card `#FFFFFF` with
  `#E3E6EC` border and 12 px radius, text `#1B2130`, muted `#5B6475`, critical-path chip `#1B2130`, warning `#8A3B00` on
  `#FFE9D6`, forecast line `#B85A00`.

## React performance (vercel-react-best-practices skill; Next.js-only rules do not apply)
- Start independent requests together (`Promise.all` / parallel queries); never chain fetches that do not depend on each other.
- No barrel imports; import MUI icons per icon (`@mui/icons-material/Add`), never from the package root.
- Lazy-load route pages and heavy parts (`React.lazy`), so the login screen does not ship the dashboard.
- Derive values during render, not in effects. Do not define components inside components. Use primitive effect dependencies.
- Use `startTransition` / `useDeferredValue` for non-urgent updates. Hoist static JSX and default props.
- Use `Map`/`Set` for repeated lookups; combine passes over arrays.

## Talking to the server
- Dev: Vite proxies `/api` to `http://localhost:5263` (the server's `launchSettings.json` port), so no CORS in development.
- Types in `src/api/schema.d.ts` are generated from the server's OpenAPI document (`npm run api:types`, server running).
  Do not hand-edit them.
- Auth: JWT bearer from `POST /api/auth/login`. Role (`Manager` or `Member`) decides which screens exist; the server
  enforces it too, the client only hides what is not allowed.
- Planning runs as a background job: `POST /api/sprints/{id}/plan` returns 202, then poll `GET /api/plan-jobs/{id}`.
- Demo data: `dotnet run --project tools/SprintManager.Seed -- --reset` in `src/server`; login `noa@demo.sprintmanager.local`
  (manager) or `avi@...` (member), password `Demo1234!`.

## Workflow
- `npm run dev`, `npm run build` (type-checks), `npm run lint` from `src/client`.
- Verify UI changes in a real browser before reporting them done, including the narrow (phone) width.
