import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { AuthContext } from '../App';
import { listEvents } from '../graphql/queries';
import { deleteEvent, updateEvent } from '../graphql/mutations';

const client = generateClient();
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function eventStatus(dateStr) {
  return new Date(dateStr + 'T12:00:00') >= new Date() ? 'upcoming' : 'completed';
}

function buildCalendarCells(year, month) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function EventCalendarPage() {
  const { isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    async function fetchEvents() {
      try {
        const result = await client.graphql({ query: listEvents });
        const items = result.data?.listEvents?.items ?? [];
        items.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(items);
      } catch (err) {
        setError('Failed to load events.');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  async function handleDelete(eventId) {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await client.graphql({ query: deleteEvent, variables: { input: { id: eventId } } });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      alert('Failed to delete event.');
    }
  }

  function startEdit(event) {
    setEditingId(event.id);
    setEditForm({ name: event.name, date: event.date, description: event.description || '' });
  }

  async function handleSaveEdit(eventId) {
    if (!editForm.name || !editForm.date) return;
    try {
      const status = eventStatus(editForm.date);
      const result = await client.graphql({
        query: updateEvent,
        variables: {
          input: {
            id: eventId,
            name: editForm.name,
            date: editForm.date,
            description: editForm.description || undefined,
            status,
          },
        },
      });
      const updated = result.data.updateEvent;
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updated } : e));
      setEditingId(null);
    } catch (err) {
      alert('Failed to save changes.');
    }
  }

  if (loading) return <div className="loading">Loading events...</div>;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const eventsByDate = {};
  events.forEach(ev => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  return (
    <div className="event-calendar-page">
      <div className="page-header">
        <h1>Events</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`tool-button ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button
              className={`tool-button ${view === 'calendar' ? 'active' : ''}`}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
          </div>
          {isAdmin && <Link to="/events/new" className="button-primary">+ Create Event</Link>}
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      {view === 'list' && (
        events.length === 0 ? (
          <div className="empty-state">
            <p>No events yet. {isAdmin ? 'Create one to get started.' : 'Check back soon!'}</p>
          </div>
        ) : (
          <div className="events-list">
            {events.map(event => {
              const status = eventStatus(event.date);

              if (editingId === event.id) {
                return (
                  <div key={event.id} className="event-card event-edit-form">
                    <div className="form-group">
                      <label>Event Name</label>
                      <input
                        value={editForm.name}
                        onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                        rows="2"
                      />
                    </div>
                    <div className="event-card-actions">
                      <button className="button-primary" onClick={() => handleSaveEdit(event.id)}>Save</button>
                      <button className="button-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={event.id} className="event-card">
                  <div className="event-card-header">
                    <div className="event-card-title">
                      <h2>{event.name}</h2>
                      <span className={`event-status ${status}`}>{status}</span>
                    </div>
                    {isAdmin && (
                      <div className="admin-actions">
                        <button className="button-secondary button-sm" onClick={() => startEdit(event)}>Edit</button>
                        <button className="button-danger button-sm" onClick={() => handleDelete(event.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                  <p className="event-date">
                    {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                  {event.description && <p className="event-description">{event.description}</p>}
                  <div className="event-card-actions">
                    <Link to={`/design/${event.id}`} className="button-primary">Design a Course</Link>
                    <Link to={`/voting/${event.id}`} className="button-secondary">View Courses</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {view === 'calendar' && (
        <div className="calendar-view">
          <div className="calendar-nav">
            <button
              className="tool-button"
              onClick={() => setCalendarDate(new Date(year, month - 1))}
            >
              ‹ Prev
            </button>
            <h2>
              {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              className="tool-button"
              onClick={() => setCalendarDate(new Date(year, month + 1))}
            >
              Next ›
            </button>
          </div>
          <div className="calendar-grid">
            {DAYS.map(d => (
              <div key={d} className="calendar-day-header">{d}</div>
            ))}
            {buildCalendarCells(year, month).map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="calendar-cell empty" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              return (
                <div key={day} className={`calendar-cell ${dayEvents.length ? 'has-events' : ''}`}>
                  <span className="day-number">{day}</span>
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="calendar-event"
                      onClick={() => navigate(`/voting/${ev.id}`)}
                    >
                      {ev.name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventCalendarPage;
