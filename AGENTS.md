# Repository Guidelines

## Project Structure & Module Organization
This repository is a small Vite + React + TypeScript app. Application entry points live in `src/main.tsx` and `src/app/App.tsx`. The main feature code is under `src/app/components/audioSystem/`, where runtime logic, presets, hooks, and dashboard UI are grouped by concern. Shared global styles live in `src/index.css`; app-level styles live in `src/app/App.css`. Static files belong in `public/`. Production output is generated in `dist/` and should not be edited manually.

## Build, Test, and Development Commands
Use the existing `pnpm-lock.yaml` and prefer `pnpm`.

- `pnpm install`: install dependencies
- `pnpm dev`: start the Vite dev server
- `pnpm build`: run TypeScript project build and create the production bundle
- `pnpm lint`: run ESLint on all source files
- `pnpm preview`: serve the built app locally for verification

If you use `npm`, keep commands equivalent to the scripts in `package.json`.

## Coding Style & Naming Conventions
Write TypeScript and React using ES modules and functional components. Use `PascalCase` for component/type names (`AmbientDashboard`), `camelCase` for variables and functions (`handleVolumeChange`), and kebab-case for feature files in `audioSystem/` (`ambient-runtime.tsx`, `use-ambient.ts`). Follow the existing code style in the touched file: some files currently use semicolons, others do not, so avoid broad formatting churn. Default to 2-space indentation in new code. Run `pnpm lint` before opening a PR.

## Testing Guidelines
There is currently no test runner configured. For now, validate changes with `pnpm lint`, `pnpm build`, and manual checks in `pnpm dev`. When adding tests, place them next to the feature or in a dedicated `src/__tests__/` folder, and use `*.test.ts` or `*.test.tsx` naming consistently.

## Commit & Pull Request Guidelines
Git history is minimal and currently uses short, plain subjects (`first commit`). Keep commit messages concise, imperative, and specific, for example: `add ambient volume toggle`. Pull requests should include a short summary, the user-visible impact, manual verification steps, and screenshots or recordings for UI changes.

## Configuration Notes
Do not commit changes to `dist/` or ad hoc generated assets unless a release process explicitly requires them. Keep large binary assets out of `src/` unless they are required by the app at runtime.
