# Design Document — Autocross Course Designer

## Overview

This document describes the technical design for the Autocross Course Designer v1 refactor. The app is a React 19 + Vite single-page application backed by AWS Amplify v6 (Cognito, AppSync/GraphQL, DynamoDB). The design preserves the existing stack entirely — no migrations, no new frameworks.

The refactor scope covers twelve areas of new or significantly changed functionality built on top of the working foundation (auth, event CRUD, venue boundary drawing, basic course placement, vote submission):

1. Gate rotation with correct Haversine-based cone positioning
2. Course element GPS rendering pipeline (all 9 element types)
3. Undo/redo command stack
4. Real-world distance display (Haversine, feet/meters)
5. Course saving/submission flow (DRAFT → SUBMITTED, GeoJSON serialization)
6. Course moderation (SUBMITTED → APPROVED/REJECTED)
7. Voting period management (open/close, vote counts, winner display)
8. Hazard placement on venues
9. Locked start/finish gate positions on venues
10. Course export (PNG + PDF with metadata)
11. Dead code removal (canvas-based CourseDesigner.js)
12. GraphQL schema additions

---

## Architecture

### Component Tree (Target State)

```
App (AuthContext)
├── NavigationBar
└── Routes
    ├── / → EventCalendarPage
    ├── /events/new → EventCreationPage (admin)
    ├── /events/:id/edit → EventEditPage (admin) [new]
    ├── /design/:eventId → CourseDesignPage
    ├── /design → CourseDesignPage (standalone)
    ├── /courses/:id → CourseDetailPage [new]
    ├── /courses/:id/export → CourseExportPage [new]
    ├── /voting/:eventId → VotingPage (refactored)
    ├── /venues → VenueManagementPage (refactored)
    └── * → NotFoundPage [new]
```

### State Management

Global state lives in `AuthContext` (user, isAdmin, signOut). All other state is local to pages or passed via props. No external state library is introduced. The undo/redo stack is owned exclusively by `MapCourseDesigner` as a `useReducer`-based design state.

### Key Module Boundaries

```
src/
  utils/
    geomath.js          ← pure: haversine, metersToOffset, computeGatePositions, feetToMeters
    courseSerializer.js ← pure: serializeCourse, deserializeCourse, countCones
    elementRenderer.js  ← pure: computeElementCones(elementType, params, center, angleDeg)
    undoStack.js        ← pure: createStack, push, undo, redo helpers
  components/
    MapCourseDesigner.js   ← refactored: owns course state + undo stack
    MapVenueSelector.js    ← minimal changes: add locked gate UI
    CourseElementsPanel.js ← refactored: connects to elementRenderer
    ElementPropertiesPanel.js ← refactored: drives element config
    HazardPanel.js         ← new: admin hazard placement UI
    CourseExporter.js      ← new: export to PNG/PDF
    CourseReadOnlyViewer.js ← new: read-only map view for voting page
  pages/
    CourseDesignPage.js    ← refactored: step orchestration
    VotingPage.js          ← refactored: moderation + voting period
    VenueManagementPage.js ← refactored: hazards + locked gates
    CourseDetailPage.js    ← new: full course view + export link
    NotFoundPage.js        ← new
  graphql/
    queries.js   ← add new fields to existing queries
    mutations.js ← add new mutations (approveChallenge, openVoting, etc.)
```

**Files to delete:**
- `src/components/CourseDesigner.js` — canvas-based designer, never rendered in the live app
- `src/components/CourseDesignGuide.js` — unused guide component (verify no imports first)

---

## Data Models

### GraphQL Schema Additions

The existing AppSync schema uses `isDraft: Boolean` and `isPublic: Boolean` on Course. These are replaced/augmented with a proper `status` enum plus new fields. All additions are backward-compatible (new nullable fields).

#### Course (additions)

```graphql
enum CourseStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
}

type Course {
  # existing fields preserved ...
  status: CourseStatus!          # replaces isDraft/isPublic
  geoJson: AWSJSON               # full FeatureCollection as JSON string
  courseLength: Float            # meters, computed at save time
  rejectionReason: String        # set when status = REJECTED
  # isDraft retained for backward compat during migration, then removed
}
```

#### Venue (additions)

```graphql
type HazardItem {
  id: ID!
  type: HazardType!              # CONE_CLUSTER | BARRIER | WALL | POLE | CURB
  lat: Float!
  lng: Float!
  label: String
}

enum HazardType {
  CONE_CLUSTER
  BARRIER
  WALL
  POLE
  CURB
}

type LockedGate {
  lat: Float!
  lng: Float!
  angleDeg: Float!               # 0–359, compass bearing
}

type Venue {
  # existing fields preserved ...
  hazards: [HazardItem]          # stored as AWSJSON array
  lockedStartGate: LockedGate    # stored as AWSJSON object, nullable
  lockedFinishGate: LockedGate   # stored as AWSJSON object, nullable
}
```

