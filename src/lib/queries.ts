import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { IssueCategory, IssueStatus } from "@/lib/civic";

const ISSUE_SELECT = `
  id, title, description, category, latitude, longitude, address, image_url, status,
  priority, priority_score, confirmation_count, reported_by, assigned_team,
  assigned_worker_id, remarks, created_at, updated_at,
  reporter:profiles!issues_reported_by_fkey(id, name),
  worker:profiles!issues_assigned_worker_id_fkey(id, name, team)
`;

export type IssueRow = {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  latitude: number;
  longitude: number;
  address: string | null;
  image_url: string | null;
  status: IssueStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  priority_score: number;
  confirmation_count: number;
  reported_by: string;
  assigned_team: string | null;
  assigned_worker_id: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  reporter: { id: string; name: string } | null;
  worker: { id: string; name: string; team: string | null } | null;
};

export type CompletionRow = {
  id: string;
  issue_id: string;
  worker_id: string;
  started_at: string | null;
  completed_at: string | null;
  time_spent_minutes: number | null;
  work_description: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  completion_notes: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  status: "SUBMITTED" | "VERIFIED" | "REWORK_REQUESTED";
  created_at: string;
};

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export function useIssues(options?: { reportedBy?: string | undefined; workerId?: string | undefined }) {
  return useQuery({
    queryKey: ["issues", options ?? {}],
    queryFn: async () => {
      let query = supabase.from("issues").select(ISSUE_SELECT).order("created_at", { ascending: false });
      if (options?.reportedBy) query = query.eq("reported_by", options.reportedBy);
      if (options?.workerId) query = query.eq("assigned_worker_id", options.workerId);
      const res = await query;
      return unwrap(res) as unknown as IssueRow[];
    },
    staleTime: 15_000,
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: ["issue", id],
    queryFn: async () => {
      const issue = unwrap(
        await supabase.from("issues").select(ISSUE_SELECT).eq("id", id).maybeSingle(),
      ) as unknown as IssueRow | null;
      if (!issue) return null;
      const completions = unwrap(
        await supabase
          .from("issue_completions")
          .select("*")
          .eq("issue_id", id)
          .order("created_at", { ascending: false }),
      ) as unknown as CompletionRow[];
      return { issue, completions };
    },
  });
}

export function useMyConfirmations(userId?: string) {
  return useQuery({
    queryKey: ["my-confirmations", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const rows = unwrap(
        await supabase.from("issue_confirmations").select("issue_id").eq("user_id", userId as string),
      );
      return new Set((rows ?? []).map((r) => r.issue_id));
    },
  });
}

export function useFieldWorkers() {
  return useQuery({
    queryKey: ["field-workers"],
    queryFn: async () => {
      const roles = unwrap(
        await supabase.from("user_roles").select("user_id").eq("role", "FIELD_WORKER"),
      );
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const profiles = unwrap(
        await supabase.from("profiles").select("id, name, team").in("id", ids).order("name"),
      );
      return profiles ?? [];
    },
    staleTime: 60_000,
  });
}

export type NearbyIssue = {
  id: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confirmation_count: number;
  created_at: string;
  distance_m: number;
};

export async function findNearbyIssues(
  category: IssueCategory,
  lat: number,
  lng: number,
): Promise<NearbyIssue[]> {
  const { data, error } = await supabase.rpc("find_nearby_issues", {
    _category: category,
    _lat: lat,
    _lng: lng,
    _radius_m: 100,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as NearbyIssue[]).filter((i) => i.distance_m <= 100);
}

export function useInvalidateIssues() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["issues"] });
    qc.invalidateQueries({ queryKey: ["issue"] });
    qc.invalidateQueries({ queryKey: ["my-confirmations"] });
  };
}

export function useConfirmIssue() {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: async ({ issueId, userId }: { issueId: string; userId: string }) => {
      const { error } = await supabase
        .from("issue_confirmations")
        .insert({ issue_id: issueId, user_id: userId });
      if (error) {
        if (error.code === "23505" || error.message.includes("duplicate")) {
          throw new Error("You have already confirmed this issue.");
        }
        throw new Error(error.message);
      }
    },
    onSuccess: invalidate,
  });
}

