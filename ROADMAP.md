# Autocross Course Designer Roadmap

## Phase 1: Working End-to-End Loop

The goal of Phase 1 is a complete core loop: design a course, save it, retrieve it.

### Course Design Interface
- [x] Basic page structure and navigation
- [x] Mapbox satellite map for course design
- [x] Venue boundary visible during course design
- [x] Start/finish gate placement (two-cone gate, ~20ft wide)
- [x] Gate cones draggable to fine-tune position
- [x] Individual cone placement
- [x] Course line drawing (MapboxDraw)
- [x] Cone count tracked

### Authentication & Persistence
- [x] Authentication — Amplify/Cognito with admin group support
- [x] User email/username displayed in nav (not ID hash)
- [x] Save course designs to database
- [x] Draft saving (no event required)
- [x] Courses tied to an event for voting flow
- [x] Event status derived from date, not manually set

### Events & Voting
- [x] Event list with calendar view toggle
- [x] Admin create/edit/delete events
- [x] Admin delete submitted courses
- [x] Vote on courses per event

## Phase 2: Usable Course Design

The goal of Phase 2 is a tool that produces real, usable course designs.

### Map-Based Venue Design
- [x] Venue boundary drawing on satellite map
- [x] Venue information storage
- [x] Course design picks from existing venues
- [x] Dedicated venue management page (admin only)
- [ ] Gate rotation — currently east-west only; need to support arbitrary angle
- [ ] Admin-locked start/finish gate positions on venue
- [ ] Hazard/obstacle placeables on venue layer — poles, barriers, walls (admin sets once; used for automated safety checks later)
- [ ] Preset venues for admins to add and share

### Pre-Made Element Sets
`ElementDefinitions.js` exists with data models but nothing is rendered on the map yet. All of these are unbuilt:
- [ ] Slalom — N cones in a line, configurable spacing
- [ ] Chicago Box
- [ ] Crossover Box
- [ ] Chicane — offset gates
- [ ] Gate
- [ ] Finish straight — parallel rows of cones
- [ ] C-Box

### Course Design Tools
- [ ] Place element sets on map as a unit (stamp and position)
- [ ] Element rotation
- [ ] Course line snap to gate midpoint
- [ ] Undo/redo
- [ ] Real-world distance display (feet/meters between placed cones)
- [ ] Course annotations: pit location, staging area labels

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
