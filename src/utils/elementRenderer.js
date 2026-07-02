import { displace, computeGatePositions, feetToMeters } from './geomath.js';

/**
 * Compute the GPS cone positions for a course element.
 *
 * @param {string}  elementType - One of the 9 element type keys
 * @param {object}  params      - Element-specific configuration
 * @param {{lat: number, lng: number}} center - Placement center
 * @param {number}  angleDeg    - Rotation angle (compass bearing, 0 = north)
 * @returns {Array<{lat: number, lng: number, role: string}>}
 */
export function computeElementCones(elementType, params, center, angleDeg) {
  switch (elementType) {
    case 'slalom':
      return computeSlalom(params, center, angleDeg);
    case 'gate':
      return computeGate(params, center, angleDeg);
    case 'chicane':
      return computeChicane(params, center, angleDeg);
    case 'chicago-box':
      return computeChicagoBox(params, center, angleDeg);
    case 'crossover-box':
      return computeCrossoverBox(params, center, angleDeg);
    case 'sweeper':
      return computeSweeper(params, center, angleDeg);
    case 'pointer-cones':
      return computePointerCones(params, center, angleDeg);
    case 'offset-slalom':
      return computeOffsetSlalom(params, center, angleDeg);
    case 'lane-change':
      return computeLaneChange(params, center, angleDeg);
    default:
      console.error(`Unknown element type: ${elementType}`);
      return [];
  }
}

// ---------------------------------------------------------------------------
// Slalom
// ---------------------------------------------------------------------------
// N cones (3–7), spacing D ft, offset direction (Straight/Left Offset/Right Offset).
// Each cone is displaced along the angleDeg axis; offset direction shifts
// perpendicularly by an incremental step (1 ft converted to meters).

function computeSlalom(params, center, angleDeg) {
  const { coneCount = 5, spacing = 25, offset = 'Straight' } = params;
  const spacingM = feetToMeters(spacing);
  const offsetStep = feetToMeters(1); // 1 ft lateral step per cone
  const cones = [];

  for (let i = 0; i < coneCount; i++) {
    // Move forward along the element axis
    let pos = displace(center, angleDeg, i * spacingM);

    // Apply lateral offset
    if (offset === 'Left Offset') {
      pos = displace(pos, angleDeg + 90, -(i * offsetStep));
    } else if (offset === 'Right Offset') {
      pos = displace(pos, angleDeg + 90, i * offsetStep);
    }

    cones.push({ lat: pos.lat, lng: pos.lng, role: 'slalom_cone' });
  }

  return cones;
}

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------
// Delegates to computeGatePositions; returns left and right cones.

function computeGate(params, center, angleDeg) {
  const { width = 15 } = params;
  const widthM = feetToMeters(width);
  const { left, right } = computeGatePositions(center, angleDeg, widthM);

  return [
    { lat: left.lat, lng: left.lng, role: 'gate_left' },
    { lat: right.lat, lng: right.lng, role: 'gate_right' },
  ];
}

// ---------------------------------------------------------------------------
// Chicane
// ---------------------------------------------------------------------------
// gateCount (2–4) gates, each gateWidth wide, spaced gateSpacing apart along
// the axis. Even-indexed gates are offset left, odd-indexed gates offset right
// by offsetDistance/2.

function computeChicane(params, center, angleDeg) {
  const {
    gateCount = 3,
    gateWidth = 15,
    gateSpacing = 40,
    offsetDistance = 20,
  } = params;
  const gateWidthM = feetToMeters(gateWidth);
  const gateSpacingM = feetToMeters(gateSpacing);
  const offsetDistM = feetToMeters(offsetDistance);
  const cones = [];

  for (let i = 0; i < gateCount; i++) {
    // Move along the element axis
    let gateCenter = displace(center, angleDeg, i * gateSpacingM);

    // Alternate lateral offset
    const lateralOffset = i % 2 === 0 ? -(offsetDistM / 2) : offsetDistM / 2;
    gateCenter = displace(gateCenter, angleDeg + 90, lateralOffset);

    const { left, right } = computeGatePositions(gateCenter, angleDeg, gateWidthM);
    cones.push(
      { lat: left.lat, lng: left.lng, role: 'chicane_gate_left' },
      { lat: right.lat, lng: right.lng, role: 'chicane_gate_right' },
    );
  }

  return cones;
}

