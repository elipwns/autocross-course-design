# Requirements Document

## Introduction

The Autocross Course Designer is a web application that supports the full operational workflow of a local autocross club. Admins manage venues and events; members design courses on a satellite map and submit them for club consideration; members vote on submitted courses before each event; and on event day the chosen course is clearly identifiable.

This document covers the v1 scope: authentication and role management, venue setup, event management, course design (including composite element placement and gate rotation), course submission, voting with result display, and PDF/image export. It is written as a refactor spec — requirements cover what the working system must do regardless of existing implementation state.

---

## Glossary

- **App**: The Autocross Course Designer web application.
- **Member**: An authenticated user with the MEMBER role. Can design and submit courses, and vote.
- **Admin**: An authenticated user with the ADMIN role (member of the Cognito `admins` group). Has all Member capabilities plus venue management, event management, course moderation, and hazard placement.
- **Venue**: A named, real-world paved area (parking lot, airfield, etc.) with a GPS boundary polygon drawn by an Admin. Used as the map context for course design.
- **Hazard**: A physical obstacle or boundary marker (cone cluster, barrier, wall, curb, pole) placed on a Venue by an Admin. Hazards are part of the Venue layer and persist across events.
- **Event**: A scheduled autocross competition day. Has a name, date, and an associated Venue.
- **Course**: A course design created by a Member or Admin for a specific Event and Venue. Contains a Course Line, a Start Gate, a Finish Gate, individual cones, and zero or more Course Elements.
- **Course Line**: A polyline drawn on the map representing the driving path.
- **Gate**: Two cones placed at a configurable width and angle forming a passage for drivers. Start and Finish gates are special-purpose gates.
- **Course Element**: A parameterized multi-cone structure (Slalom, Chicane, Chicago Box, Crossover Box, Sweeper, Gate, Pointer Cones, Offset Slalom, Lane Change) that is placed as a unit on the map.
- **Cone Count**: The total number of individual traffic cones required by a Course, calculated from all placed cones and Course Elements.
- **GeoJSON**: The JSON format (RFC 7946) used to store and exchange geospatial data within the App.
- **Course Status**: One of `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`. Drives visibility and voting eligibility.
- **Voting Period**: The time window during which Members may cast votes on Courses for a given Event. Opens when an Admin opens voting and closes at a configurable deadline.
- **Vote**: A single selection by a Member for one Course per Event. Cannot be changed after submission.
- **Course Designer**: The map-based UI canvas where a user draws a Course.
- **Toolbar**: The panel of tools and actions adjacent to the Course Designer canvas.
- **Undo/Redo Stack**: The in-memory history of reversible design actions within a Course Designer session.
- **Export**: The action of generating a rasterized image or PDF of a Course suitable for printing or sharing.
- **GATE_WIDTH_DEFAULT**: 6.1 meters (~20 ft), the default width for Start and Finish gates per SCCA Solo rules.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a club member, I want to sign in with my email and password, so that my designs and votes are associated with my identity.

#### Acceptance Criteria

1. THE App SHALL provide sign-up with email, password, and display name.
2. THE App SHALL provide sign-in with email and password via AWS Cognito.
3. WHEN a user submits valid sign-in credentials, THE App SHALL navigate the user to the Events page immediately upon credential validation without waiting for the authentication state to fully propagate.
4. IF a user submits invalid credentials, THEN THE App SHALL display a descriptive authentication error message without exposing internal details.
5. WHEN an unauthenticated user navigates to any protected route, THE App SHALL redirect the user to the sign-in page.
6. THE App SHALL display the authenticated user's display name in the NavigationBar.
7. WHEN a user signs out, THE App SHALL clear the authentication session and redirect to the sign-in page.
8. THE App SHALL derive the user's role (MEMBER or ADMIN) from Cognito group membership at session start.
9. WHILE a user session is active, THE App SHALL refresh the session token before expiry without requiring re-authentication.

---

### Requirement 2: Role-Based Access Control