#### Event (additions)

```graphql
type Event {
  # existing fields preserved ...
  votingPeriodOpen: Boolean!     # default false
  votingDeadline: AWSDateTime    # optional, informational
}
```

#### Vote (no schema changes needed)

The existing Vote model (courseId, eventId, userId) is sufficient. Vote counts are derived by querying votes by eventId.

### DynamoDB Storage Notes

- `hazards` is stored as a JSON string (AWSJSON type in AppSync) — an array of HazardItem objects. This avoids a separate DynamoDB table for hazards since they are always read/written with the venue.
- `lockedStartGate` and `lockedFinishGate` are stored as AWSJSON objects.
- `geoJson` on Course is stored as AWSJSON (JSON string). AppSync automatically handles serialization.

---

## Components and Interfaces

### `geomath.js` (pure utility)

```js
// Haversine distance in meters between two {lat, lng} points
haversine(a, b) → Float

// Convert meters distance to longitude degree offset at a given latitude
metersToLngOffset(meters, lat) → Float

// Convert meters to latitude degree offset (constant)
metersToLatOffset(meters) → Float

// Compute the two cone positions for a gate
// center: {lat, lng}, angleDeg: 0-359 (direction the gate faces),
// widthMeters: number
// Returns { left: {lat, lng}, right: {lat, lng} }
computeGatePositions(center, angleDeg, widthMeters) → { left, right }

// Convert feet to meters
feetToMeters(feet) → Float

// Convert meters to feet
metersToFeet(meters) → Float
```

### `courseSerializer.js` (pure utility)

```js
// Serialize full course design state → GeoJSON FeatureCollection
serializeCourse(state) → FeatureCollection

// Deserialize GeoJSON FeatureCollection → course design state
deserializeCourse(featureCollection) → CourseState

// Count total cones in serialized form (for P4 invariant)
countConeFeatures(featureCollection) → Int
```

### `elementRenderer.js` (pure utility)

```js
// Compute array of {lat, lng} cone positions for a given element
// elementType: one of the 9 element type keys
// params: element-specific config object
// center: {lat, lng} — placement center
// angleDeg: rotation angle
// Returns: Array<{ lat: Float, lng: Float, role: String }>
computeElementCones(elementType, params, center, angleDeg) → Array<ConePosition>
```

### `undoStack.js` (pure utility)

```js
// Factory: creates a new empty undo stack state
createStack() → StackState   // { past: [], future: [] }

// Push a new state snapshot onto the stack (clears future)
push(stack, snapshot) → StackState

// Undo: returns { stack, snapshot } where snapshot is the previous state
undo(stack, currentSnapshot) → { stack: StackState, snapshot }

// Redo: returns { stack, snapshot } where snapshot is the next state
redo(stack, currentSnapshot) → { stack: StackState, snapshot }

// Predicates
canUndo(stack) → Boolean
canRedo(stack) → Boolean
```

### `MapCourseDesigner.js` (refactored)

Owns the complete mutable course design state. Uses `useReducer` with the undo stack integrated into the reducer.

**Props:**
```js
{
  venue: VenueObject,           // includes hazards, lockedStartGate, lockedFinishGate
  initialCourse: CourseState,   // optional, for reopening a DRAFT
  readOnly: Boolean,            // for the voting page read-only viewer
  onCourseComplete: fn,         // callback with serialized course data
}
```

**State shape (CourseState):**
```js
{
  cones: [{ id, lat, lng }],
  startGate: { center: {lat,lng}, angleDeg, left: {lat,lng}, right: {lat,lng} } | null,
  finishGate: { center: {lat,lng}, angleDeg, left: {lat,lng}, right: {lat,lng} } | null,
  courseLine: [[lng, lat], ...] | null,   // MapboxDraw coordinates
  elements: [{
    id, type, params, center: {lat,lng}, angleDeg,
    cones: [{ lat, lng, role }]           // computed by elementRenderer
  }],
  distanceUnit: 'ft' | 'm',
}
```

**Actions (undoable):**
```
PLACE_CONE, DELETE_CONE,
PLACE_GATE (start|finish), MOVE_GATE_CONE (start|finish, left|right, {lat,lng}), ROTATE_GATE,
PLACE_ELEMENT, DELETE_ELEMENT, ROTATE_ELEMENT,
DRAW_COURSE_LINE, CLEAR_ALL
```

**Non-undoable actions:** CHANGE_DISTANCE_UNIT, SET_ACTIVE_TOOL.

---

### `HazardPanel.js` (new)

Admin-only panel rendered within VenueManagementPage. Allows selecting hazard type, then clicking the map to place a marker. Supports drag-to-reposition and a delete button per hazard. Calls `updateVenue` mutation with the updated hazards array.

### `CourseExporter.js` (new)

Client-side export using the Mapbox GL `map.getCanvas().toDataURL('image/png')` API for PNG capture. For PDF, uses `jsPDF` (to be added as a dependency) to wrap the PNG with a metadata header.

