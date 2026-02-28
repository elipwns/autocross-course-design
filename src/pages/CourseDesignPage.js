import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { AuthContext } from '../App';
import MapVenueSelector from '../components/MapVenueSelector';
import MapCourseDesigner from '../components/MapCourseDesigner';
import { getEvent, getVenue, listVenues, listEvents } from '../graphql/queries';
import { createCourse, createVenue } from '../graphql/mutations';

const client = generateClient();

function CourseDesignPage() {
  const { eventId } = useParams();
  const { isAdmin } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [course, setCourse] = useState(null);
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [step, setStep] = useState(eventId ? 'loading' : 'venue-select');
  const [saving, setSaving] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  // Event-contextual flow: load event + its venue, jump straight to design
  useEffect(() => {
    if (!eventId) return;

    async function fetchEventAndVenue() {
      try {
        const eventResult = await client.graphql({
          query: getEvent,
          variables: { id: eventId },
        });
        const loadedEvent = eventResult.data?.getEvent;
        setEvent(loadedEvent);

        if (loadedEvent?.venueId) {
          const venueResult = await client.graphql({
            query: getVenue,
            variables: { id: loadedEvent.venueId },
          });
          const loadedVenue = venueResult.data?.getVenue;
          if (loadedVenue) {
            setVenue(loadedVenue);
            setStep('design');
            return;
          }
        }
        setStep('design');
      } catch (err) {
        console.error('Failed to load event/venue:', err);
        setStep('design');
      }
    }

    fetchEventAndVenue();
  }, [eventId]);

  // Standalone flow: load venues list and events for the save step
  useEffect(() => {
    if (eventId) return;

    async function fetchData() {
      try {
        const [venuesResult, eventsResult] = await Promise.all([
          client.graphql({ query: listVenues }),
          client.graphql({ query: listEvents }),
        ]);
        setVenues(venuesResult.data?.listVenues?.items ?? []);
        const items = eventsResult.data?.listEvents?.items ?? [];
        items.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(items.filter(e => new Date(e.date) >= new Date()));
      } catch (err) {
        console.error('Failed to load venues/events:', err);
      }
    }

    fetchData();
  }, [eventId]);

  async function handleVenueFromList(selectedVenue) {
    // listVenues doesn't return boundaries — fetch the full venue
    try {
      const result = await client.graphql({
        query: getVenue,
        variables: { id: selectedVenue.id },
      });
      setVenue(result.data?.getVenue ?? selectedVenue);
    } catch (err) {
      setVenue(selectedVenue);
    }
    setStep('design');
  }

  async function handleVenueSelected(selectedVenue) {
    try {
      const { username } = await getCurrentUser();
      const result = await client.graphql({
        query: createVenue,
        variables: {
          input: {
            name: selectedVenue.name,
            description: selectedVenue.description || undefined,
            centerLat: selectedVenue.centerLat,
            centerLng: selectedVenue.centerLng,
            boundaries: selectedVenue.boundaries.map(c => JSON.stringify(c)),
            owner: username,
          },
        },
      });
      setVenue(result.data.createVenue);
      setStep('design');
    } catch (err) {
      console.error('Failed to save venue:', err);
      alert('Failed to save venue. Please try again. If this keeps happening, check with your admin about permissions.');
    }
  }

  function handleCourseComplete(completedCourse) {
    setCourse(completedCourse);
    setStep('save');
  }

  async function handleSaveCourse() {
    if (!courseName.trim()) {
      alert('Please enter a course name.');
      return;
    }

    const resolvedEventId = eventId || selectedEventId || undefined;
    if (!resolvedEventId && !isDraft) {
      alert('Please select an event, or save as draft.');
      return;
    }

    setSaving(true);
    try {
      const { username } = await getCurrentUser();
      await client.graphql({
        query: createCourse,
        variables: {
          input: {
            name: courseName.trim(),
            description: courseDescription.trim() || undefined,
            venueId: venue?.id || 'unknown',
            eventId: resolvedEventId,
            courseLines: course.courseLines,
            startPoint: course.startPoint,
            finishPoint: course.finishPoint,
            elements: course.elements,
            coneCount: course.coneCount,
            owner: username,
            isDraft,
          },
        },
      });
      alert('Course saved! Head to the event to vote on it.');
      setStep('venue-select');
      setVenue(null);
      setCourse(null);
      setCourseName('');
      setCourseDescription('');
      setSelectedEventId('');
    } catch (err) {
      console.error('Failed to save course:', err);
      alert('Failed to save course. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const isVenueStep = step === 'venue-select' || step === 'venue-create';

  const renderStep = () => {
    switch (step) {
      case 'loading':
        return <div className="loading">Loading event...</div>;

      case 'venue-select':
        return (
          <div className="venue-select">
            <h2>Select Venue</h2>
            {venues.length === 0 ? (
              <div className="empty-state">
                <p>No venues exist yet.</p>
                {isAdmin
                  ? <button className="button-primary" onClick={() => setStep('venue-create')}>Create First Venue</button>
                  : <p>Ask an admin to add a venue before designing a course.</p>
                }
              </div>
            ) : (
              <>
                <div className="venues-list">
                  {venues.map(v => (
                    <div key={v.id} className="venue-card" onClick={() => handleVenueFromList(v)}>
                      <h3>{v.name}</h3>
                      {v.description && <p>{v.description}</p>}
                      {v.isPreset && <span className="preset-badge">Preset</span>}
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <button className="button-secondary" onClick={() => setStep('venue-create')}>
                    + Create New Venue
                  </button>
                )}
              </>
            )}
          </div>
        );

      case 'venue-create':
        return <MapVenueSelector onVenueSelected={handleVenueSelected} />;

      case 'design':
        return <MapCourseDesigner venue={venue} onCourseComplete={handleCourseComplete} />;

      case 'save':
        return (
          <div className="course-save">
            <h2>Save Your Course</h2>
            <div className="save-course-details">
              <div className="course-preview">
                <h3>Course Summary</h3>
                <div className="course-stats">
                  <div className="stat-item">
                    <span className="stat-label">Venue:</span>
                    <span className="stat-value">{venue?.name || 'Unknown'}</span>
                  </div>
                  {event && (
                    <div className="stat-item">
                      <span className="stat-label">Event:</span>
                      <span className="stat-value">{event.name}</span>
                    </div>
                  )}
                  <div className="stat-item">
                    <span className="stat-label">Cones:</span>
                    <span className="stat-value">{course?.coneCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="course-name">Course Name *</label>
                <input
                  type="text"
                  id="course-name"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  placeholder="Enter a name for your course"
                />
              </div>

              <div className="form-group">
                <label htmlFor="course-description">Description</label>
                <textarea
                  id="course-description"
                  value={courseDescription}
                  onChange={e => setCourseDescription(e.target.value)}
                  placeholder="Describe your course"
                  rows="3"
                />
              </div>

              {!eventId && (
                <div className="form-group">
                  <label htmlFor="event-select">Submit to Event *</label>
                  {events.length === 0 ? (
                    <p className="form-hint">No upcoming events. Ask an admin to create one first.</p>
                  ) : (
                    <select
                      id="event-select"
                      value={selectedEventId}
                      onChange={e => setSelectedEventId(e.target.value)}
                    >
                      <option value="">Select an event...</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name} — {new Date(ev.date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="save-options">
                <label>
                  <input type="checkbox" checked={isDraft} onChange={e => setIsDraft(e.target.checked)} />
                  {' '}Save as draft (no event required)
                </label>
              </div>

              <div className="save-actions">
                <button
                  className="button-primary"
                  onClick={handleSaveCourse}
                  disabled={saving || !courseName.trim()}
                >
                  {saving ? 'Saving...' : 'Save Course'}
                </button>
                <button className="button-secondary" onClick={() => setStep('design')}>
                  Back to Editor
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="course-design-page">
      <h1>Course Design{event ? ` — ${event.name}` : ''}</h1>

      <div className="progress-steps">
        <div className={`step ${isVenueStep ? 'active' : ''} ${step === 'design' || step === 'save' ? 'completed' : ''}`}>
          1. Select Venue
        </div>
        <div className={`step ${step === 'design' ? 'active' : ''} ${step === 'save' ? 'completed' : ''}`}>
          2. Design Course
        </div>
        <div className={`step ${step === 'save' ? 'active' : ''}`}>
          3. Save Course
        </div>
      </div>

      <div className="step-content">
        {renderStep()}
      </div>
    </div>
  );
}

export default CourseDesignPage;
