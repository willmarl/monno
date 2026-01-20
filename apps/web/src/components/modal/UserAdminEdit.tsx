"use client";

import { InlineUpdateUserAdminForm } from "@/features/users/components/InlineUpdateUserAdminForm";
import { User } from "@/features/users/types/user";

export function UserAdminEditModal({ user }: { user: User }) {
  return (
    <div>
      <InlineUpdateUserAdminForm
        user={user}
        onSuccess={() => {
          // You can add a toast notification here if desired
          console.log("UserEdit successfully");
        }}
        onCancel={() => {
          console.log("UserEdit failed");
        }}
        isAlwaysOpen={true}
      />
    </div>
  );
}
