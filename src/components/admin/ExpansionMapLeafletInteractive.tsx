"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MarkerData {
  city: string; state: string; coords: [number, number];
  churches_count: number; lgs_count: number; members_count: number;
  church_names: string[]; church_ids: string[];
}

interface Props {
  markers: MarkerData[];
  onMarkerClick: (marker: MarkerData) => void;
}

export default function ExpansionMapLeafletInteractive({ markers, onMarkerClick }: Props) {
  const center: [number, number] = [-14.2, -51.9];
  const maxMembers = Math.max(1, ...markers.map(m => m.members_count));
  const radius = (count: number) => count === 0 ? 6 : 6 + ((count / maxMembers) * 24);

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-md border">
      <MapContainer center={center} zoom={4} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m, idx) => (
          <CircleMarker
            key={`${m.city}-${m.state}-${idx}`}
            center={m.coords}
            radius={radius(m.members_count)}
            pathOptions={{
              color: "#C9A227", fillColor: "#C9A227",
              fillOpacity: 0.65, weight: 2,
            }}
            eventHandlers={{ click: () => onMarkerClick(m) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <div style={{ fontSize: 12, minWidth: 140 }}>
                <b style={{ color: "#0E2A47" }}>{m.city}, {m.state}</b>
                <div style={{ marginTop: 4, color: "#555", lineHeight: 1.6 }}>
                  🏢 {m.churches_count} comunidade{m.churches_count !== 1 ? "s" : ""}<br />
                  🔥 {m.lgs_count} Life Group{m.lgs_count !== 1 ? "s" : ""}<br />
                  👥 {m.members_count} membro{m.members_count !== 1 ? "s" : ""}
                </div>
                <div style={{ marginTop: 4, color: "#C9A227", fontSize: 11 }}>
                  Clique para ver o painel completo →
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
