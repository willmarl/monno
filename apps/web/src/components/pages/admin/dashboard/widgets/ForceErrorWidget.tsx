import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useForceError } from "@/features/admin/hooks";
import { toast } from "sonner";

export function ForceErrorWidget() {
  const forceError = useForceError();

  const handleBackendError = () => {
    toast.info("Triggering backend error");
    forceError.mutate();
  };

  const handleFrontendError = () => {
    toast.info("Triggered frontend error");
    throw new Error("Intentional frontend error for Sentry testing");
  };

  return (
    <Card className="p-6 max-w-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Error Testing</p>
          <p className="text-lg font-semibold">Sentry Integration</p>
        </div>
      </div>

      <div className="flex gap-1">
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