// ---------------------------------------------------------------------------
// Chicago Box
// ---------------------------------------------------------------------------
// 4 corners + entry gate pair (N edge) + exit gate pair (S edge) = 8 cones.
// boxLength along angleDeg, boxWidth perpendicular.

function computeChicagoBox(params, center, angleDeg) {
  const {
    entryWidth = 15,
    exitWidth = 15,
    boxLength = 50,
    boxWidth = 50,
  } = params;
  const halfLenM = feetToMeters(boxLength) / 2;
  const halfWidM = feetToMeters(boxWidth) / 2;
  const entryWidthM = feetToMeters(entryWidth);
  const exitWidthM = feetToMeters(exitWidth);
  const cones = [];

  // 4 corners: NW, NE, SE, SW (N = forward along angleDeg)
  const north = displace(center, angleDeg, halfLenM);
  const south = displace(center, angleDeg, -halfLenM);

  const nw = displace(north, angleDeg + 90, -halfWidM);
  const ne = displace(north, angleDeg + 90, halfWidM);
  const se = displace(south, angleDeg + 90, halfWidM);
  const sw = displace(south, angleDeg + 90, -halfWidM);

  cones.push(
    { lat: nw.lat, lng: nw.lng, role: 'box_corner_nw' },
    { lat: ne.lat, lng: ne.lng, role: 'box_corner_ne' },
    { lat: se.lat, lng: se.lng, role: 'box_corner_se' },
    { lat: sw.lat, lng: sw.lng, role: 'box_corner_sw' },
  );

  // Entry gate on N edge
  const { left: entryL, right: entryR } = computeGatePositions(north, angleDeg, entryWidthM);
  cones.push(
    { lat: entryL.lat, lng: entryL.lng, role: 'box_entry_left' },
    { lat: entryR.lat, lng: entryR.lng, role: 'box_entry_right' },
  );

  // Exit gate on S edge
  const { left: exitL, right: exitR } = computeGatePositions(south, angleDeg, exitWidthM);
  cones.push(
    { lat: exitL.lat, lng: exitL.lng, role: 'box_exit_left' },
    { lat: exitR.lat, lng: exitR.lng, role: 'box_exit_right' },
  );

  return cones;
}

// ---------------------------------------------------------------------------
// Crossover Box
// ---------------------------------------------------------------------------
// 4 corner cones at ±(boxSize/2) in both axes, rotated by angleDeg.

function computeCrossoverBox(params, center, angleDeg) {
  const { size = 40 } = params;
  const halfM = feetToMeters(size) / 2;
  const cones = [];

  // Compute corners: forward/back along angleDeg, left/right perpendicular
  const offsets = [
    { along: halfM, across: -halfM, role: 'crossover_corner_nw' },
    { along: halfM, across: halfM, role: 'crossover_corner_ne' },
    { along: -halfM, across: halfM, role: 'crossover_corner_se' },
    { along: -halfM, across: -halfM, role: 'crossover_corner_sw' },
  ];

  for (const { along, across, role } of offsets) {
    let pos = displace(center, angleDeg, along);
    pos = displace(pos, angleDeg + 90, across);
    cones.push({ lat: pos.lat, lng: pos.lng, role });
  }

  return cones;
}

// ---------------------------------------------------------------------------
// Sweeper
// ---------------------------------------------------------------------------
// Cones placed along an arc. arcCenter is offset from placement center by
// radius perpendicular to angleDeg. Cones are spaced by converting linear
// cone spacing to angular spacing along the arc.

