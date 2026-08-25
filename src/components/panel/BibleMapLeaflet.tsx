"use client";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { BiblePlace } from "@/services/bibleReader";

/**
 * CEC Academy — Bíblia Integrada, Fase 3. Mapa interativo dos
 * Lugares Bíblicos (Pontos de Conhecimento categoria 'lugar' com
 * coordenadas). Mesma biblioteca e padrão visual do Mapa de
 * Expansão que já existia (Leaflet + OpenStreetMap).
 */
export default function BibleMapLeaflet({ places, onSelect }: { places: BiblePlace[]; onSelect: (id: string) => void }) {
  // Centro aproximado da região bíblica (Israel/Oriente Médio)
  const center: [number, number] = [31.5, 35.0];

  return (
    <div className="h-[480px] w-full overflow-hidden rounded-md border">
      <MapContainer center={center} zoom={6} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {places.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.latitude, p.longitude]}
            radius={9}
            pathOptions={{ color: "#C9A227", fillColor: "#C9A227", fillOpacity: 0.7, weight: 2 }}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <b style={{ color: "#0E2A47", fontSize: 14 }}>{p.title}</b>
                {p.subtitle && <p style={{ margin: "2px 0", fontSize: 12, color: "#C9A227", fontWeight: 600 }}>{p.subtitle}</p>}
                {p.bible_refs && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#666" }}>📖 {p.bible_refs}</p>}
                <button
                  onClick={() => onSelect(p.id)}
                  style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: "#0E2A47", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Ver detalhes →
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
