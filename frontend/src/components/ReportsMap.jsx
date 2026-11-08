import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { DEFAULT_CENTER, SL_BOUNDS, categoryLabel, statusMeta } from '../lib/constants.js';

function FitToReports({ reports }) {
  const map = useMap();
  useEffect(() => {
    if (!reports.length) return;
    const bounds = reports.map((r) => [r.lat, r.lng]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [reports, map]);
  return null;
}

/** Read-only map: each report is a pin coloured by its status. */
export default function ReportsMap({ reports, selectedId, onSelect, height = 380 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-cream-200" style={{ height }}>
      <MapContainer center={DEFAULT_CENTER} zoom={11} minZoom={7} maxBounds={SL_BOUNDS}
        style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToReports reports={reports} />
        {reports.map((r) => {
          const color = statusMeta(r.status).color;
          return (
            <CircleMarker
              key={r.id} center={[r.lat, r.lng]}
              radius={r.id === selectedId ? 14 : 10}
              pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelect?.(r.id) }}
            >
              <Popup>
                <strong>{r.title}</strong><br />
                {categoryLabel(r.category)}<br />
                {statusMeta(r.status).label}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