function computeSweeper(params, center, angleDeg) {
  const { radius = 90, angle = '90°', coneSpacing = 15 } = params;
  const radiusM = feetToMeters(radius);
  const coneSpacingM = feetToMeters(coneSpacing);

  // Parse arc angle from string like '90°' or number
  const arcAngleDeg = typeof angle === 'string' ? parseFloat(angle) : angle;

  // Circumference of full circle
  const circumference = 2 * Math.PI * radiusM;

  // Angular spacing in degrees
  const coneSpacingDeg = (coneSpacingM / circumference) * 360;

  // Number of cones
  const numCones = Math.floor(arcAngleDeg / coneSpacingDeg) + 1;

  // Arc center is offset from placement center by radius perpendicular to angle
  const arcCenter = displace(center, angleDeg + 90, radiusM);

  // Start bearing: pointing back toward the placement center from arc center
  const startBearing = angleDeg - 90;

  const cones = [];
  for (let i = 0; i < numCones; i++) {
    const bearingFromCenter = startBearing + i * coneSpacingDeg;
    const pos = displace(arcCenter, bearingFromCenter, radiusM);
    cones.push({ lat: pos.lat, lng: pos.lng, role: 'sweeper_cone' });
  }

  return cones;
}

// ---------------------------------------------------------------------------
// Pointer Cones
// ---------------------------------------------------------------------------
// count (1–5) cones spaced 0.5 m apart along the direction bearing.

function computePointerCones(params, center, angleDeg) {
  const { count = 1, direction = 0 } = params;
  const spacingM = 0.5;
  const bearing = typeof direction === 'number' ? direction : angleDeg;
  const cones = [];

  for (let i = 0; i < count; i++) {
    const pos = displace(center, bearing, i * spacingM);
    cones.push({ lat: pos.lat, lng: pos.lng, role: 'pointer' });
  }

  return cones;
}

// ---------------------------------------------------------------------------
// Offset Slalom
// ---------------------------------------------------------------------------
// sections (2–4), each with conesPerSection (3–5) cones at given spacing.
// Each section is shifted laterally by alternating sign * offsetDistance.

function computeOffsetSlalom(params, center, angleDeg) {
  const {
    sections = 2,
    conesPerSection = 3,
    spacing = 25,
    offsetDistance = 20,
  } = params;
  const spacingM = feetToMeters(spacing);
  const offsetDistM = feetToMeters(offsetDistance);
  const cones = [];

  for (let s = 0; s < sections; s++) {
    // Section start along the main axis
    const sectionStart = displace(center, angleDeg, s * (conesPerSection - 1) * spacingM);

    // Lateral offset alternates sign
    const lateralOffset = s * offsetDistM * (s % 2 === 0 ? 1 : -1);
    const sectionCenter = displace(sectionStart, angleDeg + 90, lateralOffset);

    for (let c = 0; c < conesPerSection; c++) {
      const pos = displace(sectionCenter, angleDeg, c * spacingM);
      cones.push({ lat: pos.lat, lng: pos.lng, role: 'offset_slalom_cone' });
    }
  }

  return cones;
}

// ---------------------------------------------------------------------------
// Lane Change
// ---------------------------------------------------------------------------
// Entry gate pair at center, exit gate pair offset forward by transitionLength
// and laterally by laneWidth. Total width = laneWidth * laneCount.

function computeLaneChange(params, center, angleDeg) {
  const {
    width = 15,     // laneWidth
    length = 40,    // transitionLength
    laneCount = 2,
  } = params;
  const laneWidthM = feetToMeters(width);
  const transitionLengthM = feetToMeters(length);

  // Entry gate: total width = laneWidth * laneCount
  const entryTotalWidth = laneWidthM * laneCount;
  const { left: g1Left, right: g1Right } = computeGatePositions(center, angleDeg, entryTotalWidth);

  // Exit gate: offset forward by transitionLength and laterally by laneWidth
  let exitCenter = displace(center, angleDeg, transitionLengthM);
  exitCenter = displace(exitCenter, angleDeg + 90, laneWidthM);
  const { left: g2Left, right: g2Right } = computeGatePositions(exitCenter, angleDeg, entryTotalWidth);

  return [
    { lat: g1Left.lat, lng: g1Left.lng, role: 'lane_entry_left' },
    { lat: g1Right.lat, lng: g1Right.lng, role: 'lane_entry_right' },
    { lat: g2Left.lat, lng: g2Left.lng, role: 'lane_exit_left' },
    { lat: g2Right.lat, lng: g2Right.lng, role: 'lane_exit_right' },
  ];
}