**User Story:** As an admin, I want certain actions to be restricted to my role, so that members cannot accidentally or intentionally corrupt shared data.

#### Acceptance Criteria

1. THE App SHALL enforce that only Admins may create, edit, or delete Venues.
2. THE App SHALL enforce that only Admins may create, edit, or delete Events.
3. THE App SHALL enforce that only Admins may place or remove Hazards on a Venue.
4. THE App SHALL enforce that only Admins may remove submitted Courses from an Event.
5. THE App SHALL enforce that only Admins may open or close the Voting Period for an Event.
6. THE App SHALL enforce that only Admins may approve or reject a submitted Course.
7. WHEN a Member attempts an Admin-only action, THE App SHALL display an authorization error and take no data-modifying action.
8. THE App SHALL hide Admin-only UI controls (buttons, links, forms) from users with the MEMBER role, and SHALL display those controls to users with the ADMIN role.

---

### Requirement 3: Venue Management

**User Story:** As an admin, I want to define and maintain the venues where events are held, so that course designers have accurate GPS-aligned boundaries to design within.

#### Acceptance Criteria

1. WHEN an Admin navigates to the Venue Management page, THE App SHALL display all existing Venues with their name and description.
2. THE Admin SHALL be able to create a new Venue by drawing a boundary polygon on a satellite map and supplying a name.
3. WHEN a Venue boundary polygon is submitted, THE App SHALL store the boundary as a closed GeoJSON ring (first coordinate equals last coordinate).
4. THE Admin SHALL be able to add a text description to a Venue.
5. THE Admin SHALL be able to edit the name or description of an existing Venue.
6. THE Admin SHALL be able to delete a Venue that has no associated upcoming Events.
7. IF an Admin attempts to delete a Venue that has one or more upcoming Events, THEN THE App SHALL display a warning and require explicit confirmation before proceeding.
8. THE App SHALL display each Venue's boundary polygon as a semi-transparent red overlay on the satellite map during Venue creation.
9. WHEN a Venue is selected for course design, THE App SHALL display the Venue boundary overlay and all Hazards on the design canvas.
10. THE Admin SHALL be able to independently set a locked Start Gate position/angle and a locked Finish Gate position/angle on a Venue; each gate lock is optional and may be set without requiring the other.
11. WHERE a Venue has a locked Start Gate position, THE App SHALL display the locked Start Gate on the Course Designer canvas and prevent the designer from removing or rotating it.
12. WHERE a Venue has a locked Finish Gate position, THE App SHALL display the locked Finish Gate on the Course Designer canvas and prevent the designer from removing or rotating it.

---

### Requirement 4: Hazard Placement

**User Story:** As an admin, I want to mark physical obstacles and boundaries on a venue, so that course designers are aware of hazards when laying out their courses.

#### Acceptance Criteria

1. THE Admin SHALL be able to place Hazards on a Venue from the Venue Management page.
2. THE App SHALL support the following Hazard types: Cone Cluster, Barrier, Wall, Pole, Curb.
3. WHEN an Admin places a Hazard, THE App SHALL store the Hazard's type, GPS position, and optional label with the Venue.
4. THE App SHALL render all Venue Hazards as distinct visual markers on the satellite map during course design, differentiated by Hazard type.
5. WHEN a Course Designer canvas loads a Venue, THE App SHALL display all Hazards on a non-interactive overlay layer below the design tools layer.
6. THE Admin SHALL be able to reposition or delete Hazards from the Venue.
7. THE App SHALL persist Hazard changes independently of Course saves — a Hazard change on the Venue does not alter any saved Courses.

---

### Requirement 5: Event Management

**User Story:** As an admin, I want to create and manage autocross events, so that members can design courses in the context of a specific upcoming event.

#### Acceptance Criteria

