# How to refactor split Create*/InlineCreate* forms into a single component

## The problem

The old pattern had two separate components per resource:

- `Create{{Resource}}Form.tsx` — zero props, page-only, handles its own toast/redirect
- `InlineCreate{{Resource}}Form.tsx` — accepts callbacks, used in modals/components

These are redundant. The inline variant is a strict superset. This guide explains how to consolidate them.

The same applies to Edit forms:
- `Edit{{Resource}}Form.tsx` → page-only
- `InlineEdit{{Resource}}Form.tsx` → component version

---

## The target design

One file per operation. The form component:
- Accepts `onSuccess`, `onCancel`, `onError` callbacks
- Accepts `isAlwaysOpen?: boolean` (default false — shows a toggle button; true — renders form immediately)
- Handles all internal errors with `toast.error`
- Does **NOT** show success toasts — the importer handles that
- Does **NOT** redirect — the importer handles that via `onSuccess`

---

## Step-by-step

### 1. Find all form files for the resource

```
features/{{resource}}/components/Create{{Resource}}Form.tsx
features/{{resource}}/components/InlineCreate{{Resource}}Form.tsx
features/{{resource}}/components/Edit{{Resource}}Form.tsx      (if exists)
features/{{resource}}/components/InlineEdit{{Resource}}Form.tsx (if exists)
```

Admin variants follow the same pattern under `features/admin/{{resource}}/components/`.

### 2. Check which files import each form

Find all consumers of both the page-only form and the inline form:
- Pages (usually under `components/pages/{{resource}}/`)
- Modals (usually under `features/{{resource}}/components/modal/`)

### 3. Keep the Inline form, delete the page-only form

The inline form becomes the single form. Rename it by dropping "Inline":
- `InlineCreate{{Resource}}Form.tsx` → `Create{{Resource}}Form.tsx`
- `InlineEdit{{Resource}}Form.tsx` → `Edit{{Resource}}Form.tsx`
- `AdminInlineEdit{{Resource}}Form.tsx` → `AdminEdit{{Resource}}Form.tsx`

Rename the exported function and interface to match:
```tsx
// Before
interface InlineCreate{{Resource}}FormProps { ... }
export function InlineCreate{{Resource}}Form({ ... }: InlineCreate{{Resource}}FormProps)

// After
interface Create{{Resource}}FormProps { ... }
export function Create{{Resource}}Form({ ... }: Create{{Resource}}FormProps)
```

Delete the old page-only form files.

### 4. Remove success toasts from the form itself

The inline form may already have a `toast.success(...)` call. Remove it — the importer will handle it.

Keep `toast.error(...)` calls — those belong in the form.

```tsx
// Remove this from inside the form's submit handler:
toast.success("{{Resource}} created");

// Keep this:
toast.error("Some files have unsupported types...");
```

If `toast` is no longer imported after removing success toasts, remove the import too.

### 5. Update the page component

The page was using the old page-only form. Replace it with the new consolidated form:

```tsx
// Before
import { Create{{Resource}}Form } from "@/features/{{resource}}/components/Create{{Resource}}Form";

<Create{{Resource}}Form />
```

```tsx
// After
import { Create{{Resource}}Form } from "@/features/{{resource}}/components/Create{{Resource}}Form";

<Create{{Resource}}Form
  isAlwaysOpen
  onSuccess={() => toast.success("{{Resource}} created")}
/>
```

For **edit** pages, also pass the redirect:

```tsx
<Edit{{Resource}}Form
  isAlwaysOpen
  resourceData={resource}
  onSuccess={() => router.push(`/{{resource}}/${resource.id}`)}
/>
```

Make sure the page file has `"use client";` at the top if it uses hooks or callbacks.

### 6. Update modal consumers

Modals were already using the inline form, so only the import path/name changes.
Their `onSuccess` callbacks (close modal + toast) remain unchanged:

```tsx
// Before
import { InlineCreate{{Resource}}Form } from "../InlineCreate{{Resource}}Form";
<InlineCreate{{Resource}}Form ... />

// After
import { Create{{Resource}}Form } from "../Create{{Resource}}Form";
<Create{{Resource}}Form ... />
```

### 7. Add a JSDoc to the form

Add a short docstring above the function export to remind future editors:

```tsx
/**
 * Form for creating {{resource}}s.
 *
 * Handles submission and any media. Importer must handle:
 * - Success toast via onSuccess callback
 * - Navigation/redirect via onSuccess callback
 * - Error handling via onError callback
 *
 * isAlwaysOpen=false: renders as collapsible toggle button.
 * isAlwaysOpen=true: renders form immediately (pages/modals).
 */
export function Create{{Resource}}Form({ ... })
```

---

## Checklist

- [ ] Inline form renamed (file + export + interface)
- [ ] Old page-only form file deleted
- [ ] `toast.success` removed from form submit handler
- [ ] Page updated: uses new form with `isAlwaysOpen` + `onSuccess` for toast/redirect
- [ ] Page has `"use client";` directive
- [ ] All modal imports updated to new file/component name
- [ ] JSDoc added to form
- [ ] No remaining references to old `Inline*` or old page-only form names (`grep -rn "InlineCreate{{Resource}}\|InlineEdit{{Resource}}"`)
