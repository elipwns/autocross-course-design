import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { AuthContext } from '../App';
import { listVenues } from '../graphql/queries';
import { createEvent } from '../graphql/mutations';

const client = generateClient();

function EventCreationPage() {
  const { isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState({
    name: '',
    date: '',
    description: '',
    venueId: '',
    status: 'upcoming',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    async function fetchVenues() {
      try {
        const result = await client.graphql({ query: listVenues });
        setVenues(result.data?.listVenues?.items ?? []);
      } catch (err) {
        console.error('Failed to load venues:', err);
      }
    }
    fetchVenues();
  }, [isAdmin, navigate]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.date || !form.venueId) {
      setError('Name, date, and venue are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { username } = await getCurrentUser();
      await client.graphql({
        query: createEvent,
        variables: {
          input: {
            name: form.name,
            date: form.date,
            description: form.description || undefined,
            venueId: form.venueId,
            status: form.status,
            owner: username,
          },
        },
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to create event:', err);
      setError('Failed to create event. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (venues.length === 0) {
    return (
      <div className="event-creation-page course-design-page">
        <h1>Create Event</h1>
        <div className="step-content">
          <p>No venues exist yet. You need to create a venue before creating an event.</p>
          <p>
            Go to <a href="/design">Design Course</a> — the first step lets you search for a
            location on the map and draw the venue boundary. Once saved, come back here to
            create an event.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-creation-page course-design-page">
      <h1>Create Event</h1>
      <div className="step-content">
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="name">Event Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Spring Autocross #1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="Optional event details"
            />
          </div>

          <div className="form-group">
            <label htmlFor="venueId">Venue *</label>
            <select id="venueId" name="venueId" value={form.venueId} onChange={handleChange} required>
              <option value="">Select a venue...</option>
              {venues.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="save-actions">
            <button type="submit" className="button-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Event'}
            </button>
            <button type="button" className="button-secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventCreationPage;
