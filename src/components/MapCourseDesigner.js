import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const TOOLS = {
  COURSE_LINE: 'course_line',
  CONE: 'cone',
  START: 'start',
  FINISH: 'finish',
};

function MapCourseDesigner({ venue, onCourseComplete }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const markers = useRef([]);
  const [activeTool, setActiveTool] = useState(TOOLS.COURSE_LINE);
  const [cones, setCones] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [finishPoint, setFinishPoint] = useState(null);
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
        map.current.addSource('venue-boundary', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [venue.boundaries],
            },
          },
        });

        map.current.addLayer({
          id: 'venue-boundary-fill',
          type: 'fill',
          source: 'venue-boundary',
          paint: {
            'fill-color': '#ff0000',
            'fill-opacity': 0.1,
          },
        });

        map.current.addLayer({
          id: 'venue-boundary-line',
          type: 'line',
          source: 'venue-boundary',
          paint: {
            'line-color': '#ff0000',
            'line-width': 2,
          },
        });
      }
    });

    map.current.on('draw.create', handleDrawCreate);
    map.current.on('draw.update', handleDrawCreate);

    return () => {
      markers.current.forEach(m => m.remove());
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

  const handleMapClick = useCallback((e) => {
    const { lng, lat } = e.lngLat;

    if (activeTool === TOOLS.CONE) {
      const el = document.createElement('div');
      el.className = 'cone-marker';
      el.innerHTML = '▲';
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current);
      markers.current.push(marker);
      setCones(prev => [...prev, { lng, lat }]);
    }

    if (activeTool === TOOLS.START) {
      const el = document.createElement('div');
      el.className = 'start-marker';
      el.innerHTML = 'S';
      const marker = new mapboxgl.Marker({ element: el, color: '#22c55e' })
        .setLngLat([lng, lat])
        .addTo(map.current);
      markers.current.push(marker);
      setStartPoint({ lng, lat });
    }

    if (activeTool === TOOLS.FINISH) {
      const el = document.createElement('div');
      el.className = 'finish-marker';
      el.innerHTML = 'F';
      const marker = new mapboxgl.Marker({ element: el, color: '#ef4444' })
        .setLngLat([lng, lat])
        .addTo(map.current);
      markers.current.push(marker);
      setFinishPoint({ lng, lat });
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

  function handleClearAll() {
    draw.current.deleteAll();
    markers.current.forEach(m => m.remove());
    markers.current = [];
    setCones([]);
    setStartPoint(null);
    setFinishPoint(null);
    setCourseLine(null);
  }

  function handleComplete() {
    if (!courseLine || !startPoint || !finishPoint) {
      alert('Please draw the course line and place start/finish markers.');
      return;
    }

    const courseData = {
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
          geometry: { type: 'Point', coordinates: [startPoint.lng, startPoint.lat] },
          properties: { type: 'start' },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [finishPoint.lng, finishPoint.lat] },
          properties: { type: 'finish' },
        },
      ],
    };

    onCourseComplete({
      venueName: venue?.name,
      venueId: venue?.id,
      courseLines: [JSON.stringify(courseLine)],
      startPoint: JSON.stringify(startPoint),
      finishPoint: JSON.stringify(finishPoint),
      elements: cones.map(c => JSON.stringify(c)),
      coneCount: cones.length,
      geoJson: courseData,
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
            Start
          </button>
          <button
            className={`tool-button ${activeTool === TOOLS.FINISH ? 'active' : ''}`}
            onClick={() => setActiveTool(TOOLS.FINISH)}
          >
            Finish
          </button>
        </div>

        <div className="tool-group">
          <h4>Status</h4>
          <div className="course-stats-mini">
            <span>{cones.length} cones</span>
            <span>{startPoint ? '✓ Start' : '— Start'}</span>
            <span>{finishPoint ? '✓ Finish' : '— Finish'}</span>
            <span>{courseLine ? '✓ Line' : '— Line'}</span>
          </div>
        </div>

        <div className="tool-group">
          <h4>Actions</h4>
          <button className="button-secondary" onClick={handleClearAll}>Clear All</button>
          <button
            className={`button-save ${courseLine && startPoint && finishPoint ? 'ready' : ''}`}
            onClick={handleComplete}
            disabled={!courseLine || !startPoint || !finishPoint}
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
          <p>Click on the map to place the start gate.</p>
        )}
        {activeTool === TOOLS.FINISH && (
          <p>Click on the map to place the finish gate.</p>
        )}
      </div>
    </div>
  );
}

export default MapCourseDesigner;
