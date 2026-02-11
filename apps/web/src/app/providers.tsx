"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ModalProvider } from "@/components/modal/ModalProvider";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { PostHogProvider as CustomPostHogProvider } from "@/components/providers/PostHogProvider";
import { initPostHog } from "@/lib/posthog-init";

// Initialize PostHog at module load time
initPostHog();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <CustomPostHogProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <ModalProvider>{children}</ModalProvider>
              <ReactQueryDevtools initialIsOpen={false} />
            </TooltipProvider>
          </ThemeProvider>
        </CustomPostHogProvider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}
