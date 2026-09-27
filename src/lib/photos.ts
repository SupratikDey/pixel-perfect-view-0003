import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const PHOTO_BUCKET = "civic-photos";
const MAX_BYTES = 8 * 1024 * 1024;

/** Uploads an image to storage under the signed-in user's folder. Returns the object path. */
export async function uploadPhoto(file: File, userId: string, kind: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG or PNG).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That image is larger than 8 MB. Please choose a smaller photo.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return path;
}

export async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export function useSignedUrl(path?: string | null) {
  return useQuery({
    queryKey: ["signed-url", path],
    queryFn: () => getSignedUrl(path as string),
    enabled: Boolean(path),
    staleTime: 30 * 60 * 1000,
  });
}
