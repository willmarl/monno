"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function OAuthButtons() {
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  return (
    <section aria-label="Sign in with a third-party provider">
      <ul className="space-y-3 list-none p-0 m-0">
        <li>
          <Button variant="outline" className="w-full font-medium" asChild>
            <a href={`${apiUrl}/auth/google`}>
              <FcGoogle className="h-5 w-5" aria-hidden="true" />
              Google
            </a>
          </Button>
        </li>

        <li>
          <Button
            variant="outline"
            className="w-full font-medium"
            asChild
            onClick={() => setShowCookieBanner(true)}
          >
            <a href={`${apiUrl}/auth/github`}>
              <FaGithub className="h-5 w-5" aria-hidden="true" />
              GitHub
            </a>
          </Button>
        </li>
      </ul>

      {showCookieBanner && (
        <Alert
          aria-live="polite"
          className="mt-3 border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="flex items-start justify-between gap-2 text-yellow-700 dark:text-yellow-400">
            <p>
              If GitHub is slow to load, look for a{" "}
              <strong>&quot;Third-party cookies are blocked&quot;</strong>{" "}
              notice in your browser&apos;s address bar and allow them for this
              site.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowCookieBanner(false)}
              aria-label="Dismiss"
              className="h-5 w-5 shrink-0 text-yellow-700 hover:bg-yellow-500/20 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-400"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}
