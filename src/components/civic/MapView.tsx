import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { MapIssue } from "@/components/civic/IssueMap";

const IssueMap = lazy(() => import("@/components/civic/IssueMap"));

type Props = {
  issues?: MapIssue[];
  center?: [number, number];
  zoom?: number;
  picked?: [number, number] | null;
  onPick?: (lat: number, lng: number) => void;
  className?: string;
};

export function MapView(props: Props) {
  const fallback = <Skeleton className={props.className ?? "h-80 w-full"} />;
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <IssueMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}

export type { MapIssue };