1. WHEN an Admin navigates to the Events page, THE App SHALL display all Events sorted by date ascending, with upcoming and past Events visually distinguished.
2. THE Admin SHALL be able to create an Event with a required name, required date, optional description, and optional associated Venue.
3. IF an Admin submits a Create Event form with an empty name or no date, THEN THE App SHALL display field-level validation errors and not create the Event.
4. THE Admin SHALL be able to edit the name, date, description, and Venue of an existing Event.
5. THE Admin SHALL be able to delete an Event.
6. THE App SHALL derive each Event's status (`upcoming` or `completed`) from the current date relative to the Event's date: an Event is `upcoming` only when the current date is before the Event date, and `completed` otherwise, without requiring manual status changes.
7. THE App SHALL display Events in both list view and calendar view, toggled by a control on the Events page.
8. THE App SHALL provide a "Design a Course" link on each upcoming Event that navigates to the Course Designer pre-loaded with that Event's Venue.
9. THE App SHALL provide a "View Courses" link on each Event that navigates to the Voting/Courses page for that Event.

---

### Requirement 6: Course Design — Canvas and Tools

**User Story:** As a member, I want to design a course on a satellite map of the venue, so that I can produce a realistic layout that accounts for real GPS positions and boundaries.

#### Acceptance Criteria

1. THE Course Designer SHALL display a Mapbox satellite map centered on the selected Venue.
2. THE Course Designer SHALL overlay the Venue boundary polygon and all Venue Hazards on the map as non-interactive background layers.
3. THE Toolbar SHALL provide the following tools: Course Line, Place Cone, Start Gate, Finish Gate.
4. WHEN the Course Line tool is active, THE Course Designer SHALL allow the user to draw a freehand polyline on the map using MapboxDraw. WHEN the Course Line tool is not active, THE Course Designer SHALL not draw a polyline on map clicks.
5. WHEN the Place Cone tool is active and the user clicks the map, THE Course Designer SHALL place an individual cone marker at the clicked GPS coordinate.
6. WHEN the Start Gate tool is active and the user clicks the map, THE Course Designer SHALL place two draggable cone markers separated by GATE_WIDTH_DEFAULT, connected by a green line.
7. WHEN the Finish Gate tool is active and the user clicks the map, THE Course Designer SHALL place two draggable cone markers separated by GATE_WIDTH_DEFAULT, connected by a red line.
8. THE Course Designer SHALL allow each gate cone to be dragged to a new GPS position; WHEN a gate cone is dragged, THE Course Designer SHALL update the gate line in real time.
9. THE Course Designer SHALL display a live status panel showing cone count, and whether the Start Gate, Finish Gate, and Course Line are placed.
10. WHEN the user activates the Clear All action, THE Course Designer SHALL remove all cones, gates, and the Course Line from the canvas after confirmation.
11. THE Course Designer SHALL support placing a Course within the Venue boundary, and SHALL visually indicate when placed elements are outside the Venue boundary.

---

### Requirement 7: Gate Rotation

**User Story:** As a member, I want to rotate start and finish gates to any angle, so that I can align them with the course direction at that point.

#### Acceptance Criteria

1. THE Course Designer SHALL allow the user to set a rotation angle (0–359 degrees) on any Gate at placement time.
2. WHEN a Gate is placed at angle θ degrees, THE Course Designer SHALL position the two gate cones such that the line connecting them is perpendicular to θ (i.e., the gate opening faces direction θ).
3. THE Course Designer SHALL provide a rotation handle or angle input on each Gate to modify the angle after placement.
4. WHEN a Gate's rotation angle is changed, THE Course Designer SHALL reposition both cone markers and redraw the gate line without removing and re-placing the Gate.
5. THE distance between the two cones of a Gate SHALL equal GATE_WIDTH_DEFAULT (6.1 m) regardless of the Gate's rotation angle.
6. WHERE a Venue has a locked Start Gate position and angle, THE Course Designer SHALL initialize the Start Gate at that position and angle and prevent the user from rotating or moving it.
7. WHERE a Venue has a locked Finish Gate position and angle, THE Course Designer SHALL initialize the Finish Gate at that position and angle and prevent the user from rotating or moving it.

