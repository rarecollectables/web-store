import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../custom-circle-marker.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Patch Leaflet marker icon URLs for modern bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom circular marker icon using divIcon
const circleIcon = L.divIcon({
  className: 'custom-circle-marker',
  iconSize: [24, 24]
});

/**
 * EventMap component for displaying event locations on a map.
 * @param {Array} events - Array of event objects, each with a location {lat, lng, city, country} and event_type, created_at.
 */
const EventMap = ({ events }) => {
  
  // Filter events with valid latitude/longitude
  const eventsWithLocation = events.filter(ev => ev.location && ev.location.latitude && ev.location.longitude);
  const defaultCenter = eventsWithLocation.length
    ? [Number(eventsWithLocation[0].location.latitude), Number(eventsWithLocation[0].location.longitude)]
    : [20, 0]; // fallback to world center

  return (
    <div style={{
      width: '100%',
      maxWidth: 900,
      margin: '32px auto 28px auto',
      padding: 24,
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 16px rgba(44,62,80,0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    }}>
      <div style={{fontWeight: 600, fontSize: 18, marginBottom: 12, color: '#2a3b7e'}}>Event Locations Map</div>
      <div style={{ width: '100%', height: 320, borderRadius: 12, overflow: 'hidden', background: '#e5e5e5', position: 'relative' }}>
        <MapContainer
        style={{ width: '100%', height: '100%' }}
        center={defaultCenter}
        zoom={2}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        {eventsWithLocation.map(ev => (
          <Marker key={ev.id} position={[Number(ev.location.latitude), Number(ev.location.longitude)]} icon={circleIcon}>
            <Popup>
              <div>
                <div><b>Event:</b> {ev.event_type}</div>
                <div><b>City:</b> {ev.location.city || '-'}</div>
                <div><b>Country:</b> {ev.location.country || '-'}</div>
                <div><b>Date:</b> {new Date(ev.created_at).toLocaleString()}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      </div>
    </div>
  );
};

export default EventMap;
