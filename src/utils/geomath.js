const toRad = (deg) => (deg * Math.PI) / 180;

export function haversine(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const metersToLatOffset = (meters) => meters / 111000;

export const metersToLngOffset = (meters, lat) =>
  meters / (111000 * Math.cos(toRad(lat)));

export const feetToMeters = (feet) => feet * 0.3048;

export const metersToFeet = (meters) => meters / 0.3048;

export function computeGatePositions(center, angleDeg, widthMeters) {
  const perpBearing = angleDeg + 90;
  const halfWidth = widthMeters / 2;
  const perpRad = toRad(perpBearing);
  const cosPerp = Math.cos(perpRad);
  const sinPerp = Math.sin(perpRad);

  const rightLat = center.lat + metersToLatOffset(halfWidth * cosPerp);
  const rightLng = center.lng + metersToLngOffset(halfWidth * sinPerp, center.lat);
  const leftLat = center.lat - metersToLatOffset(halfWidth * cosPerp);
  const leftLng = center.lng - metersToLngOffset(halfWidth * sinPerp, center.lat);

  return {
    left: { lat: leftLat, lng: leftLng },
    right: { lat: rightLat, lng: rightLng },
  };
}

export function displace(origin, bearingDeg, distanceMeters) {
  const rad = toRad(bearingDeg);
  return {
    lat: origin.lat + metersToLatOffset(distanceMeters * Math.cos(rad)),
    lng: origin.lng + metersToLngOffset(distanceMeters * Math.sin(rad), origin.lat),
  };
}

export function deriveEventStatus(eventDate, now) {
  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);
  const nowDay = new Date(now);
  nowDay.setHours(0, 0, 0, 0);
  return eventDay >= nowDay ? 'upcoming' : 'completed';
}

export const deriveIsAdmin = (groups) =>
  Array.isArray(groups) && groups.includes('admins');