export function useCreateIssue() {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      category: IssueCategory;
      latitude: number;
      longitude: number;
      address: string | null;
      image_url: string | null;
      reported_by: string;
    }) => {
      const { data, error } = await supabase.from("issues").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return data.id as string;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateIssue() {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<{
        status: IssueStatus;
        assigned_team: string | null;
        assigned_worker_id: string | null;
        remarks: string | null;
      }>;
    }) => {
      const { error } = await supabase.from("issues").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useAssignIssue() {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: async (input: {
      issueId: string;
      workerId: string | null;
      team: string | null;
      adminId: string;
      remarks: string | null;
    }) => {
      const { error } = await supabase
        .from("issues")
        .update({
          assigned_worker_id: input.workerId,
          assigned_team: input.team,
          remarks: input.remarks,
          status: input.workerId ? "ASSIGNED" : "VERIFIED",
        })
        .eq("id", input.issueId);
      if (error) throw new Error(error.message);
      const log = await supabase.from("issue_assignments").insert({
        issue_id: input.issueId,
        worker_id: input.workerId,
        team: input.team,
        assigned_by: input.adminId,
      });
      if (log.error) throw new Error(log.error.message);
    },
    onSuccess: invalidate,
  });
}

export function useStartTask() {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: async ({ issueId, workerId }: { issueId: string; workerId: string }) => {
      const startedAt = new Date().toISOString();
      const existing = unwrap(
        await supabase
          .from("issue_completions")
          .select("id")
          .eq("issue_id", issueId)
          .eq("worker_id", workerId)
          .neq("status", "VERIFIED")
          .maybeSingle(),
      ) as { id: string } | null;

      if (existing) {
        const upd = await supabase
          .from("issue_completions")
          .update({ started_at: startedAt, status: "SUBMITTED" })
          .eq("id", existing.id);
        if (upd.error) throw new Error(upd.error.message);
      } else {
        const ins = await supabase.from("issue_completions").insert({
          issue_id: issueId,
          worker_id: workerId,
          started_at: startedAt,
          submitted_at: null,
        });
        if (ins.error) throw new Error(ins.error.message);
      }

      const { error } = await supabase
        .from("issues")
        .update({ status: "IN_PROGRESS" })
        .eq("id", issueId);
      if (error) throw new Error(error.message);
      return startedAt;
    },
    onSuccess: invalidate,
  });
}

export function useSubmitCompletion() {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: async (input: {
      issueId: string;
      workerId: string;
      completionId: string | null;
      startedAt: string | null;
      timeSpentMinutes: number;
      workDescription: string;
      completionNotes: string | null;
      beforeImageUrl: string | null;
      afterImageUrl: string | null;
    }) => {
      const now = new Date().toISOString();
      const payload = {
        issue_id: input.issueId,
        worker_id: input.workerId,
        started_at: input.startedAt ?? now,
        completed_at: now,
        submitted_at: now,
        time_spent_minutes: input.timeSpentMinutes,
        work_description: input.workDescription,
        completion_notes: input.completionNotes,
        before_image_url: input.beforeImageUrl,
        after_image_url: input.afterImageUrl,
        status: "SUBMITTED" as const,
      };
      if (input.completionId) {
        const upd = await supabase
          .from("issue_completions")
          .update(payload)
          .eq("id", input.completionId);
        if (upd.error) throw new Error(upd.error.message);
      } else {
        const ins = await supabase.from("issue_completions").insert(payload);
        if (ins.error) throw new Error(ins.error.message);
      }
      const { error } = await supabase
        .from("issues")
        .update({ status: "COMPLETION_SUBMITTED" })
        .eq("id", input.issueId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useReviewCompletion() {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: async (input: {
      issueId: string;
      completionId: string;
      adminId: string;
      approve: boolean;
      remarks: string | null;
    }) => {
      const now = new Date().toISOString();
      const upd = await supabase
        .from("issue_completions")
        .update({
          status: input.approve ? "VERIFIED" : "REWORK_REQUESTED",
          verified_at: input.approve ? now : null,
          verified_by: input.adminId,
        })
        .eq("id", input.completionId);
      if (upd.error) throw new Error(upd.error.message);

      const { error } = await supabase
        .from("issues")
        .update({
          status: input.approve ? "RESOLVED" : "IN_PROGRESS",
          remarks: input.remarks,
        })
        .eq("id", input.issueId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}
