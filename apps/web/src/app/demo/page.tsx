"use client";

import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import { Button } from "@/components/ui/button";
import { useBackendAnalytics } from "@/features/analytics/hook";

export default function page() {
  const { mutate: PierceCaptureEvent } = useBackendAnalytics();

  const handlePierceClick = () => {
    PierceCaptureEvent({
      eventName: "pierce_click",
      data: { foo: "bar" },
    });
  };

  const { captureEvent } = usePostHogEvents();

  const handleClick = () => {
    // Track the demo button click
    captureEvent("demo_button_clicked", {
      buttonText: "Click me",
    });

    alert("Clicked!");
  };

  return (
    <div>
      <p>Hi. this is a demo page.</p>
      <Button onClick={handleClick}>Click me</Button>
      <Button onClick={handlePierceClick}>Blockers don't effect me</Button>
    </div>
  );
}
