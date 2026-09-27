import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Crosshair, Loader2, MapPin, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/civic/AppShell";
import { MapView } from "@/components/civic/MapView";
import { PhotoUpload } from "@/components/civic/PhotoUpload";
import { StatusBadge } from "@/components/civic/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, activeDuration, formatDistance, type IssueCategory } from "@/lib/civic";
import { findNearbyIssues, useConfirmIssue, useCreateIssue, type NearbyIssue } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/report")({
  head: () => ({
    meta: [
      { title: "Report a civic issue — CivicPulse" },
      {
        name: "description",
        content:
          "Report a pothole, garbage pile, broken streetlight, water leak or drainage problem with a photo and exact location.",
      },
      { property: "og:title", content: "Report a civic issue — CivicPulse" },
      {
        property: "og:description",
        content: "Report a neighbourhood civic issue with a photo and exact location.",
      },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const createIssue = useCreateIssue();
  const confirmIssue = useConfirmIssue();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [address, setAddress] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [point, setPoint] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [duplicates, setDuplicates] = useState<NearbyIssue[] | null>(null);
  const [forceSeparate, setForceSeparate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("This device cannot share a location. Please tap the map instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint([pos.coords.latitude, pos.coords.longitude]);
        setDuplicates(null);
        setForceSeparate(false);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location access was blocked. Please tap the map to place the pin."
            : "We couldn't get your location. Please tap the map to place the pin.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function validate() {
    const next: Record<string, string> = {};
    if (title.trim().length < 5) next.title = "Give the issue a short, clear title (5+ characters).";
    if (description.trim().length < 15)
      next.description = "Please describe the problem in at least 15 characters.";
    if (!category) next.category = "Choose the category that fits best.";
    if (!point) next.location = "Place the pin on the map or use your current location.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function runDuplicateCheck(): Promise<NearbyIssue[]> {
    if (!category || !point) return [];
    setChecking(true);
    try {
      const found = await findNearbyIssues(category as IssueCategory, point[0], point[1]);
      setDuplicates(found);
      return found;
    } catch {
      toast.error("We couldn't check for nearby reports. You can still submit your report.");
      setDuplicates([]);
      return [];
    } finally {
      setChecking(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!validate()) return;

    if (!forceSeparate) {
      const found = duplicates ?? (await runDuplicateCheck());
      if (found.length > 0) {
        toast.info("We found a possible existing issue nearby — please check it below.");
        return;
      }
    }

    try {
      const id = await createIssue.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category: category as IssueCategory,
        latitude: point![0],
        longitude: point![1],
        address: address.trim() || null,
        image_url: photoPath,
        reported_by: user.id,
      });
      toast.success("Report submitted. Thank you!");
      navigate({ to: "/issues/$issueId", params: { issueId: id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Your report could not be saved.");
    }
  }

  async function confirmExisting(issueId: string) {
    if (!user) return;
    try {
      await confirmIssue.mutateAsync({ issueId, userId: user.id });
      toast.success("Your confirmation was added to the existing issue.");
      navigate({ to: "/issues/$issueId", params: { issueId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Your confirmation could not be saved.");
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submit} className="civic-card space-y-5 p-5">
          <div>
            <h1 className="text-2xl font-semibold">Report a civic issue</h1>
            <p className="text-sm text-muted-foreground">
              Reporting as {profile?.name ?? "citizen"}. Add a photo and pin the exact spot so the
              right team can find it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Large pothole near Main Road"
            />
            {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v as IssueCategory);
                setDuplicates(null);
                setForceSeparate(false);
              }}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category ? <p className="text-sm text-destructive">{errors.category}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">What is the problem?</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem, how long it has been there and how it affects people."
            />
            {errors.description ? (
              <p className="text-sm text-destructive">{errors.description}</p>
            ) : null}
          </div>

          {user ? (
            <PhotoUpload
              label="Photo (optional but very helpful)"
              userId={user.id}
              kind="issue"
              value={photoPath}
              onChange={setPhotoPath}
            />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="address">Nearest landmark or address (optional)</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ward 4, near the bus stop"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={useCurrentLocation} disabled={locating}>
              {locating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Crosshair className="size-4" aria-hidden />
              )}
              Use my current location
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={runDuplicateCheck}
              disabled={!category || !point || checking}
            >
              {checking ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Search className="size-4" aria-hidden />
              )}
              Check for existing reports
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={createIssue.isPending || checking}>
            {createIssue.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {forceSeparate ? "Submit as a separate issue" : "Submit report"}
          </Button>
        </form>

        <div className="space-y-4">
          <div className="civic-card p-3">
            <p className="px-1 pb-2 text-sm font-medium">
              Tap the map to place the pin
              {point ? (
                <span className="ml-2 text-xs text-muted-foreground">
                  {point[0].toFixed(5)}, {point[1].toFixed(5)}
                </span>
              ) : null}
            </p>
            <MapView
              className="h-[20rem] w-full"
              picked={point}
              onPick={(lat, lng) => {
                setPoint([lat, lng]);
                setDuplicates(null);
                setForceSeparate(false);
              }}
            />
            {errors.location ? (
              <p className="px-1 pt-2 text-sm text-destructive">{errors.location}</p>
            ) : null}
          </div>

          {duplicates && duplicates.length > 0 ? (
            <div className="civic-card border-warning/40 bg-warning/10 p-4">
              <h2 className="text-base font-semibold">Possible existing issue found nearby.</h2>
              <div className="mt-3 space-y-3">
                {duplicates.map((dup) => (
                  <div key={dup.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-snug">{dup.title}</p>
                      <StatusBadge status={dup.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{dup.category}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {formatDistance(dup.distance_m)}
                      </span>
                      <span>Active for {activeDuration(dup.created_at)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" aria-hidden />
                        {dup.confirmation_count} confirmations
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => confirmExisting(dup.id)}
                        disabled={confirmIssue.isPending}
                      >
                        I have this problem too
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setForceSeparate(true);
                  setDuplicates([]);
                  toast.info("You can now submit this as a separate issue.");
                }}
              >
                Report as a separate issue
              </Button>
            </div>
          ) : null}

          {duplicates && duplicates.length === 0 && !forceSeparate ? (
            <p className="text-sm text-muted-foreground">
              No active issue of this category was found within 100 metres.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
