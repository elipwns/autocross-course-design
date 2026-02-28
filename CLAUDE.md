# Autocross Course Designer

A web app for designing autocross courses — drawing venue layouts, placing course elements, sharing designs with club members, and voting on courses.

## Stack
- React 19 + Vite (JavaScript, no TypeScript)
- AWS Amplify (auth + backend)
- Mapbox GL / react-map-gl (venue maps)
- React Router v7
- `npm run dev` to start dev server

## Project Structure
- `src/components/` — shared UI components
- `src/pages/` — page-level components (one per route)
- `src/graphql/` — Amplify GraphQL queries/mutations
- Infrastructure lives in a separate Terraform repo

## Docs
@ROADMAP.md
@ARCHITECTURE.md