**Export flow:**
1. Hide UI chrome (toolbar, status panel) using CSS visibility toggling
2. Call `map.getCanvas().toDataURL('image/png')` at the map's native pixel ratio
3. Restore UI chrome
4. For PNG: trigger `<a download>` with the data URL
5. For PDF: create `jsPDF`, add metadata header (course name, event, venue, cone count, date), add image, call `doc.save()`

### `CourseReadOnlyViewer.js` (new)

Renders a full Mapbox map initialized from a deserialized `CourseState`. All markers are non-draggable. MapboxDraw is not initialized. Used in `CourseDetailPage` and as a thumbnail generator.

For thumbnail generation: render the map off-screen in a small container (300×200), then capture via `getCanvas().toDataURL()` after the map tiles have loaded (`map.once('idle', ...)`).

---

## Gate Rotation Math Design

### Problem

The existing `metersToLngOffset` function only handles east-west gates (offset along the longitude axis). For arbitrary angles, both the lat and lng components of the offset must be computed, and the perpendicular direction to the gate-facing angle must be found.

### Solution

Gate placement: the user provides a center point `{lat, lng}` and an angle `θ` in degrees (compass bearing — 0 = north, 90 = east, 180 = south, 270 = west). The **gate opening faces direction θ**, so the two cones must be placed **perpendicular to θ** (i.e., at bearing `θ + 90` and `θ - 90` from the center).

```
function computeGatePositions(center, angleDeg, widthMeters):
  // The perpendicular bearing (cones are placed left and right of the facing direction)
  perpBearing = angleDeg + 90   // bearing toward the "right" cone

  halfWidth = widthMeters / 2

  // Right cone: move halfWidth meters along perpBearing from center
  rightLat = center.lat + metersToLatOffset(halfWidth * cos(toRad(perpBearing)))
  rightLng = center.lng + metersToLngOffset(halfWidth * sin(toRad(perpBearing)), center.lat)

  // Left cone: opposite direction
  leftLat = center.lat - metersToLatOffset(halfWidth * cos(toRad(perpBearing)))
  leftLng = center.lng - metersToLngOffset(halfWidth * sin(toRad(perpBearing)), center.lat)

  return { left: {lat: leftLat, lng: leftLng}, right: {lat: rightLat, lng: rightLng} }
```

Where:
- `metersToLatOffset(meters) = meters / 111000` (constant, ~111 km/degree latitude)
- `metersToLngOffset(meters, lat) = meters / (111000 * cos(lat * π / 180))` (varies by latitude)

This is pure Haversine-compatible math. At the distances involved (≤ 10 m), the flat-earth approximation introduced by separating lat/lng offsets introduces negligible error (< 0.1 mm at 45° latitude).

### Gate Rotation UX

Each gate (Start, Finish, or Element Gate) stores `angleDeg` in its state. The UI provides:
- A number input (0–359) below the gate marker when it is selected
- Arrow buttons (+1°, +5°, +10°, -1°, -5°, -10°) for fine/coarse adjustment
- Direct drag of cone markers (which back-computes the new center and angle from the new positions)

When `angleDeg` changes, `ROTATE_GATE` action dispatches to the reducer, which calls `computeGatePositions` and updates both cone positions. No markers are removed and re-placed; marker `.setLngLat()` is called in a `useEffect` that watches the gate state.

### Locked Gates

If `venue.lockedStartGate` is present:
- The Start Gate is initialized from it and the `ROTATE_GATE` and `MOVE_GATE_CONE` actions for the start gate are no-ops
- The gate UI controls are hidden/disabled for the start gate

Same logic applies to `lockedFinishGate`.

---

## Course Element Rendering Pipeline

### Design

`elementRenderer.js` is a pure module that takes parameters and returns GPS positions. No Mapbox or React dependencies. This makes it fully testable.

Each element renders as a flat array of `{ lat, lng, role }` objects. The `role` string identifies the semantic purpose of each cone (e.g., `'slalom_cone'`, `'gate_left'`, `'box_corner_ne'`).

`MapCourseDesigner` takes the cone array from `elementRenderer` and creates one `mapboxgl.Marker` per cone. The element's `id` is stored on each marker's element dataset for hit-testing.

### Element Implementations

All dimensions specified in feet are converted to meters via `feetToMeters` before Haversine math.

**Slalom** (N cones, spacing D ft, offset direction)
```
For i in [0, N-1]:
  along  = i * D_meters  (along the element axis, direction = angleDeg)
  across = (offset == 'Straight') ? 0 :
           (offset == 'Left Offset') ? -(i * offsetStep) :
           (i * offsetStep)
  cone[i] = displace(center, angleDeg, along) displaced perpendicular by across
```

