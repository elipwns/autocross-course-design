import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MapVenueSelector({ onVenueSelected }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const [venueName, setVenueName] = useState('');
  const [venueDescription, setVenueDescription] = useState('');
  const [boundary, setBoundary] = useState(null);
  const [center, setCenter] = useState(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'draw_polygon',
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search for venue location',
    });

    map.current.addControl(geocoder, 'top-left');
    map.current.addControl(draw.current);
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('draw.create', updateBoundary);
    map.current.on('draw.update', updateBoundary);
    map.current.on('draw.delete', () => {
      setBoundary(null);
      setCenter(null);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  function updateBoundary() {
    const data = draw.current.getAll();
    if (!data.features.length) return;

    const feature = data.features[0];
    const coords = feature.geometry.coordinates[0];
    setBoundary(coords);

    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    setCenter({ lat: centerLat, lng: centerLng });
  }

  function handleSave() {
    if (!venueName.trim()) {
      alert('Please enter a venue name.');
      return;
    }
    if (!boundary || !center) {
      alert('Please draw the venue boundary on the map.');
      return;
    }

    onVenueSelected({
      name: venueName.trim(),
      description: venueDescription.trim(),
      centerLat: center.lat,
      centerLng: center.lng,
      boundaries: boundary,
    });
  }

  return (
    <div className="map-venue-selector">
      <h2>Select Venue Location</h2>
      <p>Search for your venue, then draw the boundary polygon on the map.</p>

      <div className="venue-form-row">
        <div className="form-group">
          <label htmlFor="venue-name">Venue Name</label>
          <input
            id="venue-name"
            type="text"
            value={venueName}
            onChange={e => setVenueName(e.target.value)}
            placeholder="e.g. Autocross Parking Lot"
          />
        </div>
        <div className="form-group">
          <label htmlFor="venue-description">Description (optional)</label>
          <input
            id="venue-description"
            type="text"
            value={venueDescription}
            onChange={e => setVenueDescription(e.target.value)}
            placeholder="Brief description"
          />
        </div>
      </div>

      <div ref={mapContainer} className="map-container" />

      <div className="map-instructions">
        <p>Use the polygon tool (top-right of map) to draw the venue boundary. Double-click to finish.</p>
        {boundary && <p className="boundary-status">Boundary captured ({boundary.length - 1} points)</p>}
      </div>

      <button
        className="button-primary"
        onClick={handleSave}
        disabled={!venueName.trim() || !boundary}
      >
        Confirm Venue
      </button>
    </div>
  );
}

export default MapVenueSelector;
