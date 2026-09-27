import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSignedUrl } from "@/lib/photos";
import { Skeleton } from "@/components/ui/skeleton";

export function StorageImage({
  path,
  alt,
  className,
  fallbackLabel = "No photo",
}: {
  path?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}) {
  const { data: url, isPending } = useSignedUrl(path);

  if (!path) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/50 text-xs text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="size-5" aria-hidden />
        {fallbackLabel}
      </div>
    );
  }

  if (isPending) return <Skeleton className={cn("rounded-lg", className)} />;

  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground",
          className,
        )}
      >
        Photo could not be loaded
      </div>
    );
  }

  return <img src={url} alt={alt} className={cn("rounded-lg object-cover", className)} />;
}