---

### Requirement 8: Course Elements

**User Story:** As a member, I want to place pre-made course element patterns (slaloms, boxes, chicanes) as single units, so that I can lay out a course quickly and accurately with standard spacings.

#### Acceptance Criteria

1. THE Toolbar SHALL provide a Course Elements panel listing the following element types: Slalom, Chicane, Chicago Box, Crossover Box, Gate, Sweeper, Pointer Cones, Offset Slalom, Lane Change.
2. WHEN the user selects an Element type, THE Course Designer SHALL show a configuration panel with that Element's parameters (e.g., cone count, spacing, gate width).
3. WHEN the user places a configured Element on the map, THE Course Designer SHALL render all constituent cones of that Element as individual draggable markers at their computed GPS positions.
4. THE Course Designer SHALL allow the user to set a rotation angle on a placed Element, rotating all constituent cones as a unit around the Element's center point.
5. THE Cone Count display SHALL include cones from all placed Course Elements.
6. WHEN an Element is deleted, THE Course Designer SHALL remove all its constituent cones and decrement the Cone Count accordingly.

**Element-specific parameters:**

7. A Slalom SHALL have parameters: cone count (3–7), spacing in feet (10–50 ft), and offset direction (Straight, Left Offset, Right Offset).
8. A Chicane SHALL have parameters: gate count (2–4), gate width in feet (10–30 ft), gate spacing in feet (20–100 ft), and offset distance in feet (10–50 ft).
9. A Chicago Box SHALL have parameters: entry width in feet (10–30 ft), exit width in feet (10–30 ft), box length in feet (20–100 ft), and box width in feet (20–100 ft).
10. A Crossover Box SHALL have parameters: box size in feet (20–100 ft).
11. A Sweeper SHALL have parameters: radius in feet (20–200 ft), arc angle (45°, 60°, 90°, 180°), and cone spacing in feet (5–30 ft).
12. A Gate SHALL have parameters: width in feet (10–30 ft).
13. Pointer Cones SHALL have parameters: count (1–5), pointing direction in degrees (0–359).
14. An Offset Slalom SHALL have parameters: sections (2–4), cones per section (3–5), spacing in feet (10–50 ft), and offset distance in feet (10–50 ft).
15. A Lane Change SHALL have parameters: lane width in feet (10–30 ft), transition length in feet (20–100 ft), and lane count (2–3).

---

### Requirement 9: Distance Display

**User Story:** As a member, I want to see real-world distances between cones and overall course length, so that I can verify my course meets spacing requirements and is appropriately challenging.

#### Acceptance Criteria

1. THE Course Designer SHALL display the straight-line distance in feet between any two selected cones when both are selected simultaneously.
2. THE Course Designer SHALL display an estimated Course Length in feet or meters alongside the Course Line, computed as the sum of segment lengths along the drawn Course Line.
3. WHEN a user hovers over a cone that has at least one adjacent cone with a computable GPS distance, THE Course Designer SHALL display a tooltip showing the distance in feet to the nearest adjacent cone. IF no valid adjacent cone distance can be calculated, THEN THE Course Designer SHALL not display a distance tooltip.
4. THE distance unit displayed SHALL be selectable between feet and meters via a toggle in the Toolbar.
5. THE App SHALL compute all distances using the Haversine formula applied to GPS coordinates.

---

### Requirement 10: Undo / Redo

**User Story:** As a member, I want to undo and redo design actions, so that I can experiment freely without fear of making irreversible mistakes.

#### Acceptance Criteria

