import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// TODO: verify against current SCCA Solo rules — believed to be ~20ft
const GATE_WIDTH_METERS = 6.1;

const TOOLS = {
  COURSE_LINE: 'course_line',
  CONE: 'cone',
  START: 'start',
  FINISH: 'finish',
};

function metersToLngOffset(meters, lat) {
  return meters / (111000 * Math.cos((lat * Math.PI) / 180));
}

function addOrUpdateGateLine(map, id, coordinates, color) {
  if (!map.current?.isStyleLoaded()) return;
  const data = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates },
  };
  if (map.current.getSource(id)) {
    map.current.getSource(id).setData(data);
  } else {
    map.current.addSource(id, { type: 'geojson', data });
    map.current.addLayer({
      id: `${id}-line`,
      type: 'line',
      source: id,
      paint: { 'line-color': color, 'line-width': 3 },
    });
  }
}

function MapCourseDesigner({ venue, onCourseComplete }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const coneMarkers = useRef([]);
  const startGateMarkers = useRef([]);
  const finishGateMarkers = useRef([]);
  const [activeTool, setActiveTool] = useState(TOOLS.COURSE_LINE);
  const [cones, setCones] = useState([]);
  const [startGate, setStartGate] = useState(null);
  const [finishGate, setFinishGate] = useState(null);
  const [courseLine, setCourseLine] = useState(null);

  const centerLng = venue?.centerLng ?? -98.5795;
  const centerLat = venue?.centerLat ?? 39.8283;

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [centerLng, centerLat],
      zoom: 17,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { line_string: true, trash: true },
    });

    map.current.addControl(draw.current);
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (venue?.boundaries?.length) {
        // Boundaries may be stored as JSON strings from the database
        const parsedBoundaries = venue.boundaries.map(c =>
          typeof c === 'string' ? JSON.parse(c) : c
        );

        map.current.addSource('venue-boundary', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [parsedBoundaries],
            },
          },
        });

        map.current.addLayer({
          id: 'venue-boundary-fill',
          type: 'fill',
          source: 'venue-boundary',
          paint: { 'fill-color': '#ff0000', 'fill-opacity': 0.1 },
        });

        map.current.addLayer({
          id: 'venue-boundary-line',
          type: 'line',
          source: 'venue-boundary',
          paint: { 'line-color': '#ff0000', 'line-width': 2 },
        });
      }
    });

    map.current.on('draw.create', handleDrawCreate);
    map.current.on('draw.update', handleDrawCreate);

    return () => {
      coneMarkers.current.forEach(m => m.remove());
      startGateMarkers.current.forEach(m => m.remove());
      finishGateMarkers.current.forEach(m => m.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  function handleDrawCreate() {
    const data = draw.current.getAll();
    const lines = data.features.filter(f => f.geometry.type === 'LineString');
    if (lines.length > 0) {
      setCourseLine(lines[lines.length - 1].geometry.coordinates);
    }
  }

  function placeGateMarker(lng, lat, label, className) {
    const el = document.createElement('div');
    el.className = className;
    el.innerHTML = label;
    return new mapboxgl.Marker({ element: el, draggable: true }).setLngLat([lng, lat]).addTo(map.current);
  }

  const handleMapClick = useCallback((e) => {
    const { lng, lat } = e.lngLat;

    if (activeTool === TOOLS.CONE) {
      const el = document.createElement('div');
      el.className = 'cone-marker';
      el.innerHTML = '▲';
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current);
      coneMarkers.current.push(marker);
      setCones(prev => [...prev, { lng, lat }]);
    }

    if (activeTool === TOOLS.START) {
      startGateMarkers.current.forEach(m => m.remove());
      startGateMarkers.current = [];

      const halfOffset = metersToLngOffset(GATE_WIDTH_METERS / 2, lat);
      const leftLng = lng - halfOffset;
      const rightLng = lng + halfOffset;

      const leftMarker = placeGateMarker(leftLng, lat, '▲', 'start-marker');
      const rightMarker = placeGateMarker(rightLng, lat, '▲', 'start-marker');

      function updateStartGateLine() {
        const lp = leftMarker.getLngLat();
        const rp = rightMarker.getLngLat();
        const centerLng = (lp.lng + rp.lng) / 2;
        const centerLat = (lp.lat + rp.lat) / 2;
        addOrUpdateGateLine(map, 'start-gate', [[lp.lng, lp.lat], [rp.lng, rp.lat]], '#22c55e');
        setStartGate({ center: { lng: centerLng, lat: centerLat }, left: [lp.lng, lp.lat], right: [rp.lng, rp.lat] });
      }

      leftMarker.on('dragend', updateStartGateLine);
      rightMarker.on('dragend', updateStartGateLine);
      startGateMarkers.current.push(leftMarker, rightMarker);
      addOrUpdateGateLine(map, 'start-gate', [[leftLng, lat], [rightLng, lat]], '#22c55e');
      setStartGate({ center: { lng, lat }, left: [leftLng, lat], right: [rightLng, lat] });
    }

    if (activeTool === TOOLS.FINISH) {
      finishGateMarkers.current.forEach(m => m.remove());
      finishGateMarkers.current = [];

      const halfOffset = metersToLngOffset(GATE_WIDTH_METERS / 2, lat);
      const leftLng = lng - halfOffset;
      const rightLng = lng + halfOffset;

      const leftMarker = placeGateMarker(leftLng, lat, '▲', 'finish-marker');
      const rightMarker = placeGateMarker(rightLng, lat, '▲', 'finish-marker');

      function updateFinishGateLine() {
        const lp = leftMarker.getLngLat();
        const rp = rightMarker.getLngLat();
        const centerLng = (lp.lng + rp.lng) / 2;
        const centerLat = (lp.lat + rp.lat) / 2;
        addOrUpdateGateLine(map, 'finish-gate', [[lp.lng, lp.lat], [rp.lng, rp.lat]], '#ef4444');
        setFinishGate({ center: { lng: centerLng, lat: centerLat }, left: [lp.lng, lp.lat], right: [rp.lng, rp.lat] });
      }

      leftMarker.on('dragend', updateFinishGateLine);
      rightMarker.on('dragend', updateFinishGateLine);
      finishGateMarkers.current.push(leftMarker, rightMarker);
      addOrUpdateGateLine(map, 'finish-gate', [[leftLng, lat], [rightLng, lat]], '#ef4444');
      setFinishGate({ center: { lng, lat }, left: [leftLng, lat], right: [rightLng, lat] });
    }
  }, [activeTool]);

  useEffect(() => {
    if (!map.current) return;

    if (activeTool === TOOLS.COURSE_LINE) {
      map.current.off('click', handleMapClick);
      draw.current.changeMode('draw_line_string');
    } else {
      draw.current.changeMode('simple_select');
      map.current.on('click', handleMapClick);
    }

    return () => {
      map.current?.off('click', handleMapClick);
    };
  }, [activeTool, handleMapClick]);

  // Disable marker pointer-events during course line drawing so clicks pass through to MapboxDraw
  useEffect(() => {
    const pointerEvents = activeTool === TOOLS.COURSE_LINE ? 'none' : 'auto';
    [...coneMarkers.current, ...startGateMarkers.current, ...finishGateMarkers.current].forEach(m => {
      m.getElement().style.pointerEvents = pointerEvents;
    });
  }, [activeTool]);

  function handleClearAll() {
    draw.current.deleteAll();
    coneMarkers.current.forEach(m => m.remove());
    coneMarkers.current = [];
    startGateMarkers.current.forEach(m => m.remove());
    startGateMarkers.current = [];
    finishGateMarkers.current.forEach(m => m.remove());
    finishGateMarkers.current = [];

    ['start-gate', 'finish-gate'].forEach(id => {
      if (map.current?.getSource(id)) {
        if (map.current.getLayer(`${id}-line`)) map.current.removeLayer(`${id}-line`);
        map.current.removeSource(id);
      }
    });

    setCones([]);
    setStartGate(null);
    setFinishGate(null);
    setCourseLine(null);
  }

  function handleComplete() {
    if (!courseLine || !startGate || !finishGate) {
      alert('Please draw the course line and place start/finish gates.');
      return;
    }

    onCourseComplete({
      venueName: venue?.name,
      venueId: venue?.id,
      courseLines: [JSON.stringify(courseLine)],
      startPoint: JSON.stringify(startGate.center),
      finishPoint: JSON.stringify(finishGate.center),
      elements: cones.map(c => JSON.stringify(c)),
      coneCount: cones.length,
      geoJson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: courseLine },
            properties: { type: 'course_line' },
          },
          ...cones.map((c, i) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
            properties: { type: 'cone', index: i },
          })),
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [startGate.left, startGate.right] },
            properties: { type: 'start_gate' },
          },
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [finishGate.left, finishGate.right] },
            properties: { type: 'finish_gate' },
          },
        ],
      },
    });
  }

  return (
    <div className="map-course-designer">
      <div className="designer-toolbar">
        <div className="tool-group">
          <h4>Drawing Tools</h4>
          <button
            className={`tool-button ${activeTool === TOOLS.COURSE_LINE ? 'active' : ''}`}
            onClick={() => setActiveTool(TOOLS.COURSE_LINE)}
          >
            Course Line
          </button>
          <button
            className={`tool-button ${activeTool === TOOLS.CONE ? 'active' : ''}`}
            onClick={() => setActiveTool(TOOLS.CONE)}
          >
            Place Cone
          </button>
          <button
            className={`tool-button ${activeTool === TOOLS.START ? 'active' : ''}`}
            onClick={() => setActiveTool(TOOLS.START)}
          >
            Start Gate
          </button>
          <button
            className={`tool-button ${activeTool === TOOLS.FINISH ? 'active' : ''}`}
            onClick={() => setActiveTool(TOOLS.FINISH)}
          >
            Finish Gate
          </button>
        </div>

        <div className="tool-group">
          <h4>Status</h4>
          <div className="course-stats-mini">
            <span>{cones.length} cones</span>
            <span>{startGate ? '✓ Start' : '— Start'}</span>
            <span>{finishGate ? '✓ Finish' : '— Finish'}</span>
            <span>{courseLine ? '✓ Line' : '— Line'}</span>
          </div>
        </div>

        <div className="tool-group">
          <h4>Actions</h4>
          <button className="button-secondary" onClick={handleClearAll}>Clear All</button>
          <button
            className={`button-save ${courseLine && startGate && finishGate ? 'ready' : ''}`}
            onClick={handleComplete}
            disabled={!courseLine || !startGate || !finishGate}
          >
            Next: Save Course
          </button>
        </div>
      </div>

      <div ref={mapContainer} className="map-container" />

      <div className="map-instructions">
        {activeTool === TOOLS.COURSE_LINE && (
          <p>Click on the map to draw the course line. Double-click to finish.</p>
        )}
        {activeTool === TOOLS.CONE && (
          <p>Click on the map to place cones.</p>
        )}
        {activeTool === TOOLS.START && (
          <p>Click to place the start gate (~20ft wide). Click again to reposition.</p>
        )}
        {activeTool === TOOLS.FINISH && (
          <p>Click to place the finish gate (~20ft wide). Click again to reposition.</p>
        )}
      </div>
    </div>
  );
}

export default MapCourseDesigner;
