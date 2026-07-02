# Implementation Plan: Autocross Course Designer (v1 Refactor)

## Overview

This plan refactors the existing React + Mapbox + Amplify application from a canvas-based, limited
course designer into a full GPS-accurate, feature-complete club management tool. The implementation
order is: dead code removal → pure utility modules + property tests → GraphQL/data layer → component
refactors → new components → final wiring and integration.

Stack: React 19 + Vite, JavaScript (no TypeScript), AWS Amplify v6, Mapbox GL + mapbox-gl-draw,
React Router v7. Test runner: Vitest. Property-based tests: fast-check. Export: jsPDF.

---

## Tasks

- [x] 1. Project setup: add dependencies and remove dead code
  - [x] 1.1 Add fast-check, jspdf, and vitest/test dependencies
    - In `package.json`, add `fast-check` as a devDependency and `jspdf` as a production dependency
    - Also add `vitest`, `@vitest/ui`, `jsdom`, and `@testing-library/react` as devDependencies if
      not already present; confirm `vite.config.js` has a `test` block pointing at jsdom
    - Run `npm install` to confirm no resolution errors
    - _Requirements: 15.3 (jsPDF for PDF export), design testing strategy_
  - [x] 1.2 Delete dead canvas-based components
    - Verify `src/components/CourseDesigner.js` has no live imports (check `src/components/index.js`
      and all pages — it is exported from index.js; remove that export line first)
    - Delete `src/components/CourseDesigner.js`
    - Verify `src/components/CourseDesignGuide.js` has no imports anywhere in the codebase
    - Delete `src/components/CourseDesignGuide.js`
    - Run `npm run build` and confirm zero import errors
    - _Requirements: Design §"Files to delete"_


- [x] 2. Implement `src/utils/geomath.js` — pure geospatial helpers
  - [x] 2.1 Write `geomath.js` with all pure functions
    - Implement `haversine(a, b)` returning distance in meters between two `{lat, lng}` points
      using the standard Haversine formula
    - Implement `metersToLatOffset(meters)` = `meters / 111000`
    - Implement `metersToLngOffset(meters, lat)` = `meters / (111000 * cos(lat * π / 180))`
    - Implement `feetToMeters(feet)` and `metersToFeet(meters)` conversion helpers
    - Implement `computeGatePositions(center, angleDeg, widthMeters)` using the perpendicular
      bearing math from the design (perpBearing = angleDeg + 90; offset left/right by halfWidth)
    - Implement `displace(origin, bearingDeg, distanceMeters)` helper used by elementRenderer
    - Implement `deriveEventStatus(eventDate, now)` returning `'upcoming'` or `'completed'`
      (date-only comparison: upcoming if eventDate >= date portion of now)
    - Implement `deriveIsAdmin(groups)` returning true iff the array includes `'admins'`
      (case-sensitive; fixes current bug in App.js which checks `'Admin'`)
    - Export all functions as named exports
    - _Requirements: 5.6, 7.2, 7.5, 9.5, 1.8_
  - [ ]* 2.2 Write property tests for geomath.js (Properties 1, 2, 3, 8, 9, 16, 17)
    - Create `src/utils/__tests__/geomath.property.test.js`
    - **Property 1: Gate Width Invariant** — for any center, θ ∈ [0,360), width W,
      `haversine(computeGatePositions(c,θ,W).left, computeGatePositions(c,θ,W).right)` ≈ W ±0.01m
    - **Property 2: Gate Rotation Confluence** — `computeGatePositions(c,β,W)` gives same result
      whether called directly or after any prior angle α (function is stateless)
    - **Property 3: Gate Perpendicularity** — left-to-right vector is perpendicular to θ ±0.1°
    - **Property 8: Haversine Symmetry** — `haversine(A,B) === haversine(B,A)`
    - **Property 9: Haversine Triangle Inequality** — `haversine(A,C) ≤ haversine(A,B)+haversine(B,C)`
    - **Property 16: Event Status Derivation** — `deriveEventStatus(D,T)` = 'upcoming' iff D ≥ T
    - **Property 17: Role Derivation** — `deriveIsAdmin(['admins'])` = true; all other arrays false
    - Run with `npx vitest run src/utils/__tests__/geomath.property.test.js`
    - _Requirements: 7.5, 7.4, 7.2, 9.5, 5.6, 1.8; Validates: design Properties 1–3, 8, 9, 16, 17_