1. THE Course Designer SHALL maintain an Undo/Redo Stack for the current design session.
2. THE following actions SHALL be undoable: place cone, delete cone, place gate, move gate cone, place element, delete element, draw/replace course line, clear all.
3. WHEN the user activates Undo, THE Course Designer SHALL revert the canvas to the state before the most recent undoable action.
4. WHEN the user activates Redo after an Undo, THE Course Designer SHALL re-apply the undone action.
5. IF the Undo stack is empty, THEN THE Course Designer SHALL disable the Undo control. IF the Redo stack is empty, THEN THE Course Designer SHALL disable the Redo control. WHILE both stacks are empty, THE Course Designer SHALL disable both controls.
6. WHEN the user performs a new undoable action after one or more Undos, THE Course Designer SHALL discard the Redo history beyond the current position.
7. THE Undo and Redo actions SHALL be accessible via keyboard shortcuts (Ctrl+Z / Ctrl+Y or Cmd+Z / Cmd+Shift+Z) and via Toolbar buttons.

---

### Requirement 11: Course Saving and Submission

**User Story:** As a member, I want to save my course design and submit it to an event, so that other members can view and vote on it.

#### Acceptance Criteria

1. THE Course Designer SHALL require that the user has placed a Start Gate, a Finish Gate, and a Course Line before allowing course submission.
2. WHEN the user completes the design step, THE App SHALL present a Save screen with fields for course name (required) and description (optional).
3. THE App SHALL allow saving a Course as a DRAFT without associating it with an Event.
4. THE App SHALL allow submitting a Course to a specific upcoming Event, setting Course Status to `SUBMITTED` only when the user actively performs the submit action.
5. IF the user attempts to save without entering a course name, THEN THE App SHALL display a validation error and not save.
6. WHEN a Course is saved successfully, THE App SHALL serialize the full Course design as a GeoJSON FeatureCollection and store it with the Course record.
7. THE App SHALL allow the user to re-open a DRAFT Course and continue editing.
8. THE App SHALL allow the user to submit a previously saved DRAFT to an Event, transitioning Course Status from `DRAFT` to `SUBMITTED`.
9. WHEN a Course is submitted to an Event, THE App SHALL prevent further edits to that Course by the submitting Member (edits require Admin override or withdrawal).
10. THE App SHALL track and display the total Cone Count on the saved Course record.

---

### Requirement 12: Course Moderation

**User Story:** As an admin, I want to review and moderate submitted courses, so that only appropriate designs go to a vote.

#### Acceptance Criteria

1. THE Voting/Courses page for an Event SHALL display all SUBMITTED and APPROVED Courses for Admins, and only APPROVED Courses for Members. SUBMITTED Courses with PENDING status SHALL be hidden completely from Members until approved.
2. THE Admin SHALL be able to approve a SUBMITTED Course, transitioning its status to `APPROVED`.
3. THE Admin SHALL be able to reject a SUBMITTED Course, transitioning its status to `REJECTED` with a required rejection reason. Admin may only reject courses currently in SUBMITTED status.
4. THE Admin SHALL be able to remove (delete) a Course from an Event regardless of the Course's current status, without requiring the submitting Member's consent.
5. WHEN a Course is rejected, THE App SHALL notify the submitting Member of the rejection reason (displayed on their My Courses list).
6. THE Admin SHALL be able to override the lock on a Course and edit it directly regardless of Course status, with the edit recorded in the Course history.

---

### Requirement 13: Voting

**User Story:** As a member, I want to vote for my favorite submitted course before an event, so that the club can democratically choose which course to run.

#### Acceptance Criteria

1. THE App SHALL allow voting on Courses for an Event only during the Voting Period for that Event.
2. THE App SHALL enforce that each Member may cast at most one Vote per Event across all Courses for that Event.
3. WHEN a Member votes for a Course, THE App SHALL record the Vote and display confirmation to the Member.
4. WHEN a Member has already voted in an Event, THE App SHALL display their voted Course as selected and disable all other Vote buttons for that Event.
5. THE App SHALL display the vote count for each Course on the Voting/Courses page.
6. THE App SHALL display the vote results ranking Courses from highest to lowest vote count once voting closes.
7. IF a Member attempts to vote outside the Voting Period, THEN THE App SHALL display a message indicating voting is not open and not record the Vote.
8. THE Admin SHALL be able to open and close the Voting Period for an Event.
9. WHEN voting closes, THE App SHALL display the winning Course prominently at the top of the Voting/Courses page.
10. THE App SHALL prevent a Member from changing their Vote after submission.

