const CONE_FEATURE_TYPES = new Set([
  'cone',
  'start_gate_cone',
  'finish_gate_cone',
  'element_cone',
]);

export function serializeCourse(state) {
  const features = [];

  for (const cone of state.cones ?? []) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [cone.lng, cone.lat] },
      properties: { featureType: 'cone', id: cone.id },
    });
  }

  if (state.startGate) {
    const g = state.startGate;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [g.center.lng, g.center.lat] },
      properties: {
        featureType: 'start_gate',
        angleDeg: g.angleDeg,
      },
    });
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [g.left.lng, g.left.lat] },
      properties: { featureType: 'start_gate_cone', side: 'left' },
    });
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [g.right.lng, g.right.lat] },
      properties: { featureType: 'start_gate_cone', side: 'right' },
    });
  }

  if (state.finishGate) {
    const g = state.finishGate;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [g.center.lng, g.center.lat] },
      properties: {
        featureType: 'finish_gate',
        angleDeg: g.angleDeg,
      },
    });
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [g.left.lng, g.left.lat] },
      properties: { featureType: 'finish_gate_cone', side: 'left' },
    });
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [g.right.lng, g.right.lat] },
      properties: { featureType: 'finish_gate_cone', side: 'right' },
    });
  }

  if (state.courseLine) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: state.courseLine },
      properties: { featureType: 'course_line' },
    });
  }

  for (const el of state.elements ?? []) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [el.center.lng, el.center.lat] },
      properties: {
        featureType: 'element',
        elementId: el.id,
        elementType: el.type,
        params: el.params,
        angleDeg: el.angleDeg,
      },
    });
    for (const cone of el.cones ?? []) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [cone.lng, cone.lat] },
        properties: {
          featureType: 'element_cone',
          elementId: el.id,
          role: cone.role,
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    properties: { distanceUnit: state.distanceUnit ?? 'ft' },
    features,
  };
}

export function deserializeCourse(featureCollection) {
  const cones = [];
  let startGate = null;
  let finishGate = null;
  let courseLine = null;
  const elementsMap = {};
  const elementConesMap = {};

  for (const f of featureCollection.features) {
    const p = f.properties;
    const [lng, lat] = f.geometry.coordinates ?? [];

    switch (p.featureType) {
      case 'cone':
        cones.push({ id: p.id, lat, lng });
        break;

      case 'start_gate':
        startGate = startGate ?? { center: { lat, lng }, angleDeg: p.angleDeg, left: null, right: null };
        break;
      case 'start_gate_cone':
        startGate = startGate ?? { center: null, angleDeg: 0, left: null, right: null };
        if (p.side === 'left') startGate.left = { lat, lng };
        else startGate.right = { lat, lng };
        break;

      case 'finish_gate':
        finishGate = finishGate ?? { center: { lat, lng }, angleDeg: p.angleDeg, left: null, right: null };
        break;
      case 'finish_gate_cone':
        finishGate = finishGate ?? { center: null, angleDeg: 0, left: null, right: null };
        if (p.side === 'left') finishGate.left = { lat, lng };
        else finishGate.right = { lat, lng };
        break;

      case 'course_line':
        courseLine = f.geometry.coordinates;
        break;

      case 'element':
        elementsMap[p.elementId] = {
          id: p.elementId,
          type: p.elementType,
          params: p.params,
          center: { lat, lng },
          angleDeg: p.angleDeg,
          cones: [],
        };
        break;
      case 'element_cone':
        if (!elementConesMap[p.elementId]) elementConesMap[p.elementId] = [];
        elementConesMap[p.elementId].push({ lat, lng, role: p.role });
        break;
    }
  }

  const elements = Object.values(elementsMap).map((el) => ({
    ...el,
    cones: elementConesMap[el.id] ?? [],
  }));

  return {
    cones,
    startGate,
    finishGate,
    courseLine,
    elements,
    distanceUnit: featureCollection.properties?.distanceUnit ?? 'ft',
  };
}

export function countConeFeatures(featureCollection) {
  return featureCollection.features.filter((f) =>
    CONE_FEATURE_TYPES.has(f.properties?.featureType)
  ).length;
}

export { deriveEventStatus } from './geomath.js';
