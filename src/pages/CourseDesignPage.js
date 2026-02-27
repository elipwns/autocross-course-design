import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import MapVenueSelector from '../components/MapVenueSelector';
import MapCourseDesigner from '../components/MapCourseDesigner';
import { getEvent, getVenue } from '../graphql/queries';
import { createCourse, createVenue } from '../graphql/mutations';

const client = generateClient();

function CourseDesignPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [course, setCourse] = useState(null);
  const [step, setStep] = useState('venue');
  const [saving, setSaving] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

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
          }
        }
      } catch (err) {
        console.error('Failed to load event/venue:', err);
      }
    }

    fetchEventAndVenue();
  }, [eventId]);

  const handleVenueSelected = async (selectedVenue) => {
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
    } catch (err) {
      console.error('Failed to save venue:', err);
      setVenue({ ...selectedVenue, id: null });
    }
    setStep('design');
  };

  const handleCourseComplete = (completedCourse) => {
    setCourse(completedCourse);
    setStep('save');
  };

  const handleSaveCourse = async () => {
    if (!courseName.trim()) {
      alert('Please enter a course name.');
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
            eventId: eventId || undefined,
            courseLines: course.courseLines,
            startPoint: course.startPoint,
            finishPoint: course.finishPoint,
            elements: course.elements,
            coneCount: course.coneCount,
            owner: username,
            isDraft,
            isPublic,
          },
        },
      });
      alert('Course saved successfully!');
      setStep('venue');
      setVenue(null);
      setCourse(null);
      setCourseName('');
      setCourseDescription('');
    } catch (err) {
      console.error('Failed to save course:', err);
      alert('Failed to save course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'venue':
        return <MapVenueSelector onVenueSelected={handleVenueSelected} />;
      case 'design':
        return <MapCourseDesigner venue={venue} onCourseComplete={handleCourseComplete} />;
      case 'save':
        return (
          <div className="course-save">
            <h2>Save Your Course</h2>
            <div className="save-course-details">
              <div className="course-preview">
                <h3>Course Preview</h3>
                <div className="course-stats">
                  <div className="stat-item">
                    <span className="stat-label">Venue:</span>
                    <span className="stat-value">{venue?.name || 'Unknown'}</span>
                  </div>
                  {eventId && (
                    <div className="stat-item">
                      <span className="stat-label">Event:</span>
                      <span className="stat-value">{event?.name || eventId}</span>
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
              <div className="save-options">
                <label>
                  <input type="checkbox" checked={isDraft} onChange={e => setIsDraft(e.target.checked)} />
                  {' '}Save as draft
                </label>
                <label>
                  <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                  {' '}Share with club members
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
        <div className={`step ${step === 'venue' ? 'active' : ''} ${step === 'design' || step === 'save' ? 'completed' : ''}`}>
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
