import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { DEFAULT_CENTER, SL_BOUNDS } from '../lib/constants.js';

// A divIcon avoids Leaflet's default-marker image path problems under bundlers.
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="font-size:34px;line-height:34px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4))">📍</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function ClickHandler({ onChange }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function FlyTo({ value }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    // only re-centre when the coordinates themselves change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);
  return null;
}

/**
 * Interactive coordinate picker: click the map or drag the pin.
 * value: { lat, lng } | null     onChange: ({lat, lng}) => void
 */
export default function MapPicker({ value, onChange, height = 360 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-cream-200" style={{ height }}>
      <MapContainer
        center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
        zoom={value ? 15 : 12}
        minZoom={7}
        maxBounds={SL_BOUNDS}
        maxBoundsViscosity={0.8}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        <FlyTo value={value} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => { const p = e.target.getLatLng(); onChange({ lat: p.lat, lng: p.lng }); },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
