import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet";

import { PRIORITY_HEX, STATUS_LABEL, activeDuration } from "@/lib/civic";
import type { IssueCategory, IssuePriority, IssueStatus } from "@/lib/civic";

export type MapIssue = {
  id: string;
  title: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  confirmation_count: number;
  created_at: string;
  latitude: number;
  longitude: number;
};

type Props = {
  issues?: MapIssue[];
  center?: [number, number];
  zoom?: number;
  picked?: [number, number] | null;
  onPick?: (lat: number, lng: number) => void;
  className?: string;
};

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function IssueMap({
  issues = [],
  center = [12.9716, 77.5946],
  zoom = 13,
  picked,
  onPick,
  className = "h-80 w-full",
}: Props) {
  return (
    <div className={className}>
      <MapContainer center={picked ?? center} zoom={zoom} className="size-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onPick ? <ClickCatcher onPick={onPick} /> : null}
        {picked ? (
          <CircleMarker
            center={picked}
            radius={10}
            pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.85, weight: 2 }}
          />
        ) : null}
        {issues.map((issue) => (
          <CircleMarker
            key={issue.id}
            center={[issue.latitude, issue.longitude]}
            radius={9}
            pathOptions={{
              color: PRIORITY_HEX[issue.priority],
              fillColor: PRIORITY_HEX[issue.priority],
              fillOpacity: 0.75,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="text-sm font-semibold">{issue.title}</p>
                <p>{issue.category}</p>
                <p>Priority: {issue.priority}</p>
                <p>Active for: {activeDuration(issue.created_at)}</p>
                <p>Confirmations: {issue.confirmation_count}</p>
                <p>Status: {STATUS_LABEL[issue.status]}</p>
                <a href={`/issues/${issue.id}`}>Open issue</a>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