---

### Requirement 14: Voting / Courses Page

**User Story:** As a member, I want to browse submitted courses for an event, so that I can review options before voting.

#### Acceptance Criteria

1. THE Voting/Courses page SHALL display the Event name and date at the top.
2. THE Voting/Courses page SHALL display each APPROVED Course as a card showing: course name, designer's display name, cone count, description (if present), and vote count.
3. THE App SHALL display a map preview thumbnail of each Course on its card.
4. WHEN a Member clicks a Course card that has a valid Course design, THE App SHALL display the Course in a read-only map view showing the Course Line, gates, cones, and Course Elements. WHILE the empty state is displayed, THE App SHALL prevent course card click interactions.
5. THE App SHALL display an empty state message when no Courses have been submitted for an Event.

---

### Requirement 15: Course Export

**User Story:** As an admin or member, I want to export a course as a PDF or image, so that I can print it for use on event day.

#### Acceptance Criteria

1. THE App SHALL provide an Export action on any saved Course's detail view.
2. WHEN a user activates Export, THE App SHALL generate an image of the Course map at a print-quality resolution, including the Course Line, gates, cones, Course Elements, Venue boundary, and Hazards.
3. THE App SHALL provide export format options: PNG image and PDF.
4. WHEN the PDF format is selected, THE App SHALL include course metadata (name, event name, venue name, cone count, date) as a header on the PDF.
5. WHEN export generation is complete, THE App SHALL prompt the user's browser to download the exported file.
6. IF export generation fails, THEN THE App SHALL display an error message. THE App SHALL not produce a partial download file regardless of whether an error is also displayed.

---

### Requirement 16: Navigation

**User Story:** As a user, I want consistent, role-aware navigation, so that I can move between app sections without confusion.

#### Acceptance Criteria

1. THE NavigationBar SHALL be visible on all authenticated pages.
2. THE NavigationBar SHALL display links to: Events, Course Design, and (for Admins) Venues.
3. THE NavigationBar SHALL display the authenticated user's display name and a Sign Out button.
4. WHEN the App is in a loading state, THE NavigationBar SHALL remain visible and functional, even when other page content is not yet ready.
5. THE App SHALL use React Router for client-side navigation with no full page reloads between routes.
6. THE App SHALL provide a 404 page for unrecognized routes.

---

## Correctness Properties

These properties are suitable for property-based testing of pure functions and data-transformation logic within the App.

### P1: Gate Width Invariant

For any gate placed at any rotation angle θ ∈ [0, 360), the Euclidean distance between the two gate cone positions SHALL equal GATE_WIDTH_DEFAULT (6.1 m) within a tolerance of 0.01 m.

```
∀ θ: distance(gateLeft(θ), gateRight(θ)) ≈ GATE_WIDTH_DEFAULT
```

**Why:** `metersToLngOffset` and the rotation math must not alter the gate width.

### P2: Gate Rotation Confluence

Rotating a gate to angle α then to angle β SHALL produce the same cone positions as rotating directly to angle β.

```
∀ α, β: rotate(rotate(gate, α), β) = rotate(gate, β)
```

**Why:** Ensures rotation is stateless and does not accumulate drift.

### P3: Course GeoJSON Round-Trip

For any Course design state S, serializing S to a GeoJSON FeatureCollection and deserializing it back SHALL produce a state S′ where the cone positions, gate positions, and course line coordinates of S′ are equal to those of S.

```
∀ S: deserialize(serialize(S)) ≅ S
```

**Why:** Parsers and serializers are tricky. This catches precision loss, field omission, and coordinate ordering errors.

### P4: Cone Count Invariant

For any Course design state S, the `coneCount` field SHALL equal the number of Point features of type `cone`, `start_gate_cone`, and `finish_gate_cone` in the GeoJSON FeatureCollection derived from S.

