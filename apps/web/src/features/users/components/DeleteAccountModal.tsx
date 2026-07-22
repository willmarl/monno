"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModal } from "@/components/providers/ModalProvider";

/**
 * Confirm account deletion by re-entering the password.
 */
export function DeleteAccountModal({
  onConfirm,
  isPending,
}: {
  onConfirm: (password: string) => void;
  isPending?: boolean;
}) {
  const [password, setPassword] = useState("");
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col space-y-4">
      <p>
        This soft-deletes your account. Enter your password to confirm. This
        cannot be undone from the app.
      </p>
      <div className="space-y-2">
        <Label htmlFor="delete-account-password">Password</Label>
        <Input
          id="delete-account-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Current password"
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={closeModal} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={!password || isPending}
          onClick={() => onConfirm(password)}
        >
          {isPending ? "Deleting..." : "Delete account"}
        </Button>
      </div>
    </div>
  );
}