**Chicane** (gateCount, gateWidth, gateSpacing, offsetDistance)
```
For i in [0, gateCount-1]:
  gateCenter = displace(center, angleDeg, i * gateSpacing_m)
  lateralOffset = (i % 2 == 0) ? -(offsetDistance_m / 2) : (offsetDistance_m / 2)
  gateCenter = displace(gateCenter, angleDeg+90, lateralOffset)
  { left, right } = computeGatePositions(gateCenter, angleDeg, gateWidth_m)
  cones.push(left, right)
```

**Chicago Box** (entryWidth, exitWidth, boxLength, boxWidth — all ft)
```
// 4 corners + entry gate pair + exit gate pair = 8 cones
corners: NW, NE, SE, SW computed from center + rotation
entry gate: centered on N edge, width = entryWidth
exit gate: centered on S edge, width = exitWidth
```

**Crossover Box** (boxSize ft)
```
// 4 corner cones forming a square
corners at ±(boxSize/2)_m in both axes from center, rotated by angleDeg
```

**Sweeper** (radius, arcAngle, coneSpacing — radius and spacing in ft)
```
numCones = floor(arcAngleDeg / (coneSpacingDeg)) + 1
where coneSpacingDeg = (coneSpacing_m / circumference) * 360
  and circumference = 2π * radius_m
For i in [0, numCones-1]:
  bearingFromCenter = startBearing + i * coneSpacingDeg
  cone[i] = displace(arcCenter, bearingFromCenter, radius_m)
arcCenter is offset from placement center by radius_m perpendicular to angleDeg
```

**Gate** (width ft) — delegates to `computeGatePositions`

**Pointer Cones** (count, direction)
```
For i in [0, count-1]:
  cone[i] = displace(center, direction, i * 0.5_m)   // tight cluster
  // role = 'pointer', stored with angleDeg for rotated arrow rendering
```

**Offset Slalom** (sections, conesPerSection, spacing, offsetDistance)
```
For s in [0, sections-1]:
  sectionStart = displace(center, angleDeg, s * (conesPerSection-1) * spacing_m)
  lateralOffset = s * offsetDistance_m * (s%2 == 0 ? 1 : -1)
  sectionCenter = displace(sectionStart, angleDeg+90, lateralOffset)
  For c in [0, conesPerSection-1]:
    cone = displace(sectionCenter, angleDeg, c * spacing_m)
```

**Lane Change** (laneWidth, transitionLength, laneCount)
```
// Creates parallel gate pairs connected by a diagonal transition
Gate 1: entry, centered at center, width = laneWidth * laneCount
Gate 2: exit, offset forward by transitionLength_m and laterally by laneWidth_m
cones: gate1.left, gate1.right, gate2.left, gate2.right
```

### Helper: `displace(origin, bearingDeg, distanceMeters)`
```
lat2 = origin.lat + metersToLatOffset(distanceMeters * cos(toRad(bearingDeg)))
lng2 = origin.lng + metersToLngOffset(distanceMeters * sin(toRad(bearingDeg)), origin.lat)
return { lat: lat2, lng: lng2 }
```

---

## Undo/Redo Architecture

### Approach: Snapshot-Based with Action Records

A **snapshot approach** is used (store full state snapshots, not command objects). Rationale:

- The course state is small (typically < 100 cones, each is 3 numbers + an id)
- Snapshots are trivially serializable to JSON
- No need to implement inverse operations for every action type
- Simpler to reason about correctness (P8, P9 in requirements)

A **command pattern** would be more memory-efficient for large histories but adds significant complexity. At autocross scale, snapshot overhead is negligible.

### Stack Structure

```js
// undoStack state lives inside the reducer state
{
  past: [snapshot_0, snapshot_1, ...],   // oldest → most recent
  future: [snapshot_n, ...],             // most recent undone → oldest undone
  current: snapshot_current
}
```

### Reducer Integration

```js
function courseReducer(state, action) {
  switch (action.type) {
    case 'PLACE_CONE':
    case 'DELETE_CONE':
    case 'PLACE_GATE':
    case 'MOVE_GATE_CONE':
    case 'ROTATE_GATE':
    case 'PLACE_ELEMENT':
    case 'DELETE_ELEMENT':
    case 'ROTATE_ELEMENT':
    case 'DRAW_COURSE_LINE':
    case 'CLEAR_ALL': {
      const nextCurrent = applyAction(state.current, action)
      return {
        past: [...state.past, state.current],
        future: [],
        current: nextCurrent
      }
    }
    case 'UNDO': {
      if (state.past.length === 0) return state
      const prev = state.past[state.past.length - 1]
      return {
        past: state.past.slice(0, -1),
        future: [state.current, ...state.future],
        current: prev
      }
    }
    case 'REDO': {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        past: [...state.past, state.current],
        future: state.future.slice(1),
        current: next
      }
    }
    default:
      return state
  }
}
```

### Keyboard Shortcuts

```js
useEffect(() => {
  function onKeyDown(e) {
    const mod = e.metaKey || e.ctrlKey
    if (mod && e.key === 'z' && !e.shiftKey) dispatch({ type: 'UNDO' })
    if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) dispatch({ type: 'REDO' })
  }
  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}, [dispatch])
```

