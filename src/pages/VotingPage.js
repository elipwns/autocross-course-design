import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { AuthContext } from '../App';
import { listCoursesByEvent, getEvent } from '../graphql/queries';
import { createVote, deleteCourse } from '../graphql/mutations';

const client = generateClient();

function VotingPage() {
  const { eventId } = useParams();
  const { user, isAdmin } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [votedCourseId, setVotedCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const [eventResult, coursesResult] = await Promise.all([
          client.graphql({ query: getEvent, variables: { id: eventId } }),
          client.graphql({ query: listCoursesByEvent, variables: { eventId } }),
        ]);
        setEvent(eventResult.data?.getEvent);
        setCourses(coursesResult.data?.listCoursesByEvent?.items ?? []);
      } catch (err) {
        console.error('Failed to load voting data:', err);
        setError('Failed to load courses.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [eventId]);

  async function handleVote(courseId) {
    if (votedCourseId) return;
    try {
      const { username } = await getCurrentUser();
      await client.graphql({
        query: createVote,
        variables: { input: { courseId, eventId, userId: username } },
      });
      setVotedCourseId(courseId);
    } catch (err) {
      console.error('Failed to submit vote:', err);
      alert('Failed to submit vote. Please try again.');
    }
  }

  async function handleDeleteCourse(courseId) {
    if (!window.confirm('Remove this course? This cannot be undone.')) return;
    try {
      await client.graphql({ query: deleteCourse, variables: { input: { id: courseId } } });
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert('Failed to remove course.');
    }
  }

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="voting-page">
      <h1>{event ? `Vote — ${event.name}` : 'Vote for Your Favorite Course'}</h1>
      <p>Browse submitted courses and vote for your favorite.</p>

      {error && <p className="error-message">{error}</p>}

      {!eventId && (
        <p className="empty-state">Select an event from the calendar to view courses.</p>
      )}

      {eventId && courses.length === 0 && !error && (
        <p className="empty-state">No courses submitted for this event yet.</p>
      )}

      {votedCourseId && (
        <div className="vote-confirmation">Your vote has been submitted!</div>
      )}

      <div className="courses-list">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <div className="course-card-header">
              <h3>{course.name}</h3>
              {isAdmin && (
                <button
                  className="button-danger button-sm"
                  onClick={() => handleDeleteCourse(course.id)}
                >
                  Remove
                </button>
              )}
            </div>
            {course.description && <p>{course.description}</p>}
            <div className="course-meta">
              <span>{course.coneCount ?? 0} cones</span>
              <span>by {course.owner}</span>
            </div>
            <div className="vote-section">
              <button
                onClick={() => handleVote(course.id)}
                className="vote-button button-primary"
                disabled={!!votedCourseId}
              >
                {votedCourseId === course.id ? 'Voted!' : 'Vote for This Course'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VotingPage;
