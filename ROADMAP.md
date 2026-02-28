# Autocross Course Designer Roadmap

## Phase 1: Working End-to-End Loop

The goal of Phase 1 is a complete core loop: design a course, save it, retrieve it.

### Course Design Interface
- [x] Basic page structure and navigation
- [x] Canvas-based drawing implementation
- [x] Image upload functionality
- [x] Basic drawing tools (lines, curves)
- [x] Start/finish point placement
- [x] Element definitions with customizable properties
  - [x] Chicago Box
  - [x] Slalom
  - [x] Crossover Box
  - [x] Pointer Cones
  - [x] Gate
  - [x] Chicane
  - [x] Sweeper
  - [x] Offset Slalom
  - [x] Lane Change

### Authentication & Persistence
- [ ] Basic authentication (login/register) — Amplify/Cognito backend exists, frontend integration needed
- [ ] Public homepage accessible without sign-in
- [ ] Fix header displaying user ID hash instead of email/username
- [x] Save course designs to database
- [x] Draft saving and editing
- [x] Courses always tied to an event (fixes voting flow)
- [x] Event status derived from date, not manually set

## Phase 2: Usable Course Design

The goal of Phase 2 is a tool that produces real, usable course designs.

### Map-Based Venue Design
- [x] Boundary line drawing and saving
- [x] Venue information storage
- [x] Mapbox satellite imagery for venue selection
- [x] Venue boundary drawing directly on map
- [x] Course design picks from existing venues (no longer forces new venue creation)
- [ ] Dedicated venue management page — create/edit/list venues outside of course design flow (admin only)
- [ ] Hazard/obstacle placeables on venue layer — poles, barriers, walls (admin sets once; used for automated safety checks)
- [ ] Admin-locked start/finish gate positions on venue
- [ ] Preset venues for admins to add and share
- [ ] Venue sharing between club members

### Course Design Tools
- [ ] Element placement on course
- [ ] Element rotation and scaling
- [ ] Undo/redo
- [ ] Scale/measurement — real-world distances (feet/meters) for element spacing
- [ ] Snap-to-grid for precise placement
- [ ] Cone counting
- [ ] Course annotations: pit location, staging area labels
- [ ] Text boxes and shaded sections for course notes

### Output
- [ ] Export/print course as PDF or image

## Phase 3: Collaboration

### Course Sharing
- [ ] Browse courses by venue or creator
- [ ] Course preview
- [ ] Course metadata (difficulty, style, etc.)
- [ ] Course copying and modification
- [ ] Course-to-event relationship (submit a course for a specific event)

### Voting System
- [ ] Upvote/downvote
- [ ] Time-limited voting periods tied to upcoming events
- [ ] Comments and feedback
- [ ] Featured courses section
- [ ] Notification system for new courses

## Phase 4: Club Administration

### Member & Club Management
- [ ] Role-based permissions (member vs. admin)
- [ ] Club join/invite flow
- [ ] Member management
- [ ] Super admin capabilities

### Event & Course Management
- [ ] Course approval workflow
- [ ] Event scheduling
- [ ] Venue presets management

### Resource Management
- [ ] Cone inventory tracking
- [ ] Venue availability calendar
- [ ] Equipment requirements calculator
- [ ] Hazard management and safety checks

## Phase 5: Advanced Features

### AI Integration
- [ ] Course suggestion algorithm based on venue constraints
- [ ] Optimization recommendations
- [ ] Automated safety checks
- [ ] Course difficulty analysis

### Analytics
- [ ] Estimated run times
- [ ] Heat mapping for speed/technical sections
- [ ] Course comparison tools
- [ ] Historical data analysis

### Mobile
- [ ] Responsive design improvements
- [ ] Touch-friendly interface
- [ ] On-site course setup tools
- [ ] Worker station mapping

## Decisions

- **Vite over CRA** — migrated from Create React App to Vite for faster dev server and build tooling
- **Mapbox GL over Google Maps** — better drawing/interaction support on map layers; @mapbox/mapbox-gl-draw enables direct boundary and course drawing on satellite imagery
- **AWS Amplify** — chosen for auth and backend to reduce infrastructure overhead for a club-scale app
- **AWS region: us-east-1** — initial default; geographically closer to us-west-2 — revisit if latency becomes an issue
- **Gate width: ~20ft (6.1m)** — used as default for start/finish gates; needs verification against current SCCA Solo rules (`GATE_WIDTH_METERS` constant in `MapCourseDesigner.js`)
