# part 3-admin | admin create endpoint

> ⚠️ **SKIP entire file** unless human explicitly requested **admin** with **write** access (not read-only admin).
>
> User-facing create is in `3.md`. This adds `POST /admin/{{resource}}` so admins can create items from the admin dashboard (e.g. CRM appointments created by staff).

Admin create reuses the same `Create{{resource}}Dto` as user create. `creatorId` is set from the authenticated admin's JWT (`req.user.sub`).

---

## step 1 add `create` to admin-{{resource}}.service.ts

Add **before** `findById` (or after constructor). Mirror user `create` in `{{resource}}.service.ts` plus audit log.

```ts
import { Create{{resource}}Dto } from '../../{{resource}}/dto/create-{{resource}}.dto';

async create(adminId: number, data: Create{{resource}}Dto) {
  const {{resource}} = await this.prisma.{{resource}}.create({
    data: {
      ...data,
      creatorId: adminId,
    },
    select: DEFAULT_{{resource}}_SELECT,
  });

  await this.adminService.log({
    adminId,
    action: '{{RESOURCE_UPPER}}_CREATED',
    resource: '{{RESOURCE_UPPER}}',
    resourceId: {{resource}}.id.toString(),
    targetId: adminId,
    description: `Admin created {{resource}} "${{{resource}}.title}"`,
  });

  return {{resource}};
}
```

example (articles):

```ts
async create(adminId: number, data: CreateArticleDto) {
  const article = await this.prisma.article.create({
    data: {
      ...data,
      creatorId: adminId,
    },
    select: DEFAULT_ARTICLE_SELECT,
  });

  await this.adminService.log({
    adminId,
    action: 'ARTICLE_CREATED',
    resource: 'ARTICLE',
    resourceId: article.id.toString(),
    targetId: adminId,
    description: `Admin created article "${article.title}"`,
  });

  return article;
}
```

---

## step 2 add `POST` to admin-{{resource}}.controller.ts

Import `Create{{resource}}Dto`. Declare `@Post()` **before** any `@Get(':id')` routes.

```ts
import { Create{{resource}}Dto } from '../../{{resource}}/dto/create-{{resource}}.dto';

@Post()
create(@Body() body: Create{{resource}}Dto, @Req() req: any) {
  const adminId = req.user?.sub;
  return this.admin{{resource}}Service.create(adminId, body);
}
```

example (articles):

```ts
@Post()
create(@Body() body: CreateArticleDto, @Req() req: any) {
  const adminId = req.user?.sub;
  return this.adminArticleService.create(adminId, body);
}
```

---

## step 3 [PATH: complex] ensure `addMediaBatch` returns uploaded media

> **PATH: complex only.** Skip if `fileUpload` is `none` or `simple`.

Admin create forms call `applyCreateMediaChanges`, which needs the uploaded media IDs to set primary. If `addMediaBatch` does not `return` the result from `mediaService.addMediaBatch`, the frontend gets empty `data` and shows a false error even though create + upload succeeded.

In `admin-{{resource}}.service.ts`:

```ts
async addMediaBatch(adminId: number, resourceId: number, files: any[], userId: number) {
  const media = await this.mediaService.addMediaBatch({
    resourceWhere: { {{resource}}Id: resourceId },
    files,
    userId,
    maxCount: {{RESOURCE_UPPER}}_MEDIA_LIMIT,
    preset: {{RESOURCE_UPPER}}_MEDIA_PRESET,
  });

  await this.adminService.log({
    adminId,
    action: '{{RESOURCE_UPPER}}_MEDIA_ADDED',
    resource: '{{RESOURCE_UPPER}}',
    resourceId: resourceId.toString(),
    description: `Admin added ${files.length} media file(s) to {{resource}} ${resourceId}`,
  });

  return media; // required — do not omit
}
```

User-side `{{resource}}.service.ts` `addMediaBatch` already returns media; admin must match.

---

## step 4 human tests admin create

Add to Bruno / manual test list (see `8.md` admin section):

```
POST {{base_URL}}/admin/{{resource}}
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Admin-created item",
  "content": "Created from admin dashboard",
  "status": "DRAFT"
}
```

<!-- NEXT: 8.md (then 8c.md if PATH_LETTER=c) -->
