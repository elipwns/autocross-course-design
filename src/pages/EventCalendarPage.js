import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { AuthContext } from '../App';
import { listEvents } from '../graphql/queries';

const client = generateClient();

function EventCalendarPage() {
  const { isAdmin } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const result = await client.graphql({ query: listEvents });
        const items = result.data?.listEvents?.items ?? [];
        items.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(items);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError('Failed to load events.');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="event-calendar-page">
      <div className="page-header">
        <h1>Upcoming Events</h1>
        {isAdmin && (
          <Link to="/events/new" className="button-primary">
            + Create Event
          </Link>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {events.length === 0 ? (
        <div className="empty-state">
          <p>No upcoming events. {isAdmin ? 'Create one to get started.' : 'Check back soon!'}</p>
        </div>
      ) : (
        <div className="events-list">
          {events.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-card-header">
                <h2>{event.name}</h2>
                <span className={`event-status ${event.status}`}>{event.status || 'upcoming'}</span>
              </div>
              <p className="event-date">{new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}</p>
              {event.description && <p className="event-description">{event.description}</p>}
              <div className="event-card-actions">
                <Link to={`/design/${event.id}`} className="button-primary">
                  Design a Course
                </Link>
                <Link to={`/voting/${event.id}`} className="button-secondary">
                  View Courses
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventCalendarPage;
