"use client";

import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import { Button } from "@/components/ui/button";

export default function page() {
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
    </div>
  );
}
