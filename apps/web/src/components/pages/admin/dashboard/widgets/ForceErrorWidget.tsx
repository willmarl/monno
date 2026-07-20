"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useForceError } from "@/features/admin/hooks";
import { toast } from "sonner";

const STORAGE_KEY = "admin.hideSentryTriggers";

export function ForceErrorWidget() {
  const forceError = useForceError();
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "1");
    setReady(true);
  }, []);

  const hide = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setHidden(true);
  };

  const show = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHidden(false);
  };

  const handleBackendError = () => {
    toast.info("Triggering backend error");
    forceError.mutate();
  };

  const handleFrontendError = () => {
    toast.info("Triggered frontend error");
    throw new Error("Intentional frontend error for Sentry testing");
  };

  if (!ready) return null;

  if (hidden) {
    return (
      <button
        type="button"
        onClick={show}
        className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
      >
        Show error testing
      </button>
    );
  }

  return (
    <Card className="p-6 max-w-sm">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Error Testing</p>
            <p className="text-lg font-semibold">Sentry Integration</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={hide}>
          Hide
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        <Button
          onClick={handleBackendError}
          disabled={forceError.isPending}
          variant="destructive"
        >
          {forceError.isPending ? "Triggering..." : "Force Backend Error"}
        </Button>

        <Button onClick={handleFrontendError}>Force Frontend Error</Button>
      </div>
    </Card>
  );
}