---

## GeoJSON Serialization Schema

A saved Course is stored as a single GeoJSON `FeatureCollection` in the `geoJson` field of the Course record. This is the canonical representation from which all derived data (cone count, distance, map display) is computed.

### Feature Types

```json
{
  "type": "FeatureCollection",
  "features": [

    // Course line
    {
      "type": "Feature",
      "geometry": { "type": "LineString", "coordinates": [[lng, lat], ...] },
      "properties": { "featureType": "course_line" }
    },

    // Individual cone
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [lng, lat] },
      "properties": { "featureType": "cone", "id": "uuid" }
    },

    // Start gate line (visual only)
    {
      "type": "Feature",
      "geometry": { "type": "LineString", "coordinates": [[lng, lat], [lng, lat]] },
      "properties": {
        "featureType": "start_gate",
        "centerLat": 0.0, "centerLng": 0.0, "angleDeg": 0.0
      }
    },

    // Start gate cones (countable)
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [lng, lat] },
      "properties": { "featureType": "start_gate_cone", "side": "left" }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [lng, lat] },
      "properties": { "featureType": "start_gate_cone", "side": "right" }
    },

    // Finish gate — same structure with featureType: "finish_gate" / "finish_gate_cone"

    // Course element (one entry per element, stores config for re-edit)
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [centerLng, centerLat] },
      "properties": {
        "featureType": "element",
        "id": "uuid",
        "elementType": "slalom",
        "angleDeg": 45.0,
        "params": { "coneCount": 5, "spacing": 25, "offset": "Straight" }
      }
    },

    // Element cones (one per cone, tagged with parent element id)
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [lng, lat] },
      "properties": {
        "featureType": "element_cone",
        "elementId": "uuid",
        "role": "slalom_cone",
        "index": 0
      }
    }

  ]
}
```

### Cone Count Rule

The `coneCount` stored on the Course record equals the count of features where `featureType` is one of: `cone`, `start_gate_cone`, `finish_gate_cone`, `element_cone`.

### Deserialization