- [x] 3. Implement `src/utils/undoStack.js` — pure snapshot stack helpers
  - [x] 3.1 Write `undoStack.js`
    - Implement `createStack()` returning `{ past: [], future: [] }`
    - Implement `push(stack, snapshot)` returning new stack with snapshot appended to `past` and
      `future` cleared
    - Implement `undo(stack, currentSnapshot)` returning `{ stack, snapshot }` where snapshot is
      `past[past.length-1]`; if `past` is empty, returns current state unchanged
    - Implement `redo(stack, currentSnapshot)` returning `{ stack, snapshot }` where snapshot is
      `future[0]`; if `future` is empty, returns current state unchanged
    - Implement `canUndo(stack)` and `canRedo(stack)` predicates
    - All functions are pure (return new objects, no mutation)
    - _Requirements: 10.1–10.7_
  - [ ]* 3.2 Write property tests for undoStack.js (Properties 10, 11)
    - Create `src/utils/__tests__/undoStack.property.test.js`
    - **Property 10: Undo Round-Trip** — for any state S and action, undo(push(stack, S), S') = S
    - **Property 11: Full Undo/Redo Sequence** — applying N pushes then N undos returns original
      state S0; following with N redos returns the final pushed state
    - _Requirements: 10.3, 10.4; Validates: design Properties 10, 11_

- [x] 4. Implement `src/utils/courseSerializer.js` — GeoJSON round-trip
  - [x] 4.1 Write `courseSerializer.js`
    - Implement `serializeCourse(state)` converting a `CourseState` object into a GeoJSON
      FeatureCollection following the schema in the design (featureType: 'course_line', 'cone',
      'start_gate', 'start_gate_cone', 'finish_gate', 'finish_gate_cone', 'element',
      'element_cone')
    - Implement `deserializeCourse(featureCollection)` reconstructing `CourseState` from the
      FeatureCollection; groups element_cone features by elementId; preserves element params
    - Implement `countConeFeatures(featureCollection)` counting features where featureType is
      `cone`, `start_gate_cone`, `finish_gate_cone`, or `element_cone`
    - Implement `deriveEventStatusFromDate(eventDate, now)` that can be used by pages (re-export
      from geomath or copy as needed)
    - _Requirements: 11.6, 11.10_
  - [ ]* 4.2 Write property tests for courseSerializer.js (Properties 4, 5, 13)
    - Create `src/utils/__tests__/courseSerializer.property.test.js`
    - **Property 4: GeoJSON Round-Trip** — for arbitrary CourseState S,
      `deserializeCourse(serializeCourse(S))` produces S′ equal to S within float tolerance
    - **Property 5: Cone Count Invariant** — `countConeFeatures(serializeCourse(S))` equals the
      total number of individual, start_gate_cone, finish_gate_cone, and element_cone features
    - **Property 13: GeoJSON Coordinate Validity** — every coordinate in `serializeCourse(S)` has
      lng ∈ [-180,180] and lat ∈ [-90,90]
    - _Requirements: 11.6, 11.10; Validates: design Properties 4, 5, 13_


- [x] 5. Implement `src/utils/elementRenderer.js` — GPS cone position computation for all 9 element types
  - [x] 5.1 Write `elementRenderer.js` — core helper and Slalom / Gate
    - Import `feetToMeters`, `metersToLatOffset`, `metersToLngOffset` from `geomath.js`
    - Implement internal `displace(origin, bearingDeg, distanceMeters)` (or re-export from geomath)
    - Implement `computeElementCones(elementType, params, center, angleDeg)` dispatch function
    - Implement **Slalom**: N cones (3–7), spacing D ft, offset direction (Straight/Left/Right);
      each cone displaced along `angleDeg` axis; offset direction shifts perpendicularly by step
    - Implement **Gate**: delegates to `computeGatePositions(center, angleDeg, feetToMeters(width))`
      returning left and right cones with role `'gate_left'`/`'gate_right'`
    - _Requirements: 8.3, 8.7, 8.12_
  - [ ]* 5.2 Write property tests for Slalom and Gate (Properties 6, 7 partial)
    - Create `src/utils/__tests__/elementRenderer.property.test.js`
    - **Property 6: Slalom Spacing Invariant** — for N ∈ [3,7], D ∈ [10,50]ft, any θ and center,
      adjacent cone distance equals D ft ±0.1ft and total cone count equals N
    - **Property 7 (Gate)**: `computeElementCones('gate', {width: W}, c, θ)` returns exactly 2
      cones whose Haversine distance equals `feetToMeters(W)` ±0.01m
    - _Requirements: 8.7, 8.12; Validates: design Properties 6, 7_
  - [x] 5.3 Implement remaining 7 element types in `elementRenderer.js`
    - **Chicane**: gateCount (2–4), gateWidth, gateSpacing, offsetDistance; alternating lateral offset
    - **Chicago Box**: entryWidth, exitWidth, boxLength, boxWidth; 4 corners + 2 gate pairs = 8 cones
    - **Crossover Box**: boxSize; 4 corner cones at ±(boxSize/2) in both axes, rotated by angleDeg
    - **Sweeper**: radius, arcAngle (45/60/90/180°), coneSpacing; compute numCones from arc length
      and spacing; place cones along arc; arcCenter offset from placement center by radius perp to angle
    - **Pointer Cones**: count (1–5), direction; cones spaced 0.5m apart along `direction` bearing
    - **Offset Slalom**: sections (2–4), conesPerSection (3–5), spacing, offsetDistance; each section
      is shifted laterally by `sectionIndex * offsetDistance` with alternating sign
    - **Lane Change**: laneWidth, transitionLength, laneCount; entry gate pair + exit gate pair offset
      forward by transitionLength and laterally by laneWidth
    - _Requirements: 8.8, 8.9, 8.10, 8.11, 8.13, 8.14, 8.15_
  - [ ]* 5.4 Extend property tests for all remaining element types (Property 7 complete)
    - **Property 7: Element Cone Count Matches Params** — for each element type and any valid param
      combination, `computeElementCones(type, params, c, θ).length` equals the expected count
      (Chicane: gateCount*2; Chicago Box: 8; Crossover Box: 4; Sweeper: floor(arc/spacingDeg)+1;
      Pointer: count; Offset Slalom: sections*conesPerSection; Lane Change: 4)
    - _Requirements: 8.3, 8.5, 8.8–8.15; Validates: design Property 7_


- [x] 6. Add pure helper modules for voting logic and course status transitions
  - [x] 6.1 Write `src/utils/votingHelpers.js`
    - Implement `rankCourses(courses, votes)` that groups votes by courseId, counts them, merges
      vote counts onto course objects, then sorts by descending vote count (tie-break: earliest
      `createdAt`)
    - Implement `canVote(event, userId, userVotes)` returning true iff `event.votingPeriodOpen &&
      !userVotes.some(v => v.eventId === event.id) && deriveEventStatus(event.date, new Date()) ===
      'upcoming'`
    - _Requirements: 13.1, 13.2, 13.6_
  - [ ]* 6.2 Write property tests for votingHelpers.js (Properties 14, 15)
    - Create `src/utils/__tests__/voting.property.test.js`
    - **Property 14: Vote Count Invariant** — for any list of votes where each userId appears at
      most once, `sum(rankCourses(...).map(c => c.voteCount))` equals the total number of votes
    - **Property 15: Vote Ranking Sort Order** — `rankCourses(courses, votes)` is in non-increasing
      order of vote count
    - _Requirements: 13.2, 13.6; Validates: design Properties 14, 15_
  - [x] 6.3 Write `src/utils/courseStatusHelpers.js`
    - Implement `canTransition(currentStatus, nextStatus, actorRole)` returning true only for
      permitted transitions per the state machine table in the design:
      DRAFT→SUBMITTED (member/admin), SUBMITTED→APPROVED (admin), SUBMITTED→REJECTED (admin),
      SUBMITTED→DRAFT (member owner/admin via Withdraw), REJECTED→SUBMITTED (member owner),
      any→deleted (admin or owner of DRAFT)
    - _Requirements: 11.4, 11.8, 11.9, 12.2, 12.3_
  - [ ]* 6.4 Write property tests for courseStatusHelpers.js (Property 18)
    - Create `src/utils/__tests__/courseStatus.property.test.js`
    - **Property 18: Course Status Transition Validity** — for every (status, actor) pair, the set
      of allowed nextStatus values is exactly the set specified in the design state machine table
    - _Requirements: 11.4, 11.8, 12.2, 12.3; Validates: design Property 18_

- [ ] 7. Checkpoint — pure utility layer complete
  - Ensure all tests pass: `npx vitest run src/utils`
  - Ask the user if any questions arise before proceeding to the data layer.


- [ ] 8. GraphQL schema and client layer updates
  - [ ] 8.1 Update `terraform/schema.graphql` with new fields and types
    - Add `CourseStatus` enum: `DRAFT | SUBMITTED | APPROVED | REJECTED`
    - Add `status: CourseStatus!` to `Course` type (keep `isDraft`/`isPublic` for backward compat)
    - Add `geoJson: AWSJSON` and `rejectionReason: String` to `Course` type
    - Add `HazardType` enum: `CONE_CLUSTER | BARRIER | WALL | POLE | CURB`
    - Add `hazards: AWSJSON` to `Venue` type (stores JSON array of HazardItem objects)
    - Add `lockedStartGate: AWSJSON` and `lockedFinishGate: AWSJSON` to `Venue` type
    - Add `votingPeriodOpen: Boolean` and `votingDeadline: AWSDateTime` to `Event` type
    - Add `updateEvent` mutation and `UpdateEventInput` input type to schema
    - Update `UpdateCourseInput` to include `status`, `rejectionReason`, `geoJson`
    - Update `UpdateVenueInput` to include `hazards`, `lockedStartGate`, `lockedFinishGate`
    - Update `CreateCourseInput` to include `status`
    - Add `listVotesByEvent(eventId: ID!, limit: Int, nextToken: String): VoteConnection` query
    - Add `VoteConnection` type
    - Add `listEventsByDate` or keep existing `listEvents` (add filter by status hint in comment)
    - _Requirements: 3.3, 4.3, 5.5, 11.4, 12.2, 12.3, 13.8_
  - [ ] 8.2 Update `src/graphql/queries.js` to include new fields
    - Update `getCourse` to fetch: `status`, `geoJson`, `rejectionReason`, `coneCount`,
      `courseLength`, `owner`, `createdAt`
    - Update `listCourses` and `listCoursesByEvent` to fetch: `status`, `coneCount`, `owner`,
      `createdAt`, `geoJson`
    - Update `getVenue` to fetch: `hazards`, `lockedStartGate`, `lockedFinishGate`
    - Update `listVenues` to include `centerLat`, `centerLng` (needed for map centering)
    - Update `getEvent` to fetch: `votingPeriodOpen`, `votingDeadline`
    - Update `listEvents` to fetch: `votingPeriodOpen`, `votingDeadline`, `venueId`
    - Add `listVotesByEvent` query: `{ id, courseId, userId, createdAt }`
    - _Requirements: 3.9, 4.5, 5.1, 11.6, 13.5, 14.2_
  - [ ] 8.3 Update `src/graphql/mutations.js` with new and updated mutations
    - Update `createCourse` to include `status` and `geoJson` in input and return fields
    - Update `updateCourse` to include `status`, `rejectionReason`, `geoJson`, `coneCount` in
      input and return all updated fields
    - Update `createVenue` / `updateVenue` to include `hazards`, `lockedStartGate`,
      `lockedFinishGate` in input and return fields
    - Add `updateEvent` mutation with `UpdateEventInput` (id, name, date, description, venueId,
      votingPeriodOpen, votingDeadline)
    - _Requirements: 5.4, 12.2, 12.3, 13.8_


- [x] 9. Refactor `src/App.js` — routing, auth context, and role derivation
  - [x] 9.1 Fix admin group name check and add new routes
    - Fix `groups.includes('Admin')` → `groups.includes('admins')` using `deriveIsAdmin` from
      `geomath.js` (current code uses wrong casing per Req 1.8)
    - Add routes: `/events/:id/edit` → `EventEditPage` (admin-only), `/courses/:id` →
      `CourseDetailPage`, `/courses/:id/export` → `CourseExportPage`, `*` → `NotFoundPage`
    - Create stub files for `EventEditPage`, `CourseDetailPage`, `CourseExportPage`,
      `NotFoundPage` (each just renders a placeholder div) so imports resolve; they will be
      implemented in later tasks
    - Add `isAdmin` to `AuthContext` value; ensure `signOut` clears session and redirects
    - _Requirements: 1.7, 1.8, 2.8, 16.5, 16.6_
  - [x] 9.2 Update `src/components/NavigationBar.js`
    - Replace display name derivation with robust fallback chain:
      `user?.attributes?.name ?? user?.signInDetails?.loginId?.split('@')[0] ?? user?.username`
    - Add `/venues` link conditional on `isAdmin` (already exists, confirm it works)
    - Remove the dangling `/voting` link (voting is accessed through event cards, not nav directly)
    - Ensure NavigationBar renders without crashing when user is null/loading
    - _Requirements: 1.6, 16.1, 16.2, 16.3, 16.4_

- [ ] 10. Refactor `MapCourseDesigner.js` — useReducer + undo stack + gate rotation
  - [ ] 10.1 Replace local useState with useReducer integrating the undo stack
    - Import `createStack`, `push`, `undo`, `redo`, `canUndo`, `canRedo` from `undoStack.js`
    - Import `computeGatePositions`, `haversine`, `metersToFeet`, `feetToMeters` from `geomath.js`
    - Define `CourseState` shape: `{ cones, startGate, finishGate, courseLine, elements,
      distanceUnit }` as described in the design
    - Implement `courseReducer` handling all undoable actions: `PLACE_CONE`, `DELETE_CONE`,
      `PLACE_GATE`, `MOVE_GATE_CONE`, `ROTATE_GATE`, `PLACE_ELEMENT`, `DELETE_ELEMENT`,
      `ROTATE_ELEMENT`, `DRAW_COURSE_LINE`, `CLEAR_ALL`; and non-undoable: `CHANGE_DISTANCE_UNIT`,
      `SET_ACTIVE_TOOL`
    - Wire `UNDO` and `REDO` actions into the reducer using the stack helpers
    - Initialize reducer state with `{ past:[], future:[], current: initialCourseState }`
    - _Requirements: 10.1–10.7_
  - [ ] 10.2 Implement gate placement with `computeGatePositions` and rotation support
    - When Start Gate or Finish Gate tool is active and user clicks map, dispatch `PLACE_GATE`
      with center, angleDeg=0, and computed left/right from `computeGatePositions`
    - Replace the old `metersToLngOffset`-only approach with the full perpendicular-bearing math
    - Add a rotation angle input (0–359 number input) and ±1°/±5°/±10° buttons that appear when
      a gate is selected; dispatches `ROTATE_GATE` which recomputes both cone positions via
      `computeGatePositions` without removing/re-placing the gate
    - Gate cone drag: on `dragend`, back-compute new center and angle from the two cone positions,
      dispatch `MOVE_GATE_CONE`; update the gate line via `setData` (no layer recreation)
    - Respect `venue.lockedStartGate` / `venue.lockedFinishGate`: initialize gate from locked
      config and disable `ROTATE_GATE` + `MOVE_GATE_CONE` actions for those gates; hide rotation
      UI controls for locked gates
    - _Requirements: 6.6, 6.7, 6.8, 7.1–7.7_
  - [ ] 10.3 Add distance display panel and unit toggle
    - Compute course length as sum of Haversine segment distances along `courseLine`; update on
      each `DRAW_COURSE_LINE` action; display in the status panel in current `distanceUnit`
    - When exactly two cones are selected (via click + shift-click), show a "Selected distance"
      line in the status panel using `haversine` converted to current unit
    - Add cone mouseenter/mouseleave handlers: find adjacent cone (same element → next cone in
      element; standalone → nearest within 50m); show `→ {dist}` tooltip
    - Add a ft/m toggle button that dispatches `CHANGE_DISTANCE_UNIT`
    - _Requirements: 9.1–9.5_
  - [ ] 10.4 Add keyboard shortcut listener for Undo/Redo
    - Attach `keydown` listener in a `useEffect` (cleanup on unmount)
    - Ctrl+Z / Cmd+Z → dispatch `UNDO`; Ctrl+Y / Cmd+Shift+Z → dispatch `REDO`
    - Disable Undo button when `canUndo(stack)` is false; disable Redo when `canRedo(stack)` is
      false per Req 10.5
    - Update Clear All to require confirmation (window.confirm) before dispatching `CLEAR_ALL`
    - _Requirements: 10.5, 10.7, 6.10_
  - [ ] 10.5 Wire `CourseElementsPanel` placement into `MapCourseDesigner`
    - Add `readOnly` prop: when true, all markers are non-draggable, no draw control, no toolbar
    - Accept `onCourseComplete(serializedData)` callback; on "Next: Save Course" click, call
      `serializeCourse(state.current)` from `courseSerializer.js`, count cones, pass result up
    - Accept `initialCourse: CourseState` prop; on mount, if present call
      `deserializeCourse(initialCourse)` and hydrate the reducer state (for DRAFT re-open)
    - Display venue boundary overlay (already exists); add hazard markers as non-interactive
      markers using distinct icon per hazard type on a layer below the draw controls
    - _Requirements: 6.2, 6.9, 11.7, 4.5_


- [ ] 11. Refactor `CourseElementsPanel.js` and `ElementPropertiesPanel.js`
  - [ ] 11.1 Refactor `CourseElementsPanel.js` to list all 9 element types and trigger placement
    - List all 9 types: Slalom, Chicane, Chicago Box, Crossover Box, Gate, Sweeper, Pointer Cones,
      Offset Slalom, Lane Change
    - Clicking an element type sets it as the active element in `CourseDesignPage` state; passes
      element type + params down to `MapCourseDesigner`
    - When an element is active, the next map click dispatches `PLACE_ELEMENT` with:
      `{ id: uuid, type, params, center: {lat,lng}, angleDeg: 0,
         cones: computeElementCones(type, params, center, 0) }`
    - Include a rotation input per placed element (dispatches `ROTATE_ELEMENT` which calls
      `computeElementCones` again with new angle and updates the element's cones array)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_
  - [ ] 11.2 Refactor `ElementPropertiesPanel.js` to drive element reconfiguration
    - Show parameter inputs for the currently selected element type using the ranges from Req 8.7–8.15
    - On param change, call `computeElementCones(type, newParams, center, angleDeg)` to preview;
      on confirm dispatch `ROTATE_ELEMENT` (reuse the same action — it updates params + cones)
    - Validate param ranges client-side; show field-level errors for out-of-range values
    - _Requirements: 8.2, 8.7–8.15_

- [ ] 12. Refactor `MapVenueSelector.js` — add locked gate UI
  - [ ] 12.1 Add optional locked Start Gate and Finish Gate placement to the venue creation/edit flow
    - After drawing the boundary polygon, show a "Set Locked Start Gate" and "Set Locked Finish
      Gate" section (both optional per Req 3.10)
    - Clicking "Set Locked Start Gate" activates a placement mode: next map click places a
      two-cone gate at default angle; user can adjust angle via a 0–359 input
    - Store `lockedStartGate: { lat, lng, angleDeg }` and `lockedFinishGate` in the venue payload
      passed to `onVenueSelected`; pass them through to `createVenue`/`updateVenue` mutations
    - _Requirements: 3.10, 3.11, 3.12_

- [ ] 13. Create `src/components/HazardPanel.js` — admin hazard placement
  - [ ] 13.1 Implement `HazardPanel.js`
    - Render a type selector with the 5 hazard types (CONE_CLUSTER, BARRIER, WALL, POLE, CURB)
      and an optional label input
    - When a type is selected, the next click on the venue map places a hazard marker at that GPS
      coordinate; dispatch `onHazardAdd({ id: uuid, type, lat, lng, label })`
    - Render each existing hazard as a draggable marker differentiated by hazard type (different
      icon/color per type); on `dragend` call `onHazardUpdate`
    - Show a delete button on each hazard marker; call `onHazardDelete(id)`
    - This component renders within `VenueManagementPage`; mutations (`updateVenue` with updated
      hazards array) are handled by the page, not this component
    - _Requirements: 4.1–4.7_


- [ ] 14. Refactor `VenueManagementPage.js` — hazards, locked gates, edit support
  - [ ] 14.1 Add hazard management and venue edit to `VenueManagementPage.js`
    - Add an "Edit" button on each venue card (admin only) that opens the venue in an edit view
      showing `MapVenueSelector` pre-loaded with existing boundary and `HazardPanel`
    - Wire `HazardPanel` into the map view: maintain a local `hazards` array; on add/update/delete
      call `updateVenue` mutation with serialized hazards array (AWSJSON)
    - Locked gate UI: render `lockedStartGate` / `lockedFinishGate` inputs from `MapVenueSelector`
    - Delete venue: if the venue has upcoming events, fetch events by venueId, show warning and
      require confirmation (window.confirm) before proceeding per Req 3.7; display error on
      permission failure
    - Add edit name/description form (inline or modal) that calls `updateVenue`
    - Display RBAC: only render HazardPanel, Edit, and Delete controls when `isAdmin`
    - _Requirements: 3.1–3.9, 4.1–4.7, 2.1, 2.3_

- [ ] 15. Refactor `CourseDesignPage.js` — DRAFT/SUBMIT flow, re-open DRAFT, venue pass-through
  - [ ] 15.1 Update `CourseDesignPage.js` to support DRAFT save vs. SUBMIT and DRAFT re-open
    - Pass full venue object (including hazards, lockedStartGate, lockedFinishGate) to
      `MapCourseDesigner` (currently only passes minimal venue fields)
    - On save step: replace `isDraft` checkbox with two explicit action buttons:
      "Save as Draft" (status=DRAFT, no event required) and "Submit to Event" (status=SUBMITTED,
      event required); show field-level validation error if course name is empty
    - When saving, call `serializeCourse` + `countConeFeatures` from `courseSerializer.js`; store
      `geoJson` and `coneCount` in the `createCourse` input
    - Support re-opening a DRAFT: add a `/design/:courseId` route variant; on load, fetch the
      course `geoJson`, deserialize via `deserializeCourse`, pass as `initialCourse` prop to
      `MapCourseDesigner`; on save, call `updateCourse` instead of `createCourse`
    - After successful submission, navigate to `/voting/:eventId` (not just reset to step 1)
    - After successful DRAFT save, navigate to `/courses/:id`
    - _Requirements: 11.1–11.10_


- [ ] 16. Refactor `VotingPage.js` — course status filtering, vote counts, winner, moderation
  - [ ] 16.1 Add voting period controls and course status filtering
    - Fetch `event.votingPeriodOpen` and display a voting period status badge
    - Admin: show "Open Voting" / "Close Voting" button that calls `updateEvent` with toggled
      `votingPeriodOpen`; disable button while mutation is in flight
    - Members see only APPROVED courses; Admins see SUBMITTED and APPROVED (use `canTransition`
      and `isAdmin` to determine visibility) per Req 12.1
    - Admin: show "Approve" / "Reject" buttons on SUBMITTED course cards; Reject requires a
      rejection reason input (non-empty) before the mutation fires; dispatches `updateCourse`
      with new status and rejectionReason per Req 12.2, 12.3
    - _Requirements: 12.1–12.4, 13.8_
  - [ ] 16.2 Add vote counts, winner display, and refresh
    - After loading courses, call `listVotesByEvent` to get all votes; call `rankCourses` from
      `votingHelpers.js` to merge vote counts onto courses
    - Display vote count on each course card (Req 13.5, 14.2)
    - Use `canVote(event, userId, userVotes)` to determine whether to show enabled Vote buttons
    - When the user votes, immediately update local `userVotes` state to disable other vote buttons
    - When `votingPeriodOpen` is false, display winner prominently at top (highest vote count);
      sort all courses by descending vote count using `rankCourses`
    - Poll for updated vote counts every 30 seconds while on the page (`setInterval` in useEffect,
      cleared on unmount)
    - Validate: if user tries to vote outside voting period, show message per Req 13.7
    - _Requirements: 13.1–13.10, 14.1–14.5_
  - [ ] 16.3 Add course thumbnail and read-only map preview to course cards
    - Each course card gets a `<CourseReadOnlyViewer>` rendered off-screen (300×200 container)
      to generate a thumbnail via `map.once('idle', () => getCanvas().toDataURL())`
    - Show the thumbnail image on the card (Req 14.3)
    - Clicking a card with a valid `geoJson` navigates to `/courses/:id` (Req 14.4)
    - Show empty state message when no approved courses exist (Req 14.5)
    - _Requirements: 14.2–14.5_

- [ ] 17. Refactor `EventCalendarPage.js` — event edit, status derivation, list/calendar views
  - [ ] 17.1 Update `EventCalendarPage.js` for status derivation and event management
    - Replace any stored `status` field usage with `deriveEventStatus(event.date, new Date())`
      from `geomath.js` to compute `upcoming` / `completed` client-side per Req 5.6
    - Sort events by date ascending; visually distinguish upcoming vs. completed (CSS class)
    - Admin: add "Edit Event" link/button per event card → navigates to `/events/:id/edit`
    - Add "View Courses" link on each event per Req 5.9 → navigates to `/voting/:eventId`
    - Add "Design a Course" link on each upcoming event per Req 5.8 → `/design/:eventId`
    - Add calendar view toggle; implement basic month calendar display as an alternative to list;
      toggle persists via local component state
    - _Requirements: 5.1, 5.6–5.9_
  - [ ] 17.2 Implement `EventEditPage.js` (admin-only)
    - Form with name, date, description, and venue selector (same fields as `EventCreationPage`)
    - On load, fetch event by id and pre-populate form
    - On submit, call `updateEvent` mutation; navigate back to events list on success
    - Display field-level validation: name required, date required per Req 5.3
    - _Requirements: 5.4, 5.3, 2.2_


- [ ] 18. Create `src/components/CourseReadOnlyViewer.js` — read-only map view
  - [ ] 18.1 Implement `CourseReadOnlyViewer.js`
    - Accept props: `courseState: CourseState` (already deserialized), `width`, `height`,
      `onThumbnailReady(dataUrl)` (optional callback for thumbnail generation)
    - Initialize a Mapbox map in the container with `interactive: false`
    - On map `load`, render: venue boundary (if venue provided), all cone markers (non-draggable),
      start/finish gate lines and cone markers, course line via a GeoJSON source, element cones
    - No MapboxDraw initialized; no toolbar; markers have `draggable: false`
    - If `onThumbnailReady` is provided, call `map.once('idle', () => onThumbnailReady(
      map.getCanvas().toDataURL('image/png')))`
    - Export as default; used in `VotingPage` (cards), `CourseDetailPage` (full view)
    - _Requirements: 14.3, 14.4_

- [ ] 19. Create `src/pages/CourseDetailPage.js` — full course view with export link
  - [ ] 19.1 Implement `CourseDetailPage.js`
    - Fetch course by `:id` param using `getCourse` query; fetch associated event and venue names
    - Deserialize `geoJson` via `deserializeCourse`; render full `<CourseReadOnlyViewer>` at
      100% container width/height
    - Display course metadata: name, designer display name (course.owner), cone count,
      description, event name, venue name
    - Show "Export Course" button → navigates to `/courses/:id/export`
    - Show "Back" button → `navigate(-1)` (returns to previous page, typically voting/courses)
    - Admin: show "Approve" / "Reject" buttons if course is SUBMITTED (same logic as VotingPage)
    - _Requirements: 14.1–14.4, 15.1_

- [ ] 20. Create `src/components/CourseExporter.js` and `src/pages/CourseExportPage.js`
  - [ ] 20.1 Implement `CourseExporter.js`
    - Accept props: `map` (Mapbox map instance), `courseName`, `eventName`, `venueName`,
      `coneCount`, `date`
    - Implement `exportPng(map, filename)`:
      1. Call `map.setPixelRatio(3)` then `await map.once('idle')`
      2. Capture `map.getCanvas().toDataURL('image/png')`
      3. Restore `map.setPixelRatio(window.devicePixelRatio)`
      4. Trigger `<a download>` with the dataUrl
      5. Wrap in try/catch; on error call `onError` prop with a user-visible message; no partial
         file produced
    - Implement `exportPdf(map, metadata, filename)`:
      1. Capture PNG using same flow
      2. Create `new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })`
      3. Add metadata header at top (course name, event, venue, cone count, date)
      4. Add PNG image to remaining page area
      5. Call `doc.save(filename)`
      6. Wrap in try/catch; on error call `onError`; ensure no doc.save called on error path
    - Export as default function/component
    - _Requirements: 15.1–15.6_
  - [ ] 20.2 Implement `CourseExportPage.js`
    - Fetch course by `:id` param; fetch event and venue metadata for the header
    - Render a `<CourseReadOnlyViewer>` in a full-page container; hold a ref to the map instance
    - Show format selector: PNG / PDF radio buttons
    - Show "Export" button; on click, call `exportPng` or `exportPdf` from `CourseExporter.js`
    - Display error message in a visible `<div className="error-message">` if export fails
    - Display a loading state during export (button disabled, spinner)
    - _Requirements: 15.1–15.6_


- [ ] 21. Create `src/pages/NotFoundPage.js`
  - [x] 21.1 Implement `NotFoundPage.js`
    - Render a simple 404 page with a heading "Page Not Found", a brief message, and a link back
      to the Events page (`/`)
    - No GraphQL calls; no auth dependency
    - _Requirements: 16.6_

- [ ] 22. Checkpoint — full integration pass
  - Ensure all Vitest tests pass: `npx vitest run`
  - Run `npm run build` and confirm zero build errors
  - Verify the route tree in `App.js` covers all routes defined in the design component tree:
    `/`, `/events/new`, `/events/:id/edit`, `/design/:eventId`, `/design`, `/courses/:id`,
    `/courses/:id/export`, `/voting/:eventId`, `/venues`, `*`
  - Ask the user if any questions arise before the final cleanup task.

- [ ] 23. Final wiring and cleanup
  - [ ] 23.1 Wire `components/index.js` exports and validate build
    - Update `src/components/index.js` to export all new and refactored components:
      `MapCourseDesigner`, `MapVenueSelector`, `NavigationBar`, `HazardPanel`,
      `CourseExporter`, `CourseReadOnlyViewer` (remove deleted `CourseDesigner` export which was
      done in task 1.2)
    - Confirm no `CourseDesigner` or `CourseDesignGuide` references remain anywhere in the
      codebase (grep for them)
    - _Requirements: Design §"Files to delete"_
  - [ ] 23.2 Verify and fix RBAC guard coverage across all pages
    - For every Admin-only action (create/edit/delete venue, create/edit/delete event, hazard
      management, voting period open/close, course approve/reject, course force-edit), confirm
      that: (a) UI controls are hidden from Members and (b) the GraphQL call is only reachable
      when `isAdmin` is true
    - For Member-only actions (submit course, vote), confirm they are not exposed to unauthenticated
      users
    - Ensure `ProtectedRoute` in App.js wraps all authenticated routes correctly
    - _Requirements: 2.1–2.8_
  - [ ] 23.3 Validate Venue boundary closed-ring invariant at save time
    - In `MapVenueSelector.js`, after MapboxDraw fires `draw.create`/`draw.update`, read the
      polygon coordinates and ensure: (a) first coord equals last coord; (b) array length ≥ 4
    - If the polygon is not closed, close it by appending the first coordinate; log a warning
    - This satisfies Property 12 / Req 3.3
    - _Requirements: 3.3; Validates: design Property 12_

---

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core
  implementation sub-tasks (no `*`) must be completed.
- Each task references specific requirements for traceability. The requirement numbers follow the
  pattern `{Section}.{CriteriaNumber}` from `requirements.md`.
- Design Properties (P1–P18) are referenced on test sub-tasks to link each property test to its
  formal specification.
- The `schema.graphql` changes in task 8.1 will require re-deploying the Amplify backend
  (`amplify push`) before any GraphQL mutations using the new fields will work. The implementing
  agent should note this and remind the user when task 8 is reached.
- `fast-check` must be added as a devDependency (task 1.1) before any property test tasks are run.
- `jspdf` must be added as a production dependency (task 1.1) before task 20 is started.
- Property tests should run with a minimum of 100 iterations (fast-check default); increase to
  1000 iterations for the critical math properties (Properties 1, 6, 8, 9).


## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "6.1", "6.3"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.2", "5.1", "6.2", "6.4"] },
    { "id": 3, "tasks": ["5.2", "5.3", "8.1", "9.1", "9.2"] },
    { "id": 4, "tasks": ["5.4", "8.2", "8.3", "10.1", "21.1"] },
    { "id": 5, "tasks": ["10.2", "10.3", "10.4", "11.1", "12.1", "13.1"] },
    { "id": 6, "tasks": ["10.5", "11.2", "14.1", "15.1", "16.1", "17.1", "17.2", "18.1"] },
    { "id": 7, "tasks": ["16.2", "16.3", "19.1", "20.1"] },
    { "id": 8, "tasks": ["20.2", "23.1", "23.2", "23.3"] }
  ]
}
```
