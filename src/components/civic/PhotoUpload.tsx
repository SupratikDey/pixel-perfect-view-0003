import { useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadPhoto } from "@/lib/photos";
import { cn } from "@/lib/utils";

export function PhotoUpload({
  label,
  userId,
  kind,
  value,
  onChange,
  className,
}: {
  label: string;
  userId: string;
  kind: string;
  value: string | null;
  onChange: (path: string | null) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    value ? "done" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setStatus("uploading");
    setPreview(URL.createObjectURL(file));
    try {
      const path = await uploadPhoto(file, userId, kind);
      onChange(path);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setPreview(null);
      onChange(null);
      setError(err instanceof Error ? err.message : "Photo upload failed. Please try again.");
    }
  }

  function clear() {
    setPreview(null);
    setStatus("idle");
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="rounded-xl border border-dashed p-3">
        {preview ? (
          <img src={preview} alt={`${label} preview`} className="h-40 w-full rounded-lg object-cover" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-lg bg-muted/50 text-sm text-muted-foreground">
            No photo selected
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
          >
            {status === "uploading" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="size-4" aria-hidden />
            )}
            {status === "uploading" ? "Uploading…" : value ? "Replace photo" : "Choose photo"}
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <X className="size-4" aria-hidden />
              Remove
            </Button>
          ) : null}
          {status === "done" && value ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle2 className="size-4" aria-hidden />
              Photo uploaded
            </span>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
