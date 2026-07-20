# part 22 | admin dashboard create (frontend)

> ⚠️ **SKIP entire file** unless `ADMIN=yes` **and** backend `POST /admin/{{resource}}` exists (`3-admin-create.md`).
>
> Reference implementation: articles admin create. Mirror `CreateUserAdminForm` + `AdminUserPage` for page wiring; mirror user `Create{{resource}}Form` / `14c.md` for complex media flow.

**Naming:** `AdminCreate{{resource}}Form` + `AdminCreate{{resource}}Modal` (matches `AdminEdit{{resource}}Form`).

---

## step 1 admin types — add `Create{{resource}}Input`

`web/src/features/admin/{{resource}}/types/{{resource}}.ts`

```ts
export interface Create{{resource}}Input {
  title: string;
  content: string;
  status: {{resource}}Status;
}
```

Reuse the same field shapes as user `Create{{resource}}Input` unless admin create intentionally differs.

---

## step 2 zod schema

`web/src/features/admin/{{resource}}/schemas/adminCreate{{resource}}.schema.ts`

```ts
import { z } from "zod";
import { {{resource}}_STATUSES } from "../types/{{resource}}";

export const adminCreate{{resource}}Schema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  status: z.enum({{resource}}_STATUSES),
});

export type AdminCreate{{resource}}Input = z.infer<typeof adminCreate{{resource}}Schema>;
```

---

## step 3 api + hook

`features/admin/{{resource}}/api.ts`:

```ts
// POST /admin/{{resource}}
export const createAdmin{{resource}} = (data: Create{{resource}}Input) =>
  fetcher<{{resource}}>("/admin/{{resource}}", { method: "POST", json: data });
```

`features/admin/{{resource}}/hooks.ts`:

```ts
export function useAdminCreate{{resource}}() {
  return useMutation({
    mutationFn: createAdmin{{resource}},
    // Do not invalidate here — two-phase create + media; form invalidates after media (see 14.md cache rule).
    throwOnError: false,
  });
}
```

---

## step 4 `AdminCreate{{resource}}Form`

> **[PATH: none]** — Text-only form (copy `14.md` step 2 fields). After `mutateAsync`, call `queryClient.invalidateQueries({ queryKey: ["admin-{{resource}}"] })`. No redirect; call `onSuccess?.()`.
>
> **[PATH: simple]** — If admin create accepts FormData in one `POST`, you may invalidate in the mutation `onSuccess`. Otherwise follow complex pattern with admin media routes from `13{L}.md`.
>
> **[PATH: complex]** — Full pattern below. Reference: `AdminCreateArticleForm.tsx`.

`web/src/features/admin/{{resource}}/components/AdminCreate{{resource}}Form.tsx`

Key differences from user `Create{{resource}}Form`:

| User create | Admin create |
| ----------- | ------------ |
| `POST /{{resource}}` | `POST /admin/{{resource}}` |
| `add{{resource}}Media` | `addAdmin{{resource}}Media` |
| Redirects to `/{{resource}}/:id` | **No redirect** — stays on dashboard |
| Invalidates `["{{resource}}"]` | Invalidates `["admin-{{resource}}"]` |
| `onSuccess` = toast / close modal | Same |

```tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminCreate{{resource}}Schema,
  AdminCreate{{resource}}Input,
} from "../schemas/adminCreate{{resource}}.schema";
import { useAdminCreate{{resource}} } from "../hooks";
import {
  addAdmin{{resource}}Media,
  setAdmin{{resource}}MediaPrimary,
} from "../api";
// ... UI imports, MediaManager + media-utils for [PATH: complex] ...

export function AdminCreate{{resource}}Form({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: AdminCreate{{resource}}FormProps) {
  const queryClient = useQueryClient();
  // ... form setup, MediaManager state for complex path ...

  async function handleSubmit(data: AdminCreate{{resource}}Input) {
    setIsSubmitting(true);
    try {
      const item = await createMutation.mutateAsync(data);
      // [PATH: complex] — after applyCreateMediaChanges:
      await applyCreateMediaChanges({
        items,
        addFn: (files) => addAdmin{{resource}}Media(item.id, files),
        setPrimaryFn: (mediaId) =>
          setAdmin{{resource}}MediaPrimary(item.id, mediaId),
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-{{resource}}"] });
      handleReset();
      if (!isAlwaysOpen) setIsOpen(false);
      onSuccess?.();
    } catch (err: any) {
      onError?.(err);
      setIsSubmitting(false);
    }
  }
  // ... render form (no router.push) ...
}
```

---

## step 5 modal wrapper

`web/src/features/admin/{{resource}}/components/modal/AdminCreate{{resource}}Modal.tsx`

Mirror `AdminEdit{{resource}}Modal` / `CreateUserModal`:

```tsx
import { AdminCreate{{resource}}Form } from "../AdminCreate{{resource}}Form";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function AdminCreate{{resource}}Modal() {
  const { closeModal } = useModal();

  return (
    <AdminCreate{{resource}}Form
      onSuccess={() => {
        toast.success("Successfully created {{resource}}");
        closeModal();
      }}
      onError={() => {
        toast.error("Error trying to create {{resource}}");
      }}
      isAlwaysOpen={true}
    />
  );
}
```

---

## step 6 add Create button to `Admin{{resource}}Page`

Mirror `AdminUserPage` — search bar + button in a flex row.

`web/src/components/pages/admin/{{resource}}/Admin{{resource}}Page.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Admin{{resource}}SearchBar } from "@/features/admin/{{resource}}/components/Admin{{resource}}SearchBar";
import { {{resource}}DataTable } from "./{{resource}}DataTable";
import { useModal } from "@/components/providers/ModalProvider";
import { AdminCreate{{resource}}Modal } from "@/features/admin/{{resource}}/components/modal/AdminCreate{{resource}}Modal";

export function Admin{{resource}}Page({ searchParams }) {
  const { openModal } = useModal();

  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <div className="flex gap-2 mb-6">
        <Admin{{resource}}SearchBar />
        <Button
          onClick={() => {
            openModal({
              title: "Create new {{resource}}",
              content: <AdminCreate{{resource}}Modal />,
            });
          }}
        >
          Create {{resource}}
        </Button>
      </div>
      <{{resource}}DataTable searchParams={searchParams} />
    </div>
  );
}
```

example: `AdminArticlePage.tsx` uses `AdminCreateArticleModal` and label "Create Article".

---

## checklist

- [ ] `POST /admin/{{resource}}` works (3-admin-create.md)
- [ ] `createAdmin{{resource}}` + `useAdminCreate{{resource}}` (no list invalidation in hook)
- [ ] `AdminCreate{{resource}}Form` + modal
- [ ] Create button on admin dashboard page
- [ ] Complex path: invalidate `["admin-{{resource}}"]` **after** media upload, not after text create
- [ ] Complex path: `addMediaBatch` returns media array on backend

<!-- NEXT: 20.md (skip if no search) else 21.md per ROUTER -->