```
∀ S: S.coneCount = countConeFeatures(serialize(S))
```

**Why:** Cone count is derived data; it must stay consistent with the canonical representation.

### P5: Slalom Cone Spacing Invariant

For a Slalom element with N cones and spacing D feet, placed at rotation θ, the generated cone positions SHALL satisfy: for each adjacent pair (i, i+1), the distance between cone_i and cone_{i+1} is D feet (within a tolerance of 0.1 ft), and the total number of cones is N.

```
∀ N ∈ [3,7], D ∈ [10,50], θ:
  |cones(slalom(N, D, θ))| = N ∧
  ∀ i ∈ [0,N-2]: |dist(cone_i, cone_{i+1}) - D| < 0.1
```

**Why:** Element rendering must faithfully implement the configured parameters.

### P6: Distance Symmetry

For any two GPS coordinates A and B, the Haversine distance function SHALL satisfy dist(A, B) = dist(B, A).

```
∀ A, B: haversine(A, B) = haversine(B, A)
```

**Why:** Symmetry is a fundamental property of any valid distance function.

### P7: Distance Triangle Inequality

For any three GPS coordinates A, B, C, the Haversine distance function SHALL satisfy dist(A, C) ≤ dist(A, B) + dist(B, C).

```
∀ A, B, C: haversine(A, C) ≤ haversine(A, B) + haversine(B, C)
```

**Why:** Ensures the distance function is a valid metric, catching implementation errors.

### P8: Undo Round-Trip

For any undoable action A applied to design state S yielding state S′, applying Undo to S′ SHALL return a state equal to S.

```
∀ S, A: undo(apply(S, A)) = S
```

**Why:** Core correctness property for the undo system.

### P9: Undo/Redo Idempotence of N Steps

For any sequence of N undoable actions [A1…AN] applied from initial state S0, undoing all N actions SHALL return S0, regardless of N.

```
∀ N, [A1…AN]: undoN(applyN(S0, [A1…AN])) = S0
```

**Why:** Ensures the undo stack does not accumulate drift across multiple operations.

### P10: Vote Count Invariant

For any Event E with courses [C1…Ck], the sum of vote counts across all courses SHALL equal the number of distinct voters who have voted in E.

```
∀ E: Σ voteCount(Ci) = |distinctVoters(E)|
```

**Why:** Enforces the one-vote-per-member invariant at the aggregate level; a bug that lets a member vote twice would break this.

### P11: Vote Ranking Sort Order

For any Event E with courses sorted by vote count descending, the resulting list SHALL be in non-increasing order of vote count.

```
∀ i: rankedCourses(E)[i].votes ≥ rankedCourses(E)[i+1].votes
```

**Why:** Simple sort correctness property for the voting results display.

### P12: GeoJSON Coordinate Validity

For any GeoJSON FeatureCollection produced from a Course, all coordinates SHALL have longitude ∈ [-180, 180] and latitude ∈ [-90, 90].

```
∀ coord in serialize(S): coord.lng ∈ [-180,180] ∧ coord.lat ∈ [-90,90]
```

**Why:** Malformed coordinates will cause Mapbox to throw and prevent the Course from loading.

### P13: Venue Boundary Closed Ring

For any Venue boundary polygon stored by the App, the boundary coordinate array SHALL satisfy: the first coordinate equals the last coordinate (closed ring), and the array length SHALL be at least 4.

```
∀ boundary: boundary[0] = boundary[length-1] ∧ length ≥ 4
```

**Why:** GeoJSON Polygon rings must be closed. Malformed boundaries crash map rendering.

### P14: Event Status Derivation

For any Event with date D and current time T, the derived status SHALL be `upcoming` if and only if D ≥ T (using date-only comparison), and `completed` otherwise.

```
∀ D, T: status(D, T) = 'upcoming' ↔ D ≥ date(T)
```

**Why:** Status is a pure deterministic function of two inputs. Ensures no edge-case divergence around midnight or timezone boundaries.
