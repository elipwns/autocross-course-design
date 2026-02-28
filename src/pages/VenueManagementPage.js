import React, { useState, useEffect, useContext } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { AuthContext } from '../App';
import MapVenueSelector from '../components/MapVenueSelector';
import { listVenues } from '../graphql/queries';
import { createVenue, deleteVenue } from '../graphql/mutations';

const client = generateClient();

function VenueManagementPage() {
  const { isAdmin } = useContext(AuthContext);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  async function fetchVenues() {
    try {
      const result = await client.graphql({ query: listVenues });
      setVenues(result.data?.listVenues?.items ?? []);
    } catch (err) {
      console.error('Failed to load venues:', err);
      setError('Failed to load venues.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVenueCreated(selectedVenue) {
    setSaveError(null);
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
      const saved = result.data.createVenue;
      setVenues(prev => [...prev, saved]);
      setCreating(false);
    } catch (err) {
      console.error('Failed to save venue:', err);
      setSaveError('Failed to save venue. Check your permissions and try again.');
    }
  }

  async function handleDelete(venueId, venueName) {
    if (!window.confirm(`Delete "${venueName}"? This cannot be undone.`)) return;
    try {
      await client.graphql({ query: deleteVenue, variables: { input: { id: venueId } } });
      setVenues(prev => prev.filter(v => v.id !== venueId));
    } catch (err) {
      alert('Failed to delete venue.');
    }
  }

  if (loading) return <div className="loading">Loading venues...</div>;

  if (creating) {
    return (
      <div className="event-calendar-page">
        <div className="page-header">
          <h1>Create Venue</h1>
          <button className="button-secondary" onClick={() => { setCreating(false); setSaveError(null); }}>
            ← Back to Venues
          </button>
        </div>
        {saveError && <p className="error-message">{saveError}</p>}
        <div className="step-content">
          <MapVenueSelector onVenueSelected={handleVenueCreated} />
        </div>
      </div>
    );
  }

  return (
    <div className="event-calendar-page">
      <div className="page-header">
        <h1>Venues</h1>
        {isAdmin && (
          <button className="button-primary" onClick={() => setCreating(true)}>
            + Create Venue
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {venues.length === 0 ? (
        <div className="empty-state">
          <p>No venues yet. {isAdmin ? 'Create one to get started.' : 'Ask an admin to add venues.'}</p>
        </div>
      ) : (
        <div className="events-list">
          {venues.map(venue => (
            <div key={venue.id} className="event-card">
              <div className="event-card-header">
                <div className="event-card-title">
                  <h2>{venue.name}</h2>
                  {venue.isPreset && <span className="event-status upcoming">Preset</span>}
                </div>
                {isAdmin && (
                  <div className="admin-actions">
                    <button
                      className="button-danger button-sm"
                      onClick={() => handleDelete(venue.id, venue.name)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {venue.description && <p className="event-description">{venue.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VenueManagementPage;