`deserializeCourse(fc)` reconstructs `CourseState` from the FeatureCollection:
- Filters by `featureType` to rebuild each state slice
- Groups `element_cone` features by `elementId` to reassemble elements (cones array does not need to be re-derived from params — it's stored directly)
- The `params` on the `element` feature allows re-editing element properties without losing config

---

## Course Status State Machine

```
          ┌───────────────────────────────────────────────────────┐
          │                                                       │
  CREATE  ▼                                                       │ WITHDRAW (member)
  ──────► DRAFT ──SUBMIT──► SUBMITTED ──APPROVE──► APPROVED      │ or ADMIN OVERRIDE
              ▲             │                                     │
              │             ├──REJECT──► REJECTED ──────────────►┘
              │             │
              └─────────────┘ (admin edits course in-place, status stays SUBMITTED)
```

### Transition Rules

| From | Action | To | Who | Conditions |
|---|---|---|---|---|
| (none) | Create | DRAFT | Member/Admin | Always |
| DRAFT | Submit | SUBMITTED | Member/Admin | Start gate + Finish gate + Course line placed |
| DRAFT | Delete | (gone) | Member/Admin | Owner only, or Admin |
| SUBMITTED | Approve | APPROVED | Admin only | — |
| SUBMITTED | Reject | REJECTED | Admin only | Rejection reason required |
| SUBMITTED | Withdraw | DRAFT | Member (owner) or Admin | Allows continued editing |
| REJECTED | Re-submit | SUBMITTED | Member (owner) | After revision |
| APPROVED | — | APPROVED | — | Locked; Admin can force-edit |
| Any | Admin delete | (gone) | Admin only | — |

### Implementation

Course status transitions are handled by `updateCourse` mutations. The `status` field is written by the client; AppSync resolver authorization rules enforce who may write each transition. GraphQL input types for `UpdateCourseInput` include `status`, `rejectionReason`.

The App does not implement a dedicated Lambda resolver for status transitions in v1 — client-side authorization checks (guarded by `isAdmin`) are sufficient for the club-internal trust model.

---

## Voting Period State Machine

```
  Event created
       │
       ▼
  VOTING_CLOSED ──── Admin opens voting ────► VOTING_OPEN
       ▲                                          │
       │                                          │
       └──────── Admin closes voting ─────────────┘
                 (or votingDeadline passes — client-side check only in v1)
```

### State Storage

`votingPeriodOpen: Boolean` on the Event record (new field). Toggled by Admin via `updateEvent` mutation.

### Voting Rules (enforced client-side)

```js
canVote(event, currentUser, userVotes) =>
  event.votingPeriodOpen
  && !userVotes.some(v => v.eventId === event.id)
  && event.status === 'upcoming'   // derived from date
```

### Winner Display

When `votingPeriodOpen` becomes `false`, `VotingPage` sorts courses by descending vote count. The top course is rendered with a prominent "Winner" banner. Ties are broken by earliest submission time (`createdAt`).

### Vote Count Derivation

Vote counts are not stored on Course records in v1. They are derived by: querying all Votes for the Event, then grouping by `courseId` and counting. This is done once at page load and refreshed on interval (30s) while on the VotingPage.

---

## Component Responsibilities

### What Gets Refactored vs. Built New

| Component | Action | Key Changes |
|---|---|---|
| `MapCourseDesigner.js` | **Refactor** | Add useReducer + undo stack; gate rotation; element markers from elementRenderer; distance display; locked gate support; COURSE_LINE tool properly toggled |
| `CourseElementsPanel.js` | **Refactor** | Wire to elementRenderer; trigger element placement flow |
| `ElementPropertiesPanel.js` | **Refactor** | Drive element re-configuration; update element cones on param change |
| `MapVenueSelector.js` | **Refactor** | Add locked gate placement UI (click-to-place + rotation input) |
| `VotingPage.js` | **Refactor** | Course status filtering; vote count display; winner banner; voting period open/close button; course card with thumbnail; moderation approve/reject for admins |
| `VenueManagementPage.js` | **Refactor** | Add hazard panel; add locked gate UI; add edit venue support |
| `CourseDesignPage.js` | **Refactor** | Pass full venue (with hazards + locked gates) to designer; plumb DRAFT save vs. SUBMIT action; allow re-opening DRAFTs |
| `NavigationBar.js` | **Minor** | Add 404-safe route guards; fix display name resolution |
| `App.js` | **Minor** | Add new routes; add 404 route; fix `admins` group name casing check |
| `HazardPanel.js` | **New** | Admin hazard type selector + map click handler |
| `CourseExporter.js` | **New** | PNG + PDF export using map canvas API + jsPDF |
| `CourseReadOnlyViewer.js` | **New** | Read-only Mapbox view of a deserialized CourseState |
| `CourseDetailPage.js` | **New** | Full course view + export button + back to event |
| `NotFoundPage.js` | **New** | 404 page |
| `geomath.js` | **New** | All geospatial pure functions |
| `courseSerializer.js` | **New** | GeoJSON round-trip |
| `elementRenderer.js` | **New** | All 9 element GPS computations |
| `undoStack.js` | **New** | Snapshot stack helpers |
| `CourseDesigner.js` | **DELETE** | Canvas-based, never used |
| `CourseDesignGuide.js` | **DELETE** (verify) | Unused guide |

### State Ownership Summary

| State | Owned By |
|---|---|
| User / isAdmin | `App` via `AuthContext` |
| Events list | `EventCalendarPage` (local) |
| Venues list | `VenueManagementPage` (local) |
| Course design (cones, gates, elements, undo stack) | `MapCourseDesigner` via `useReducer` |
| Active tool | `MapCourseDesigner` (local, not undoable) |
| Distance unit | `MapCourseDesigner` (local, not undoable) |
| Courses for event + vote counts | `VotingPage` (local) |
| Selected element type + params | `CourseDesignPage` → passed to `MapCourseDesigner` |
| Export state (loading, format) | `CourseExporter` (local) |

---

## Distance Display Design

All distances use `haversine(a, b)` from `geomath.js`. Distances are computed in meters internally and converted to feet or meters for display based on the `distanceUnit` toggle.

### Live Cone-to-Cone Distance

When exactly two cones are selected simultaneously, a status panel line shows:
```
Selected cone distance: 24.3 ft
```

### Course Length

The course line polyline is measured as a sum of segment Haversine distances. Updated each time the `courseLine` state changes. Displayed in the status panel.

### Hover Tooltip

On mouseenter of a cone marker, the tooltip logic:
1. Identifies which element the cone belongs to (if any) — uses the next cone in the same element as "adjacent"
2. For standalone cones: finds the nearest other cone (any type) within 50m
3. Shows tooltip only if an adjacent cone is found
4. Tooltip content: `"→ 18.7 ft"` (no label; distance only to keep it minimal)

---

## Export Approach

### PNG Export

```js
// 1. Set map pixel ratio for high DPI
map.setPixelRatio(3)  // 3× for print quality

// 2. Wait for idle
await new Promise(resolve => map.once('idle', resolve))

// 3. Capture
const dataUrl = map.getCanvas().toDataURL('image/png')

// 4. Trigger download
const a = document.createElement('a')
a.href = dataUrl
a.download = `${courseName}-${date}.png`
a.click()

// 5. Restore pixel ratio
map.setPixelRatio(window.devicePixelRatio)
```

### PDF Export

Requires adding `jspdf` as a dependency. The PDF includes:
- **Header section** (top 15% of page): Course Name, Event Name, Venue Name, Cone Count, Date
- **Map image** (remaining 85%): the PNG at A4/Letter landscape
- Filename: `{courseName}-{date}.pdf`

```js
import jsPDF from 'jspdf'

const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
// Header
doc.setFontSize(16)
doc.text(courseName, 14, 15)
doc.setFontSize(10)
doc.text(`Event: ${eventName} | Venue: ${venueName} | Cones: ${coneCount} | Date: ${date}`, 14, 22)
// Map image
doc.addImage(dataUrl, 'PNG', 14, 30, pageWidth - 28, pageHeight - 40)
doc.save(`${courseName}-${date}.pdf`)
```

### Error Handling

If `getCanvas().toDataURL()` throws (e.g. canvas is tainted by cross-origin tiles), the error is caught and displayed as a user-visible message. No partial file is produced. Mapbox satellite tiles are served from the same Mapbox CDN as the SDK and are not cross-origin tainted when using a valid access token.

---

## Error Handling

### Network / GraphQL Errors

All GraphQL calls follow a consistent pattern:
```js
try {
  const result = await client.graphql({ ... })
  // handle result
} catch (err) {
  // Show user-visible error, do not throw
  setError('Descriptive message. Internal: ' + err.message logged to console only)
}
```

Error messages are displayed in a visible `<div className="error-message">` near the triggering action. Internal error details (GraphQL error codes, stack traces) are logged to `console.error` only and never shown to users (Req 1.4).

### Authorization Errors

Admin-only actions protected at both the UI layer (controls hidden from Members) and the API layer (AppSync authorization rules). If an API call returns an authorization error (should not happen in normal flow), the UI displays a generic "You are not authorized to perform this action." message.

### Validation

- Course submission blocked until Start Gate + Finish Gate + Course Line are all present
- Course name required before save — validated on submit, field-level error displayed
- Event name + date required before create — field-level errors displayed
- Venue name + boundary required before confirm

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The feature involves pure utility functions (`geomath.js`, `elementRenderer.js`, `courseSerializer.js`, `undoStack.js`) that are excellent candidates for property-based testing. The property-based testing library used is **fast-check** (JavaScript), already compatible with Vite's test runner (Vitest).

**Property reflection:** After prework analysis, several requirements map to properties already stated in the requirements document (P1–P14). The properties below consolidate and extend these into testable specifications tied to implementation functions.

---

### Property 1: Gate Width Invariant

*For any* center coordinate, rotation angle θ ∈ [0, 360), and gate width W, the Haversine distance between the two cone positions returned by `computeGatePositions(center, θ, W)` shall equal W within 0.01 m tolerance.

**Validates: Requirements 7.5, P1**

---

### Property 2: Gate Rotation Confluence

*For any* center coordinate and angles α, β ∈ [0, 360), calling `computeGatePositions(center, β, W)` directly shall produce the same cone positions as first computing `computeGatePositions(center, α, W)` and then `computeGatePositions(center, β, W)` (i.e., the function is stateless and order-independent).

**Validates: Requirements 7.4, P2**

---

### Property 3: Gate Perpendicularity

*For any* center coordinate and rotation angle θ, the vector from the left cone to the right cone returned by `computeGatePositions` shall be perpendicular to θ within 0.1° tolerance. (The dot product of the gate vector and the unit vector in direction θ shall be ≤ sin(0.1° in radians).)

**Validates: Requirements 7.2**

---

### Property 4: Course GeoJSON Round-Trip

*For any* course design state S (with arbitrary cones, gates, elements, and course line), `deserializeCourse(serializeCourse(S))` shall produce a state S′ where all cone positions, gate positions/angles, course line coordinates, and element params of S′ equal those of S within floating-point representation tolerance.

**Validates: Requirements 11.6, P3**

---

### Property 5: Cone Count Invariant

*For any* course design state S, `S.coneCount` computed by `countConeFeatures(serializeCourse(S))` shall equal the number of individual, start_gate_cone, finish_gate_cone, and element_cone features in the FeatureCollection. (Property 3 and 4 together imply this, but it is worth testing independently since cone count is displayed to the user.)

**Validates: Requirements 11.10, P4**

---

### Property 6: Slalom Spacing Invariant

*For any* slalom with N ∈ [3,7] cones and spacing D ∈ [10,50] ft, placed at any angle θ and any valid center coordinate, `computeElementCones('slalom', {coneCount: N, spacing: D, offset: 'Straight'}, center, θ)` shall return exactly N cone positions where the Haversine distance between each adjacent pair is D feet within 0.1 ft tolerance.

**Validates: Requirements 8.7, P5**

---

### Property 7: Element Cone Count Matches Params

*For any* valid element type and any valid parameter combination, the length of the array returned by `computeElementCones` shall equal the expected cone count for that element type and those parameters. (This subsumes separate count checks for each element type into one parameterized property.)

**Validates: Requirements 8.3, 8.5, 8.7–8.15**

---

### Property 8: Haversine Symmetry

*For any* two GPS coordinates A and B, `haversine(A, B)` shall equal `haversine(B, A)` within floating-point tolerance.

**Validates: Requirements 9.5, P6**

---

### Property 9: Haversine Triangle Inequality

*For any* three GPS coordinates A, B, C, `haversine(A, C)` shall be ≤ `haversine(A, B) + haversine(B, C)` (with tolerance for floating-point rounding).

**Validates: P7**

---

### Property 10: Undo Round-Trip

*For any* undoable action A and prior course state S, `dispatch(UNDO)` after `dispatch(A)` shall return the course `current` snapshot to a state equal to S.

**Validates: Requirements 10.3, P8**

---

### Property 11: Full Undo/Redo Sequence

*For any* sequence of N undoable actions [A₁…Aₙ] applied from initial state S₀, undoing all N actions shall return `current` to a state equal to S₀, and redoing all N actions shall return `current` to the state after applying all N actions.

**Validates: Requirements 10.4, P9**

---

### Property 12: Venue Boundary Closed Ring

*For any* boundary polygon produced by `MapVenueSelector` (via MapboxDraw), the coordinate array stored by the App shall have `boundary[0]` equal to `boundary[boundary.length - 1]` and `length ≥ 4`.

**Validates: Requirements 3.3, P13**

---

### Property 13: GeoJSON Coordinate Validity

*For any* course design state S, every coordinate in `serializeCourse(S)` shall have longitude ∈ [-180, 180] and latitude ∈ [-90, 90].

**Validates: P12**

---

### Property 14: Vote Count Invariant

*For any* event E with a list of votes [V₁…Vₖ] where each vote has a distinct userId and each userId appears at most once across all votes for E, the sum of per-course vote counts shall equal the number of votes in the list.

**Validates: Requirements 13.2, P10**

---

### Property 15: Vote Ranking Sort Order

*For any* list of courses with vote counts, sorting by `rankedCourses(courses)` shall produce a list in non-increasing order of vote count.

**Validates: Requirements 13.6, P11**

---

### Property 16: Event Status Derivation

*For any* event date D and current time T (both as Date objects), the function `deriveEventStatus(D, T)` shall return `'upcoming'` if and only if `D ≥ T` (date-only comparison), and `'completed'` otherwise.

**Validates: Requirements 5.6, P14**

---

### Property 17: Role Derivation from Cognito Groups

*For any* array of Cognito group names, `deriveIsAdmin(groups)` shall return `true` if and only if the array includes `'admins'` (case-sensitive), and `false` for all other arrays including empty.

**Validates: Requirements 1.8, 2.1–2.6**

---

### Property 18: Course Status Transition Validity

*For any* course with a given status and actor role, the set of valid next statuses is determined solely by the current status and the actor role, as specified in the state machine table. `canTransition(currentStatus, nextStatus, actorRole)` shall return `true` only for the permitted transitions.

**Validates: Requirements 11.4, 11.8, 12.2, 12.3**

---

## Testing Strategy

### Dual Testing Approach

Unit/example tests cover specific UI behaviors, integration points, and error conditions. Property tests (using fast-check + Vitest) validate universal correctness of all pure utility functions.

### Property Test Configuration

- Library: **fast-check** (`npm install --save-dev fast-check`)
- Test runner: **Vitest** (already present via Vite)
- Each property test runs **minimum 100 iterations** (fast-check default is 100; increase to 1000 for critical math properties)
- Tag format: `// Feature: autocross-course-designer, Property N: {property_text}`

### Property Test File Structure

```
src/
  utils/
    __tests__/
      geomath.property.test.js        ← Properties 1, 2, 3, 8, 9, 16, 17
      courseSerializer.property.test.js ← Properties 4, 5, 13
      elementRenderer.property.test.js  ← Properties 6, 7
      undoStack.property.test.js        ← Properties 10, 11
      voting.property.test.js           ← Properties 14, 15
      courseStatus.property.test.js     ← Properties 12, 18
```

### Unit Tests (example-based)

```
src/
  components/__tests__/
    MapCourseDesigner.test.js   ← tool switching, gate placement UI, locked gate behavior
    CourseExporter.test.js      ← mock canvas, verify download triggered
  pages/__tests__/
    VotingPage.test.js          ← voting period open/closed UI, winner display
    VenueManagementPage.test.js ← hazard CRUD, admin controls hidden from members
    CourseDesignPage.test.js    ← step navigation, save validation
```

### Integration Tests

- GraphQL mutation calls are integration-tested against a local AppSync mock or by inspecting `client.graphql` call arguments with `vi.mock`
- Export: canvas capture tested with a mocked `getCanvas().toDataURL()` (JSDOM doesn't render a real canvas)
- Auth: Cognito calls mocked; token refresh flow tested with mock session

### What Is Not Unit Tested

- Mapbox GL rendering (black box; tested manually)
- AWS Cognito sign-up/sign-in (external service; smoke tested manually)
- PDF visual layout (jsPDF output; verified by opening generated file)
