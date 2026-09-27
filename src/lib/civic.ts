import type { Database } from "@/integrations/supabase/types";

export type IssueCategory = Database["public"]["Enums"]["issue_category"];
export type IssueStatus = Database["public"]["Enums"]["issue_status"];
export type IssuePriority = Database["public"]["Enums"]["issue_priority"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export const CATEGORIES: IssueCategory[] = [
  "Pothole",
  "Streetlight",
  "Garbage",
  "Water Leakage",
  "Drainage",
  "Road Damage",
  "Other",
];

export const CATEGORY_SEVERITY: Record<IssueCategory, number> = {
  "Water Leakage": 8,
  Drainage: 8,
  Pothole: 6,
  "Road Damage": 6,
  Garbage: 5,
  Streetlight: 4,
  Other: 3,
};

export const STATUSES: IssueStatus[] = [
  "REPORTED",
  "VERIFIED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETION_SUBMITTED",
  "RESOLVED",
  "REJECTED",
];

export const STATUS_LABEL: Record<IssueStatus, string> = {
  REPORTED: "Reported",
  VERIFIED: "Verified",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  COMPLETION_SUBMITTED: "Awaiting verification",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export const PRIORITIES: IssuePriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const TEAMS = [
  "Road Maintenance Team",
  "Water & Drainage Team",
  "Sanitation Team",
  "Electrical Team",
];

export const ACTIVE_STATUSES: IssueStatus[] = [
  "REPORTED",
  "VERIFIED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETION_SUBMITTED",
];

/** Persistence contribution, capped at +10. Mirrors the database function. */
export function persistencePoints(createdAt: string | Date): number {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  let points: number;
  if (hours < 6) points = 0;
  else if (hours < 12) points = 1;
  else if (hours < 24) points = 2;
  else if (hours < 48) points = 3;
  else if (hours < 72) points = 4;
  else points = 4 + Math.floor((hours - 72) / 24);
  return Math.max(0, Math.min(10, points));
}

export function confirmationPoints(confirmations: number): number {
  return Math.max(0, Math.min(10, confirmations ?? 0));
}

export type ScoreBreakdown = {
  severity: number;
  confirmations: number;
  persistence: number;
  total: number;
  priority: IssuePriority;
};

export function scoreBreakdown(issue: {
  category: IssueCategory;
  confirmation_count: number;
  created_at: string;
}): ScoreBreakdown {
  const severity = CATEGORY_SEVERITY[issue.category] ?? 3;
  const confirmations = confirmationPoints(issue.confirmation_count);
  const persistence = persistencePoints(issue.created_at);
  const total = severity + confirmations + persistence;
  return { severity, confirmations, persistence, total, priority: priorityFromScore(total) };
}

export function priorityFromScore(score: number): IssuePriority {
  if (score >= 21) return "CRITICAL";
  if (score >= 15) return "HIGH";
  if (score >= 8) return "MEDIUM";
  return "LOW";
}

/** "Active for: 10h 42m" — measured from first report, never reset by confirmations. */
export function activeDuration(createdAt: string | Date, until?: string | Date | null): string {
  const end = until ? new Date(until).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((end - new Date(createdAt).getTime()) / 60_000));
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatMinutes(min?: number | null): string {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatDistance(metres: number): string {
  return metres < 1000 ? `${Math.round(metres)} m away` : `${(metres / 1000).toFixed(1)} km away`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const PRIORITY_DOT: Record<IssuePriority, string> = {
  LOW: "bg-low",
  MEDIUM: "bg-medium",
  HIGH: "bg-high",
  CRITICAL: "bg-critical",
};

export const PRIORITY_HEX: Record<IssuePriority, string> = {
  LOW: "#3b82f6",
  MEDIUM: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#dc2626",
};
