# preamble

note everything here assumes the human or AI has prisma schema model ready (resource is in schema.prisma and the migrations has been set), for example:

```prisma
enum ResourceType {
  POST
  COMMENT
  {{resource}}
}

model User {
  ...
  {{resource}} {{resource}}[]
}

enum {{resource}}Status {
  DRAFT
  PUBLISHED
  ARCHIVED
  SCHEDULED
}

model {{resource}} {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  imagePath     String?
  status    {{resource}}Status @default(DRAFT)
  creatorId Int
  creator User @relation(fields: [creatorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deleted   Boolean   @default(false)
  deletedAt DateTime?
  likeCount Int       @default(0) // optional
  viewCount Int       @default(0) // optional
}
```

example :

```prisma
enum ResourceType {
  POST
  COMMENT
  ARTICLE
}

model User {
  articles Article[]
...
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  SCHEDULED
}

model Article {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  imagePath     String?
  status    ArticleStatus @default(DRAFT)
  creatorId Int
  creator User @relation(fields: [creatorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deleted   Boolean   @default(false)
  deletedAt DateTime?
  likeCount Int       @default(0) // optional
  viewCount Int       @default(0) // optional
}
```

This guide is meant for making new CRUD resource type/module using the current infrastructure that has auth, users, and guards already made. This guide is not meant for sophisticated measures such as cascading business logic, subscription/billing, microservices, and other super advance stuff.
If human has not provided you context of the schema model. stop, don't proceed to do any steps. ask for model context.

Note anytime im using example, im referencing Article. Adapt appropriately for example instead of `createdAt` it may be `purchasedAt` but concept is the same. there could be more or less properties to have. if unsure check with human to make sure you can accurately see their vision. for instance most schemas will not have image/imagePath. I am providing image to cover what to do if schema has some sort of media upload.

The example 'Article' I use is suppose to cover a good amount of scenarios. I don't expect most new resource to have media or enum of status so in examples if new source doesn't have need for enum or media upload can ignore that part of code.

if media upload is not simple like image refer to [how-to-do-file-upload.md](./how-to-do-file-upload.md)

**Adapting from the human's schema**: When the human provides their actual schema, use it as the source of truth for field names, types, and structure. The Article example in this guide is just a template — replace fields accordingly:

- Regular scalar fields (`String`, `Int`, `Boolean`, `DateTime`) → include in DTOs with appropriate validators
- Array fields (`String[]`, `Int[]`) → use `@IsArray()` + `@IsString({ each: true })` / `@IsInt({ each: true })` in DTOs
- Optional fields (`String?`) → wrap with `@IsOptional()` in DTOs
- Enum fields → import the enum from `generated/prisma/client` and use `@IsEnum()`
- Relation fields (`inventory Inventory[]`, `creator User`) → **do NOT include in create/update DTOs**. Relations are managed separately through their own endpoints or handled automatically by the service logic (e.g. `creatorId` comes from the authenticated user, not the request body)
- Auto-managed fields (`id`, `createdAt`, `updatedAt`, `deletedAt`) → **do NOT include in DTOs**, these are set by Prisma/Postgres automatically

Similarly, if schema has `viewCount Int @default(0)`, that signals the resource has a view count feature. Do not automatically add view count logic unless human explicitly requested it — the field may just be there for future use or added by habit.

> **Default rule**: if the human did not explicitly mention a feature, **assume it is NOT wanted**. Do not include it speculatively. When in doubt, ask.

## checklist of features

> Before implementing anything, confirm this checklist with the human. Mark each item as included or excluded. Steps marked **optional** throughout this guide should **only be implemented if the human explicitly requested it**.

**backend**

- basic CRUD
  - offset pagination (optional — clarify if not mentioned)
  - cursor pagination (optional — only add if human explicitly requests it)
  - could be both offset and cursor but clarify since unusual request (optional)
- file/media upload (optional — only add if human explicitly requests it)
- search (optional — clarify if not mentioned)
- admin (optional — only add if human explicitly requests it)
- able to like (optional — only add if human explicitly requests it)
- has view count (optional — only add if human explicitly requests it)
- able to comment on (optional — only add if human explicitly requests it)
- able to add to collection (optional — only add if human explicitly requests it)

**frontend**

- offset or cursor pagination or both
  - if cursor whether to have load more button or infinite scroll or both
- resource actions (only include what was requested in backend)
  - likes
  - views
  - comments
  - collections
- admin dashboard

## example of what human should ask you

```
Here is my blog schema model in schema.prisma can you make CRUD for it?
I want it to have:

- offset pagination
- search
- file upload for picture
- admin
```

## pre-implementation clarification checklist

Go through this checklist with the human **before writing any code**. Do not proceed until all items are confirmed.

**schema**

- [ ] Is the Prisma schema model provided?

**backend**

- [ ] Should there be an **admin** variant? (admin service + controller)
- [ ] Is there **file/media upload**?
  - [ ] If yes: what kind? Generic image? Video? Something more complex? Any processing (resize, format conversion, file size limit)?
- [ ] **Pagination** for `findAll` and `findByUserId` — none (primitive), offset, cursor, or both? (same strategy for both)
- [ ] Should there be a **search** endpoint?
  - [ ] If yes: should there also be a **search suggest** (autocomplete) endpoint?
- [ ] **Resource actions** — which of the following?
  - [ ] Likes
  - [ ] Views
  - [ ] Comments
  - [ ] Collections

**frontend**

- [ ] Do you want frontend implemented at all, or just the backend?
- [ ] If cursor pagination: **load more button**, **infinite scroll**, or both?
- [ ] Should the resource list appear on the **user profile page**?
- [ ] **Frontend resource actions** — confirm same set as backend (likes UI, views UI, comments UI, collections UI)
- [ ] **Admin dashboard** page + data table?

Once confirmed, summarize back to the human what you will implement before starting.

## implementation plan file

After confirming everything with the human, create a `CRUD-plan.md` file at the root of the project (or wherever makes sense). This file tracks what was agreed on so you don't lose context across a long conversation.

```md
# CRUD Plan — {{resource}}

## Resource

- Model: {{resource}}
- Prisma table: {{resource}} (plural: {{resource}}s)
- Route prefix: /{{resource}}

## Backend

- [ ] Basic CRUD
- [ ] Offset pagination (findAll, findByUserId)
- [ ] Cursor pagination (findAll, findByUserId)
- [ ] File/media upload
- [ ] Search
- [ ] Admin (service + controller + module)
- [ ] Likes
- [ ] Views
- [ ] Comments
- [ ] Collections

## Frontend

- [ ] Offset pagination
- [ ] Cursor pagination (load more / infinite scroll)
- [ ] Likes UI
- [ ] Views UI
- [ ] Comments UI
- [ ] Collections UI
- [ ] Admin dashboard page + data table

## Notes

(anything human clarified that doesn't fit above — e.g. "image field is optional", "no status enum", "admin only needs read/delete")
```

Fill in the checkboxes based on what was confirmed. Check them off as you complete each part. Update the Notes section whenever the human clarifies something mid-implementation.

# Part 1 | adding basic backend files

## step 1 make files

in `apps/api/src` make these files if not already
`modules/{{resource}}/{{resource}}.service.ts`
`modules/{{resource}}/{{resource}}.controller.ts`
`modules/{{resource}}/{{resource}}.module.ts`
`modules/{{resource}}/dto/create-{{resource}}.dto.ts`
`modules/{{resource}}/dto/update-{{resource}}.dto.ts`
`modules/{{resource}}/dto/search-{{resource}}.dto.ts` — ⚠️ SKIP unless human requested search
`modules/admin/{{resource}}/admin-{{resource}}.service.ts` — ⚠️ SKIP unless human requested admin
`modules/admin/{{resource}}/admin-{{resource}}.controller.ts` — ⚠️ SKIP unless human requested admin

for example:
`modules/articles/articles.service.ts`
`modules/articles/articles.controller.ts`
`modules/articles/articles.module.ts`
`modules/articles/dto/create-article.dto.ts`
`modules/articles/dto/update-article.dto.ts`
`modules/articles/dto/search-article.dto.ts` — ⚠️ SKIP unless human requested search
`modules/admin/articles/admin-article.service.ts` — ⚠️ SKIP unless human requested admin
`modules/admin/articles/admin-article.controller.ts` — ⚠️ SKIP unless human requested admin

> Note most of the time its plural, they're might be edge cases like "support" as in "support tickets" so having "supports" wouldn't make sense.

## Step 2 Add PrismaService to the {{resource}}.module.ts

> ⚠️ Only include `FileProcessingModule` in imports if human requested file/media upload. Otherwise remove it.

```ts
import { Module } from '@nestjs/common';
import { {{resource}}Service } from './{{resource}}.service';
import { {{resource}}Controller } from './{{resource}}.controller';
import { PrismaService } from '../../prisma.service';
import { FileProcessingModule } from '../../common/file-processing/file-processing.module'; // remove if no file upload

@Module({
  imports: [FileProcessingModule], // remove if no file upload
  controllers: [{{resource}}Controller],
  providers: [{{resource}}Service, PrismaService],
})
export class {{resource}}Module {}
```

example:

```ts
import { Module } from "@nestjs/common";
import { ArticlesService } from "./articles.service";
import { ArticlesController } from "./articles.controller";
import { PrismaService } from "../../prisma.service";
import { FileProcessingModule } from "../../common/file-processing/file-processing.module"; // remove if no file upload

@Module({
  imports: [FileProcessingModule], // remove if no file upload
  controllers: [ArticlesController],
  providers: [ArticlesService, PrismaService],
})
export class ArticlesModule {}
```

it is normal for lines 2 and 3 to give error as service and controller file is not set up yet.

## Step 3 make the DTO validations

for this step you will most definitely need to clarify with human what the validation should be but before asking to clarification first guess on what you think would appropriate validations.

You will also most definitely not need to make validations for all properties of schema like for creator/owner/author nor updated/created/deletedAt as it will most likely be handled automatically by prisma/postgres or by code in service file.

One final thing, validation for media like images is special as that usually implies a file upload component on frontend so you will be dealing with Multipart form or binary/file body. But I would say most the time you can omit the media part.

`create-{{resource}}.dto.ts`

```ts
import { IsString, MaxLength, MinLength, IsOptional, IsEnum } from 'class-validator';
import { {{resource}}Status } from '../../../generated/prisma/client';

export class Create{{resource}}Dto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsEnum({{resource}}Status)
  status!: {{resource}}Status;
}
```

example:

```ts
import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsEnum,
} from "class-validator";
import { ArticleStatus } from "../../../generated/prisma/client";

export class CreateArticleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsEnum(ArticleStatus)
  status!: ArticleStatus;
}
```

`update-{{resource}}.dto.ts`

```ts
import { IsString, MaxLength, MinLength, IsOptional, IsEnum } from 'class-validator';
import { {{resource}}Status } from '../../../generated/prisma/client';

export class Create{{resource}}Dto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsEnum({{resource}}Status)
  status?: {{resource}}Status;
}
```

example:

```ts
import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsEnum,
} from "class-validator";
import { ArticleStatus } from "../../../generated/prisma/client";

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
```

## step 3 add new module to app.module

in `src/app.module.ts` add to import group

```ts
import { {{resource}}Module } from './modules/{{resource}}/{{resource}}.module';
```

example:

```ts
import { ArticlesModule } from "./modules/articles/articles.module";
```

also add `{{resource}}Module,` to list of imports

```ts
imports: [
  ...
  {{resource}}Module,
],
```

example:

```ts
imports: [
  ...
  ArticlesModule,
],
```

## step 4 add to admin files to admin module

> ⚠️ SKIP THIS ENTIRE STEP unless human explicitly requested admin.

in the file `modules/admin/admin.module.ts` add imports and add on to array of controllers, providers, and exports inside the `@Module` decorator

it is normal for import lines of new resource to give error as service and controller file is not set up yet.

```ts
import { Admin{{resource}}sController } from './{{resource}}/admin-{{resource}}.controller';
import { Admin{{resource}}Service } from './{{resource}}/admin-{{resource}}.service';

@Module({
  imports: [UsersModule],
  controllers: [
    ...
    Admin{{resource}}sController,
  ],
  providers: [
    ...
    Admin{{resource}}Service,
  ],
  exports: [
    ...
    Admin{{resource}}Service,
  ],
})
```

example:

```ts
import { AdminArticlesController } from './articles/admin-article.controller';
import { AdminArticleService } from './articles/admin-article.service';

@Module({
  imports: [UsersModule],
  controllers: [
    ...
    AdminArticlesController,
  ],
  providers: [
    ...
    AdminArticleService,
  ],
  exports: [
    ...
    AdminArticleService,
  ],
})
```

# part 2 templates for service and controller

## service.ts

### step 1 prepare service.ts using template

here is the general template you'd want to use whenever init creating service.ts, even if you don't think you'll be using all the imported data, leave import lines in anyways.

> ⚠️ Remove `FileProcessingService` import and constructor injection if human did NOT request file upload. Remove `buildSearchWhere` import if human did NOT request search. Remove offset imports if human did NOT request offset pagination. Remove cursor imports if human did NOT request cursor pagination.

```ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Create{{resource}}Dto } from './dto/create-{{resource}}.dto';
import { Update{{resource}}Dto } from './dto/update-{{resource}}.dto';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { FileProcessingService } from '../../common/file-processing/file-processing.service'; // remove if no file upload
import { buildSearchWhere } from 'src/common/search/search.utils'; // remove if no search
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto'; // remove if no offset pagination
import { offsetPaginate } from 'src/common/pagination/offset-pagination'; // remove if no offset pagination
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto'; // remove if no cursor pagination
import { cursorPaginate } from 'src/common/pagination/cursor-pagination'; // remove if no cursor pagination

@Injectable()
export class {{resource}}Service {
  constructor(
    private prisma: PrismaService,
    private fileProcessing: FileProcessingService, // remove if no file upload
  ) {}

  ...
  // insert CRUD here
}
```

example:

```ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { FileProcessingService } from '../../common/file-processing/file-processing.service'; // remove if no file upload
import { buildSearchWhere } from 'src/common/search/search.utils'; // remove if no search
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto'; // remove if no offset pagination
import { offsetPaginate } from 'src/common/pagination/offset-pagination'; // remove if no offset pagination
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto'; // remove if no cursor pagination
import { cursorPaginate } from 'src/common/pagination/cursor-pagination'; // remove if no cursor pagination

@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private fileProcessing: FileProcessingService, // remove if no file upload
  ) {}

  ...
  // insert CRUD here. future steps will instruct how. please wait.
}
```

### step 2 make shared return

add this variable just before `@Injectable()`. will be reused a lot.

```ts
const DEFAULT_{{resource}}_SELECT = {
  id: true,
  title: true,
  content: true,
  imagePath: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};
```

example:

```ts
const DEFAULT_ARTICLE_SELECT = {
  id: true,
  title: true,
  content: true,
  imagePath: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};
```

### step 3 prepare controller.ts using template

here is the general template you'd want to use whenever init creating service.ts, even if you don't think you'll be using all the imported data, leave import lines in anyways.

> ⚠️ Remove `UseInterceptors`, `UploadedFile`, and `FileInterceptor` imports if human did NOT request file upload. Remove `PaginationDto` import if human did NOT request offset pagination. Remove `CursorPaginationDto` import if human did NOT request cursor pagination.

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
  HttpCode,
  ParseIntPipe,
  Query,
  UseInterceptors, // remove if no file upload
  UploadedFile // remove if no file upload
} from '@nestjs/common';

import { {{resource}}Service } from './{{resource}}.service';
import { Create{{resource}}Dto } from './dto/create-{{resource}}.dto';
import { Update{{resource}}Dto } from './dto/update-{{resource}}.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { JwtAccessOptionalGuard } from '../auth/guards/jwt-access-optional.guard';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto'; // remove if no offset pagination
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto'; // remove if no cursor pagination (already was)
import { CreatorGuard } from 'src/common/guards/creator.guard';
import { ProtectedResource } from 'src/decorators/protected-resource.decorator';
import { FileInterceptor } from '@nestjs/platform-express'; // remove if no file upload

@Controller('{{resource}}')
export class {{resource}}Controller {
  constructor(private readonly {{resource}}Service: {{resource}}Service) {}
  ...
  // insert CRUD here. future steps will instruct how. please wait.
}
```

example:

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
  HttpCode,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';

import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { JwtAccessOptionalGuard } from '../auth/guards/jwt-access-optional.guard';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto'; // remove if no offset pagination
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto'; // remove if no cursor pagination
import { CreatorGuard } from 'src/common/guards/creator.guard';
import { ProtectedResource } from 'src/decorators/protected-resource.decorator';
import { FileInterceptor } from '@nestjs/platform-express'; // remove if no file upload

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
  ...
  // insert CRUD here. future steps will instruct how. please wait.
}
```

### step 4 prepare admin-{{resource}}.service.ts using template

> ⚠️ SKIP THIS ENTIRE STEP (and all admin steps) unless human explicitly requested admin.

here is the general template you'd want to use whenever init creating admin service, even if you don't think you'll be using all the imported data, leave import lines in anyways.

> ⚠️ Within this file: remove `FileProcessingService` import and injection if human did NOT request file upload. Remove `buildSearchWhere` if human did NOT request search. Remove offset imports if human did NOT request offset pagination. Remove cursor imports if human did NOT request cursor pagination.

```ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { AdminService } from '../admin.service';
import { Update{{resource}}Dto } from '../../{{resource}}/dto/update-{{resource}}.dto';
import { FileProcessingService } from '../../../common/file-processing/file-processing.service'; // remove if no file upload
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { buildSearchWhere } from 'src/common/search/search.utils'; // remove if no search
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto'; // remove if no offset pagination
import { offsetPaginate } from 'src/common/pagination/offset-pagination'; // remove if no offset pagination
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto'; // remove if no cursor pagination
import { cursorPaginate } from 'src/common/pagination/cursor-pagination'; // remove if no cursor pagination

@Injectable()
export class Admin{{resource}}Service {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
    private fileProcessing: FileProcessingService, // remove if no file upload
  ) {}

  // insert CRUD here. future steps will instruct how. please wait.
}
```

example :

```ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma.service";
import { AdminService } from "../admin.service";
import { UpdateArticleDto } from "../../articles/dto/update-article.dto";
import { FileProcessingService } from "../../../common/file-processing/file-processing.service";
import { AlreadyDeletedException } from "src/common/exceptions/already-deleted.exception";
import { buildSearchWhere } from "src/common/search/search.utils";
import { PaginationDto } from "src/common/pagination/dto/pagination.dto";
import { offsetPaginate } from "src/common/pagination/offset-pagination";
import { CursorPaginationDto } from "src/common/pagination/dto/cursor-pagination.dto";
import { cursorPaginate } from "src/common/pagination/cursor-pagination";

@Injectable()
export class AdminArticleService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
    private fileProcessing: FileProcessingService,
  ) {}

  // insert CRUD here. future steps will instruct how. please wait.
}
```

### step 5 make shared return

add this variable just before `@Injectable()`. will be reused a lot.
the reason why there is different select const variable for admin and normal service.ts is incase you want normal to show minimal/non-sensitive data and admin to show all data.

```ts
const DEFAULT_{{resource}}_SELECT = {
  id: true,
  title: true,
  content: true,
  imagePath: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};
```

example:

```ts
const DEFAULT_ARTICLE_SELECT = {
  id: true,
  title: true,
  content: true,
  imagePath: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};
```

### step 6 prepare admin-{{resource}}.controller.ts using template

> ⚠️ SKIP THIS ENTIRE STEP (and all admin steps) unless human explicitly requested admin.

here is the general template you'd want to use whenever init creating service.ts, even if you don't think you'll be using all the imported data, leave import lines in anyways.

> ⚠️ Within this file: remove `PaginationDto` import if human did NOT request offset pagination. Remove `CursorPaginationDto` import if human did NOT request cursor pagination.

```ts
import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  Req,
  Post,
  HttpCode,
} from '@nestjs/common';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Admin{{resource}}Service } from './admin-{{resource}}.service';
import { Update{{resource}}Dto } from '../../{{resource}}/dto/update-{{resource}}.dto';
import { PaginationDto } from '../../../common/pagination/dto/pagination.dto'; // remove if no offset pagination
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto'; // remove if no cursor pagination

@Controller('admin/{{resource}}')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class Admin{{resource}}Controller {
  constructor(private readonly admin{{resource}}Service: Admin{{resource}}Service) {}

  // insert CRUD here. future steps will instruct how. please wait.
}
```

example :

```ts
import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  Req,
  Post,
  HttpCode,
} from "@nestjs/common";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { Roles } from "../../decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdminArticleService } from "./admin-article.service";
import { UpdateArticleDto } from "../articles/dto/update-article.dto";
import { PaginationDto } from "../../common/pagination/dto/pagination.dto"; // remove if no offset pagination
import { CursorPaginationDto } from "src/common/pagination/dto/cursor-pagination.dto"; // remove if no cursor pagination

@Controller("admin/articles")
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles("ADMIN")
export class AdminArticlesController {
  constructor(private readonly adminArticleService: AdminArticleService) {}

  // insert CRUD here. future steps will instruct how. please wait.
}
```

# part 3 | Create of CRUD

> ⚠️ Throughout this part: any step labelled **"admin"** should be SKIPPED unless human explicitly requested admin. Any section labelled **"file upload"** should be SKIPPED unless human explicitly requested file/media upload.

## Basic create

### step 1 'create' logic for service.ts

```ts
create(data: Create{{resource}}Dto, userId: number) {
    return this.prisma.{{resource}}.create({
      data: {
        ...data,
        creatorId: userId,
      },
      select: DEFAULT_{{resource}}_SELECT,
    });
  }
```

example:

```ts
create(data: CreateArticleDto, userId: number) {
    return this.prisma.article.create({
      data: {
        ...data,
        creatorId: userId,
      },
      select: DEFAULT_ARTICLE_SELECT,
    });
  }
```

### step 2 'create' endpoint for controller.ts

```ts
@Post()
  @UseGuards(JwtAccessGuard)
  create(@Req() req, @Body() body: Create{{resource}}Dto) {
    const userId = req.user.sub;
    return this.{{resource}}Service.create(body, userId);
  }
```

example:

```ts
@Post()
  @UseGuards(JwtAccessGuard)
  create(@Req() req, @Body() body: CreateArticleDto) {
    const userId = req.user.sub;
    return this.articlesService.create(body, userId);
  }
```

## Adding file upload to create

> ⚠️ SKIP THIS ENTIRE SECTION unless human explicitly requested file/media upload.

### step 1 add preset for what type of file to accept for upload inside file-upload-presets.ts

human will most likely need to come in here and tailor towards their vision especially if its something complex like video processing. Should prompt human to look at [how-to-do-file-upload.md](./how-to-do-file-upload.md). Nevertheless just broadly complete this step for MVP.

if human asks for complex media upload, put a pin on it and just have simple image upload for placeholder. Remind human to work on their complex media upload vision until CRUD guide is acceptable.

```ts
export const FILE_PRESETS = {
// ...existing presets...

{{resource}}Image: {
  maxSize: 5 * 1024 * 1024, // 5 MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  uploadPath: '{{resource}}/images',
  processingOptions: {
    resize: { width: 1000, height: 1000, fit: 'inside' as const },
    format: 'webp' as const,
    quality: 85,
  },
},
} as const satisfies Record<string, FileUploadConfig>;
```

example:

```ts
export const FILE_PRESETS = {
  // ...existing presets...

  articleImage: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    uploadPath: "articles/images",
    processingOptions: {
      resize: { width: 1000, height: 1000, fit: "inside" as const },
      format: "webp" as const,
      quality: 85,
    },
  },
} as const satisfies Record<string, FileUploadConfig>;
```

### step 2 add file logic service.ts

```ts
async create(data: Create{{resource}}Dto, userId: number, file?: any) {
    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        const imagePath = await this.fileProcessing.processFile(
          file,
          '{{resource}}Image',
          userId,
        );
        data.imagePath = imagePath;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to process image file';
        throw new BadRequestException(errorMessage);
      }
    }

    return this.prisma.{{resource}}.create({
      data: {
        ...data,
        creatorId: userId,
      },
    });
  }
```

example:

```ts
async create(data: CreateArticleDto, userId: number, file?: any) {
    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        const imagePath = await this.fileProcessing.processFile(
          file,
          'articleImage',
          userId,
        );
        data.imagePath = imagePath;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to process image file';
        throw new BadRequestException(errorMessage);
      }
    }

    return this.prisma.article.create({
      data: {
        ...data,
        creatorId: userId,
      },
    });
  }
```

### step 3 add file argument and interceptor controller.ts

```ts
@Post()
@UseInterceptors(FileInterceptor({{ field name used in multipart form data }}))
@UseGuards(JwtAccessGuard)
create(
  @Req() req,
  @Body() body: Create{{resource}}Dto,
  @UploadedFile() file?: any,
) {
  const userId = req.user.sub;
  return this.{{resource}}Service.create(body, userId, file);
}
```

example:

```ts
@Post()
@UseInterceptors(FileInterceptor('image'))
@UseGuards(JwtAccessGuard)
create(
  @Req() req,
  @Body() body: CreateArticleDto,
  @UploadedFile() file?: any,
) {
  const userId = req.user.sub;
  return this.articlesService.create(body, userId, file);
}
```

# part 4 | Read of CRUD

> ⚠️ Throughout this part: any step labelled **"admin"** should be SKIPPED unless human explicitly requested admin. Sections labelled **"cursor pagination"** should be SKIPPED unless human explicitly requested cursor pagination.

## find one/by Id

### step 1 'findOne' logic for service.ts

```ts
async findById(id: number) {
  const {{resource}} = await this.prisma.{{resource}}.findUnique({
    where: { id },
      select: DEFAULT_{{resource}}_SELECT,
    });

    if (!{{resource}} || {{resource}}.deleted) {
      throw new NotFoundException('{{resource}} not found');
    }

    return {{resource}};
  }
```

example:

```ts
async findById(id: number) {
  const article = await this.prisma.article.findUnique({
    where: { id },
      select: DEFAULT_ARTICLE_SELECT,
    });

    if (!article || article.deleted) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }
```

### step 2 'findOne' endpoint for controller.ts

```ts
@Get(':id')
findById(@Param('id', ParseIntPipe) id: number) {
  return this.{{resource}}Service.findById(id);
}
```

example :

```ts
@Get(':id')
findById(@Param('id', ParseIntPipe) id: number) {
  return this.articlesService.findById(id);
}
```

### step 3 admin 'findOne' logic for admin-{{resource}}.service.ts

```ts
async findById({{resource}}Id: number) {
  const {{resource}} = await this.prisma.{{resource}}.findUnique({
    where: { id: {{resource}}Id },
    select: DEFAULT_{{resource}}_SELECT,
  });

  if (!{{resource}}) {
    throw new NotFoundException('{{resource}} not found');
  }

  return {{resource}};
}
```

example :

```ts
async findById(articleId: number) {
  const article = await this.prisma.article.findUnique({
    where: { id: articleId },
    select: DEFAULT_ARTICLE_SELECT,
  });

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  return article;
}
```

### step 4 admin 'findOne' endpoint for admin-{{resource}}.controller.ts

```ts
@Get(':id')
findById(@Param('id', ParseIntPipe) id: number) {
  return this.admin{{resource}}Service.findById(id);
}
```

example :

```ts
@Get(':id')
findById(@Param('id', ParseIntPipe) id: number) {
  return this.adminArticleService.findById(id);
}
```

## (rare/optional) primitive find all (no pagination)

There might be rare scenario in which you want to fetch all, maybe for something you know will have low amount, but i'd say most of the time don't do this and skip this. Most of time should have at least simple offset pagination.

### step 1 'findAll' logic for service.ts

```ts
findAll() {
    return this.prisma.{{resource}}.findMany({
      orderBy: { createdAt: 'desc' },
      select: DEFAULT_{{resource}}_SELECT
    });
  }
```

example :

```ts
findAll() {
    return this.prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      select: DEFAULT_ARTICLE_SELECT
    });
  }
```

> friendly reminder to adjust `createdAt` accordingly (may be `likedAt`, or `purchasedAt`, etc). this reminder applies to future CRUD sections too.

### step 2 'findAll' endpoint for controller.ts

```ts
@Get()
findAll() {
  return this.{{resource}}Service.findAll();
}
```

example:

```ts
@Get()
findAll() {
  return this.articlesService.findAll();
}
```

### step 3 admin 'findAll' logic for admin-{{resource}}.service.ts

```ts
findAll() {
    return this.prisma.{{resource}}.findMany({
      orderBy: { createdAt: 'desc' },
      select: DEFAULT_{{resource}}_SELECT
    });
  }
```

example :

```ts
findAll() {
    return this.prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      select: DEFAULT_ARTICLE_SELECT
    });
  }
```

### step 4 admin 'findAll' endpoint for admin-{{resource}}.controller.ts

```ts
@Get()
findAll() {
  return this.admin{{resource}}Service.findAll();
}
```

example:

```ts
@Get()
findAll() {
  return this.adminArticlesService.findAll();
}
```

## offset pagination find all

> ⚠️ SKIP THIS ENTIRE SECTION unless human explicitly requested offset pagination.

### step 1 offset pagination logic for service.ts

```ts
async findAll(pag: PaginationDto) {
    const where = { deleted: false, creator: { status: 'ACTIVE' } };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.{{resource}},
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_{{resource}}_SELECT,
      },
      countQuery: { where: where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }
```

example:

```ts
async findAll(pag: PaginationDto) {
    const where = { deleted: false, creator: { status: 'ACTIVE' } };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.article,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
      countQuery: { where: where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }
```

### step 2 offset pagination endpoint for controller.ts

```ts
@Get()
findAll(@Query() pag: PaginationDto) {
  return this.{{resource}}Service.findAll(pag);
}
```

example:

```ts
@Get()
findAll(@Query() pag: PaginationDto) {
  return this.articlesService.findAll(pag);
}
```

### step 3 admin offset pagination logic for admin-{{Resource}}.service.ts

```ts
async findAll(pag: PaginationDto) {
    const where = {};
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.{{resource}},
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_{{resource}}_SELECT,
      },
      countQuery: { where: where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }
```

example:

```ts
async findAll(pag: PaginationDto) {
    const where = {};
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.article,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
      countQuery: { where: where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }
```

### step 4 admin offset pagination endpoint for admin-{{Resource}}.controller.ts

```ts
@Get()
findAll(@Query() pag: PaginationDto) {
  return this.admin{{resource}}Service.findAll(pag);
}
```

example:

```ts
@Get()
findAll(@Query() pag: PaginationDto) {
  return this.adminArticlesService.findAll(pag);
}
```

## cursor pagination find all

> ⚠️ SKIP THIS ENTIRE SECTION unless human explicitly requested cursor pagination.

### step 1 cursor pagination logic for service.ts

```ts
async findAllCursor(pag: CursorPaginationDto) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.{{resource}},
      limit: limit ?? 10,
      cursor,
      query: {
        where: { deleted: false, creator: { status: 'ACTIVE' } },
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_{{resource}}_SELECT,
      },
    });
    return {
      items,
      nextCursor: nextCursor,
    };
  }
```

example:

```ts
async findAllCursor(pag: CursorPaginationDto) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.article,
      limit: limit ?? 10,
      cursor,
      query: {
        where: { deleted: false, creator: { status: 'ACTIVE' } },
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
    });
    return {
      items,
      nextCursor: nextCursor,
    };
  }
```

### step 2 cursor pagination endpoint for controller.ts

```ts
@Get('cursor')
findAllCursor(@Query() pag: CursorPaginationDto) {
  return this.{{articles}}Service.findAllCursor(pag);
}
```

example:

```ts
@Get('cursor')
findAllCursor(@Query() pag: CursorPaginationDto) {
  return this.articlesService.findAllCursor(pag);
}
```

### step 3 admin cursor pagination logic for admin-{{resource}}.service.ts

```ts
async findAllCursor(pag: CursorPaginationDto) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.{{resource}},
      limit: limit ?? 10,
      cursor,
      query: {
        where: {},
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_{{resource}}_SELECT,
      },
    });
    return {
      items,
      nextCursor: nextCursor,
    };
  }
```

example:

```ts
async findAllCursor(pag: CursorPaginationDto) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.article,
      limit: limit ?? 10,
      cursor,
      query: {
        where: {},
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
    });
    return {
      items,
      nextCursor: nextCursor,
    };
  }
```

### step 4 admin cursor pagination endpoint for admin-{{resource}}.controller.ts

```ts
@Get('cursor')
findAllCursor(@Query() pag: CursorPaginationDto) {
  return this.admin{{articles}}Service.findAllCursor(pag);
}
```

example:

```ts
@Get('cursor')
findAllCursor(@Query() pag: CursorPaginationDto) {
  return this.adminArticlesService.findAllCursor(pag);
}
```

## find all created/owner by user (rare/optional — no pagination)

> ⚠️ SKIP THIS ENTIRE SECTION unless human explicitly requested this. This returns all records with no pagination — only appropriate for resources known to have a low item count. Use your judgement: for example `GET /users/:id/products` doesn't make sense if users don't "own" products in a shopping context. If unsure, ask for clarification.

### step 1 find all by user logic for service.ts

```ts
async findByUserIdRaw(userId: number) {
    return this.prisma.{{resource}}.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
	  select: DEFAULT_{{resource}}_SELECT,
    });
  }
```

example:

```ts
async findByUserIdRaw(userId: number) {
    return this.prisma.article.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
	  select: DEFAULT_article_SELECT,
    });
  }
```

### step 2 find all by user endpoint for controller.ts

```ts
@Get('users/:userId')
findByUserIdRaw(@Param('userId', ParseIntPipe) userId: number) {
  return this.{{resource}}Service.findByUserIdRaw(userId);
}
```

example :

```ts
@Get('users/:userId')
findByUserIdRaw(@Param('userId', ParseIntPipe) userId: number) {
  return this.articlesService.findByUserIdRaw(userId);
}
```

## find all created/owner by user offset pagination

> ⚠️ SKIP THIS ENTIRE SECTION unless human explicitly requested offset pagination.

### step 1 offset pagination find all by user logic for service.ts

```ts
async findByUserId(userId: number, pag: PaginationDto) {
  const where = {
    creatorId: userId,
      deleted: false,
      creator: { status: 'ACTIVE' },
    };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.{{resource}},
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_{{resource}}_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }
```

example:

```ts
async findByUserId(userId: number, pag: PaginationDto) {
  const where = {
    creatorId: userId,
      deleted: false,
      creator: { status: 'ACTIVE' },
    };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.article,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }
```

### step 2 offset pagination find all by user endpoint for controller.ts

```ts
@Get('users/:userId')
findByUserId(@Param('userId', ParseIntPipe) userId: number, @Query() pag: PaginationDto) {
  return this.{{resource}}Service.findByUserId(userId, pag);
}
```

example:

```ts
@Get('users/:userId')
findByUserId(@Param('userId', ParseIntPipe) userId: number, @Query() pag: PaginationDto) {
  return this.articlesService.findByUserId(userId, pag);
}
```

## find all created/owner by user cursor pagination

> ⚠️ SKIP THIS ENTIRE SECTION unless human explicitly requested cursor pagination.

### step 1 cursor pagination find all by user logic for service.ts

```ts
async findByUserIdCursor(userId: number, pag: CursorPaginationDto) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.{{resource}},
      limit: limit ?? 10,
      cursor,
      query: {
        where: {
          creatorId: userId,
          deleted: false,
          creator: { status: 'ACTIVE' },
        },
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_{{resource}}_SELECT,
      },
    });

    return {
      items,
      nextCursor,
    };
  }
```

example:

```ts
async findByUserIdCursor(userId: number, pag: CursorPaginationDto) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.article,
      limit: limit ?? 10,
      cursor,
      query: {
        where: {
          creatorId: userId,
          deleted: false,
          creator: { status: 'ACTIVE' },
        },
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_ARTICLE_SELECT,
      },
    });

    return {
      items,
      nextCursor,
    };
  }
```

### step 2 cursor pagination find all by user endpoint for controller.ts

```ts
@Get('users/:userId/cursor')
findByUserIdCursor(
  @Param('userId', ParseIntPipe) userId: number,
  @Query() pag: CursorPaginationDto,
) {
  return this.{{resource}}Service.findByUserIdCursor(userId, pag);
}
```

example:

```ts
@Get('users/:userId/cursor')
findByUserIdCursor(
  @Param('userId', ParseIntPipe) userId: number,
  @Query() pag: CursorPaginationDto,
) {
  return this.articlesService.findByUserIdCursor(userId, pag);
}
```

# part 5 | update of CRUD

> ⚠️ Throughout this part: any step labelled **"admin"** should be SKIPPED unless human explicitly requested admin. Any section labelled **"file upload"** should be SKIPPED unless human explicitly requested file/media upload.

## Basic update

### step 1 'update' logic for service.ts

```ts
async update(id: number, data: Update{{resource}}Dto) {
  const {{resource}} = await this.prisma.{{resource}}.findUnique({
    where: { id: id },
  });

  if (!{{resource}}) {
    throw new NotFoundException('{{resource}} not found');
  }

  const updated = await this.prisma.{{resource}}.update({
    where: { id: id },
    data,
    select: DEFAULT_{{resource}}_SELECT,
  });

  return updated;
}
```

example:

```ts
async update(id: number, data: UpdateArticleDto) {
  const article = await this.prisma.article.findUnique({
    where: { id: id },
  });

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  const updated = await this.prisma.article.update({
    where: { id: id },
    data,
    select: DEFAULT_ARTICLE_SELECT,
  });

  return updated;
}
```

### step 2 'update' endpoint for controller.ts

```ts
@UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('{{resource}}')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Update{{resource}}Dto) {
    return this.{{resource}}Service.update(id, dto);
  }
```

example :

```ts
@UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('article')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticleDto) {
    return this.articlesService.update(id, dto);
  }
```

### step 3 admin 'update' logic for admin-{{resource}}.service.ts

```ts
async update(adminId: number, id: number, data: Update{{resource}}Dto) {
  const {{resource}} = await this.prisma.{{resource}}.findUnique({
    where: { id: id },
  });

  if (!{{resource}}) {
    throw new NotFoundException('{{resource}} not found');
  }

  const updated = await this.prisma.{{resource}}.update({
    where: { id: id },
    data,
    select: DEFAULT_{{resource}}_SELECT,
  });

  // Log the update
  await this.adminService.log({
    adminId,
    action: '{{resource}}_UPDATED',
    resource: '{{resource}}',
    resourceId: id.toString(),
    targetId: {{resource}}.creatorId,
    description: `Admin updated {{resource}} "${{{resource}}.title}"`,
  });

  return updated;
}
```

example :

```ts
async update(adminId: number, id: number, data: UpdateArticleDto) {
  const article = await this.prisma.article.findUnique({
    where: { id: id },
  });

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  const updated = await this.prisma.article.update({
    where: { id: id },
    data,
    select: DEFAULT_ARTICLE_SELECT,
  });

  // Log the update
  await this.adminService.log({
    adminId,
    action: 'ARTICLE_UPDATED',
    resource: 'ARTICLE',
    resourceId: id.toString(),
    targetId: article.creatorId,
    description: `Admin updated article "${article.title}"`,
  });

  return updated;
}
```

### step 4 admin 'update' endpoint for admin-{{resource}}.controller.ts

```ts
@Patch(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: Update{{resource}}Dto,
  @Req() req: any,
) {
  const adminId = req.user?.sub;
  return this.admin{{resource}}Service.update(adminId, id, body);
}
```

example :

```ts
@Patch(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: UpdateArticleDto,
  @Req() req: any,
) {
  const adminId = req.user?.sub;
  return this.adminArticleService.update(adminId, id, body);
}
```

## Adding file upload to update

> ⚠️ SKIP THIS ENTIRE SECTION unless human explicitly requested file/media upload.

### step 1 add file logic service.ts

```ts
async update(id: number, data: Update{{resource}}Dto, file?: any) {
    const {{resource}} = await this.prisma.{{resource}}.findUnique({
      where: { id: id },
    });

    if (!{{resource}}) {
      throw new NotFoundException('{{resource}} not found');
    }

    const userId = {{resource}}.creatorId;

    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        // Get the current {{resource}} to retrieve old image path
        const {{resource}} = await this.prisma.{{resource}}.findUnique({
          where: { id: id },
          select: { imagePath: true },
        });

        // Delete old image if it exists
        if ({{resource}}?.imagePath) {
          await this.fileProcessing.deleteFile({{resource}}.imagePath);
        }

        const imagePath = await this.fileProcessing.processFile(
          file,
          '{{resource}}Image',
          userId,
        );
        data.imagePath = imagePath;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to process image file';
        throw new BadRequestException(errorMessage);
      }
    }

    return this.prisma.{{resource}}.update({
      where: { id },
      data,
      select: DEFAULT_{{resource}}_SELECT,
    });
  }
```

example:

```ts
async update(id: number, data: UpdateArticleDto, file?: any) {
    const article = await this.prisma.article.findUnique({
      where: { id: id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const userId = article.creatorId;

    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        // Get the current article to retrieve old image path
        const article = await this.prisma.article.findUnique({
          where: { id: id },
          select: { imagePath: true },
        });

        // Delete old image if it exists
        if (article?.imagePath) {
          await this.fileProcessing.deleteFile(article.imagePath);
        }

        const imagePath = await this.fileProcessing.processFile(
          file,
          'articleImage',
          userId,
        );
        data.imagePath = imagePath;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to process image file';
        throw new BadRequestException(errorMessage);
      }
    }

    return this.prisma.article.update({
      where: { id },
      data,
      select: DEFAULT_ARTICLE_SELECT,
    });
  }
```

### step 2 add file argument and interceptor controller.ts

```ts
@UseGuards(JwtAccessGuard, CreatorGuard)
@ProtectedResource('{{resource}}')
@UseInterceptors(FileInterceptor({{ field name used in multipart form data }})))
@Patch(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Req() req: any,
  @Body() dto: Update{{resource}}Dto,
  @UploadedFile() file?: any,
) {
  return this.{{resource}}sService.update(id, dto, file);
}
```

example:

```ts
@UseGuards(JwtAccessGuard, CreatorGuard)
@ProtectedResource('article')
@UseInterceptors(FileInterceptor('image'))
@Patch(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Req() req: any,
  @Body() dto: UpdateArticleDto,
  @UploadedFile() file?: any,
) {
  return this.articlesService.update(id, dto, file);
}
```

### step 3 add admin file logic admin-{{resource}}.service.ts

```ts
async update(
  adminId: number,
  id: number,
  data: Update{{resource}}Dto,
  file?: any,
) {
  const {{resource}} = await this.prisma.{{resource}}.findUnique({
    where: { id: id },
  });

  if (!{{resource}}) {
    throw new NotFoundException('{{resource}} not found');
  }

  const userId = {{resource}}.creatorId;

  // If file is provided, process it using FileProcessingService
  if (file) {
    try {
      // Get the current {{resource}} to retrieve old image path
      const {{resource}} = await this.prisma.{{resource}}.findUnique({
        where: { id: id },
        select: { imagePath: true },
      });

      // Delete old image if it exists
      if ({{resource}}?.imagePath) {
        await this.fileProcessing.deleteFile({{resource}}.imagePath);
      }

      const imagePath = await this.fileProcessing.processFile(
        file,
        '{{resource}}Image',
        userId,
      );
      data.imagePath = imagePath;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to process image file';
      throw new BadRequestException(errorMessage);
    }
  }

  // Log the update
  await this.adminService.log({
    adminId,
    action: '{{resource}}_UPDATED',
    resource: '{{resource}}',
    resourceId: id.toString(),
    targetId: {{resource}}.creatorId,
    description: `Admin updated {{resource}} "${{{resource}}.title}"`,
  });

  return this.prisma.{{resource}}.update({
    where: { id },
    data,
    select: DEFAULT_{{resource}}_SELECT,
  });
}
```

example :

```ts
async update(
  adminId: number,
  id: number,
  data: UpdateArticleDto,
  file?: any,
) {
  const article = await this.prisma.article.findUnique({
    where: { id: id },
  });

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  const userId = article.creatorId;

  // If file is provided, process it using FileProcessingService
  if (file) {
    try {
      // Get the current article to retrieve old image path
      const article = await this.prisma.article.findUnique({
        where: { id: id },
        select: { imagePath: true },
      });

      // Delete old image if it exists
      if (article?.imagePath) {
        await this.fileProcessing.deleteFile(article.imagePath);
      }

      const imagePath = await this.fileProcessing.processFile(
        file,
        'articleImage',
        userId,
      );
      data.imagePath = imagePath;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to process image file';
      throw new BadRequestException(errorMessage);
    }
  }

  // Log the update
  await this.adminService.log({
    adminId,
    action: 'ARTICLE_UPDATED',
    resource: 'ARTICLE',
    resourceId: id.toString(),
    targetId: article.creatorId,
    description: `Admin updated article "${article.title}"`,
  });

  return this.prisma.article.update({
    where: { id },
    data,
    select: DEFAULT_ARTICLE_SELECT,
  });
}
```

### step 4 add admin file argument and interceptor admin-{{resource}}.controller.ts

```ts
@Patch(':id')
@UseInterceptors(FileInterceptor({{ field name used in multipart form data }}))
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: Update{{resource}}Dto,
  @Req() req: any,
  @UploadedFile() file?: any,
) {
  const adminId = req.user?.sub;
  return this.admin{{resource}}Service.update(adminId, id, body, file);
}
```

example :

```ts
@Patch(':id')
@UseInterceptors(FileInterceptor('image'))
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: UpdateArticleDto,
  @Req() req: any,
  @UploadedFile() file?: any,
) {
  const adminId = req.user?.sub;
  return this.adminArticleService.update(adminId, id, body, file);
}
```

# part 6 | delete of CRUD

> ⚠️ Throughout this part: any step labelled **"admin"** should be SKIPPED unless human explicitly requested admin.

## step 1 soft delete logic for service.ts

```ts
async remove(id: number) {
    // Check if {{resource}} exists
    const {{resource}} = await this.prisma.{{resource}}.findUnique({
      where: { id },
      select: { id: true, deleted: true },
    });

    if (!{{resource}}) {
      throw new NotFoundException('{{resource}} not found');
    }

    if ({{resource}}.deleted) {
      throw new AlreadyDeletedException('{{resource}} was already deleted');
    }

    // Soft delete the {{resource}}
    await this.prisma.{{resource}}.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }
```

example:

```ts
async remove(id: number) {
    // Check if article exists
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { id: true, deleted: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.deleted) {
      throw new AlreadyDeletedException('Article was already deleted');
    }

    // Soft delete the article
    await this.prisma.article.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }
```

## step 2 soft delete endpoint for controller.ts

```ts
@UseGuards(JwtAccessGuard, CreatorGuard)
@ProtectedResource('{{resource}}')
@Delete(':id')
@HttpCode(204)
remove(@Param('id', ParseIntPipe) id: number) {
  return this.{{resource}}Service.remove(id);
}
```

example:

```ts
@UseGuards(JwtAccessGuard, CreatorGuard)
@ProtectedResource('article')
@Delete(':id')
@HttpCode(204)
remove(@Param('id', ParseIntPipe) id: number) {
  return this.articlesService.remove(id);
}
```

## step 3 let user deletion process know to also delete articles/{{resource}} upon account deletion

Open `modules/users/users.service.ts` and go to `softDeleteUserWithCascade` function.

> IF EITHER FILE OR FUNCTION DOES NOT EXIST, STOP: do not proceed to next steps. Alert human that there is missing file or function.

```ts
// Soft delete all user's {{resource}}s
    await this.prisma.{{resource}}.updateMany({
      where: { creatorId: userId },
      data: { deleted: true, deletedAt: now },
    });
```

example :

```ts
// Soft delete all user's articles
await this.prisma.article.updateMany({
  where: { creatorId: userId },
  data: { deleted: true, deletedAt: now },
});
```

## step 4 let user restore process know to also restore articles/{{resource}} upon account restore

Open `modules/users/users.service.ts` and go to `restoreUserWithCascade` function.

> IF EITHER FILE OR FUNCTION DOES NOT EXIST, STOP: do not proceed to next steps. Alert human that there is missing file or function.

Add a restore block alongside the existing post restore:

```ts
// Restore all user's {{resource}}s
await this.prisma.{{resource}}.updateMany({
  where: { creatorId: userId },
  data: { deleted: false, deletedAt: null },
});
```

example:

```ts
// Restore all user's articles
await this.prisma.article.updateMany({
  where: { creatorId: userId },
  data: { deleted: false, deletedAt: null },
});
```

> Step 3 (delete) and step 3b (restore) must always be kept in sync — every resource in `softDeleteUserWithCascade` must also appear in `restoreUserWithCascade`.

## step 5 admin soft delete logic for admin-{{resource}}.service.ts

```ts
async remove(adminId: number, id: number, reason?: string) {
  const {{resource}} = await this.prisma.{{resource}}.findUnique({
    where: { id: id },
    select: { title: true, creatorId: true, deleted: true },
  });

  if (!{{resource}}) {
    throw new NotFoundException('{{resource}} not found');
  }

  if ({{resource}}.deleted) {
    throw new AlreadyDeletedException('{{resource}} was already deleted');
  }

  await this.prisma.{{resource}}.update({
    where: { id: id },
    data: { deleted: true, deletedAt: new Date() },
    select: DEFAULT_{{resource}}_SELECT,
  });

  // Log the deletion
  await this.adminService.log({
    adminId,
    action: '{{resource}}_DELETED',
    resource: '{{resource}}',
    resourceId: id.toString(),
    targetId: {{resource}}.creatorId,
    description: `Admin deleted {{resource}} "${{{resource}}.title}"`,
  });
}
```

example:

```ts
async remove(adminId: number, id: number, reason?: string) {
  const article = await this.prisma.article.findUnique({
    where: { id: id },
    select: { title: true, creatorId: true, deleted: true },
  });

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  if (article.deleted) {
    throw new AlreadyDeletedException('Article was already deleted');
  }

  await this.prisma.article.update({
    where: { id: id },
    data: { deleted: true, deletedAt: new Date() },
    select: DEFAULT_ARTICLE_SELECT,
  });

  // Log the deletion
  await this.adminService.log({
    adminId,
    action: 'ARTICLE_DELETED',
    resource: 'ARTICLE',
    resourceId: id.toString(),
    targetId: article.creatorId,
    description: `Admin deleted article "${article.title}"`,
  });
}
```

## step 6 admin soft delete endpoint for admin-{{resource}}.controller.ts

```ts
@Delete(':id')
@HttpCode(204)
remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
  const adminId = req.user?.sub;
  return this.admin{{resource}}Service.remove(adminId, id);
}
```

example:

```ts
@Delete(':id')
@HttpCode(204)
remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
  const adminId = req.user?.sub;
  return this.adminArticleService.remove(adminId, id);
}
```

## step 7 admin restore logic for admin-{{resource}}.service.ts

```ts
async restore(adminId: number, id: number) {
  const {{resource}} = await this.prisma.{{resource}}.findUnique({
    where: { id: id },
  });

  if (!{{resource}}) {
    throw new NotFoundException('{{resource}} not found');
  }

  if (!{{resource}}.deleted) {
    throw new BadRequestException('{{resource}} is not deleted');
  }

  const restored = await this.prisma.{{resource}}.update({
    where: { id: id },
    data: { deleted: false, deletedAt: null },
    select: DEFAULT_{{resource}}_SELECT,
  });

  // Log the restoration
  await this.adminService.log({
    adminId,
    action: '{{resource}}_RESTORED',
    resource: '{{resource}}',
    resourceId: id.toString(),
    targetId: {{resource}}.creatorId,
    description: `Admin restored {{resource}} "${{{resource}}.title}"`,
  });

  return restored;
}
```

example:

```ts
async restore(adminId: number, id: number) {
  const article = await this.prisma.article.findUnique({
    where: { id: id },
  });

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  if (!article.deleted) {
    throw new BadRequestException('Article is not deleted');
  }

  const restored = await this.prisma.article.update({
    where: { id: id },
    data: { deleted: false, deletedAt: null },
    select: DEFAULT_ARTICLE_SELECT,
  });

  // Log the restoration
  await this.adminService.log({
    adminId,
    action: 'ARTICLE_RESTORED',
    resource: 'ARTICLE',
    resourceId: id.toString(),
    targetId: article.creatorId,
    description: `Admin restored article "${article.title}"`,
  });

  return restored;
}
```

## step 8 admin restore endpoint for admin-{{resource}}.controller.ts

```ts
@Post(':id/restore')
restore(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
  const adminId = req.user?.sub;
  return this.admin{{resource}}Service.restore(adminId, id);
}
```

example:

```ts
@Post(':id/restore')
restore(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
  const adminId = req.user?.sub;
  return this.adminArticleService.restore(adminId, id);
}
```

# part 9 | add stats for {{resource}} in admin

## step 1 add to `admin.service.ts` get stats

```ts
/**
 * Get {{resource}} statistics broken down by status and deletion rate
 */
private async get{{resource}}Stats() {
  const [base, draft, published, archived, scheduled] = await Promise.all([
    this.getBaseContentCounts(this.prisma.{{resource}}),
    this.prisma.{{resource}}.count({ where: { status: 'DRAFT', deleted: false } }),
    this.prisma.{{resource}}.count({
      where: { status: 'PUBLISHED', deleted: false },
    }),
    this.prisma.{{resource}}.count({
      where: { status: 'ARCHIVED', deleted: false },
    }),
    this.prisma.{{resource}}.count({
      where: { status: 'SCHEDULED', deleted: false },
    }),
  ]);

  return {
    ...base,
    byStatus: { draft, published, archived, scheduled },
  };
}
```

if its simple (i.e. no enum) then can just do:

```ts
private async get{{resource}}Stats() {
    return this.getBaseContentCounts(this.prisma.{{resource}});
  }
```

example:

```ts
/**
 * Get article statistics broken down by status and deletion rate
 */
private async getArticleStats() {
  const [base, draft, published, archived, scheduled] = await Promise.all([
    this.getBaseContentCounts(this.prisma.article),
    this.prisma.article.count({ where: { status: 'DRAFT', deleted: false } }),
    this.prisma.article.count({
      where: { status: 'PUBLISHED', deleted: false },
    }),
    this.prisma.article.count({
      where: { status: 'ARCHIVED', deleted: false },
    }),
    this.prisma.article.count({
      where: { status: 'SCHEDULED', deleted: false },
    }),
  ]);

  return {
    ...base,
    byStatus: { draft, published, archived, scheduled },
  };
}
```

## step 2 add to array of centralized `getStats()`

```ts
/**
 * Get all dashboard stats (system metrics + user stats + post stats)
 */
async getStats() {
  const [systemStats, userStats, postStats, {{resource}}Stats] = await Promise.all(
    [
      Promise.resolve(this.getSystemStats()),
      this.getUserStats(),
      this.getPostStats(),
      this.get{{resource}}Stats(),
    ],
  );

  return {
    system: systemStats,
    users: userStats,
    posts: postStats,
    {{resource}}: {{resource}}Stats,
    timestamp: new Date().toISOString(),
  };
}
```

example:

```ts
/**
 * Get all dashboard stats (system metrics + user stats + post stats)
 */
async getStats() {
  const [systemStats, userStats, postStats, articleStats] = await Promise.all(
    [
      Promise.resolve(this.getSystemStats()),
      this.getUserStats(),
      this.getPostStats(),
      this.getArticleStats(),
    ],
  );

  return {
    system: systemStats,
    users: userStats,
    posts: postStats,
    articles: articleStats,
    timestamp: new Date().toISOString(),
  };
}
```

# part 8 | Test CRUD endpoints/summary

## step 1 | Generate Bruno collection file

Generate a Bruno collection JSON file so the human can import it into Bruno and test all endpoints.

Save the file as `guide/{{resource}}-bru.json`.

Use `guide/article-resource-bru.json` as the format reference — the structure, field names, and variable conventions must match exactly.

**Rules:**

- Use `{{base_URL}}` for the host (never hardcode `http://localhost:3000`)
- Use `{{resourceId}}` (e.g. `{{blogId}}`) and `{{userId}}` for path variables — match Bruno variable naming from article example
- Only include requests for endpoints that were actually implemented based on the PROJECT-BRIEF
- Skip admin folder entirely if admin was not requested
- Skip cursor requests if cursor pagination was not implemented
- Skip search request if search was not implemented
- For `multipartForm` bodies: include only the fields that exist on the actual schema
- `seq` values should be sequential integers starting at 1 per folder
- Set `auth.mode` to `"inherit"` on all requests and folders

**Folder structure to generate (adapt based on what was implemented):**

```
root items:
  - folder: "admin" (skip if no admin)
      - folder: "{{resource}}" (lowercase)
          - requests: get all, get all cursor, get by id, search, update, delete, restore
  - folder: "{{resources}}" (plural lowercase)
      - requests: create, get all, get all cursor, get by user, get by user cursor,
                  get by id, search, search suggest, update, delete,
                  get user's liked (if likes implemented),
                  collections containing this (if collections implemented)
```

After generating the file, tell the human:

> "Bruno collection saved to `guide/{{resource}}-bru.json`. Import it into Bruno to test all endpoints."

---

## step 2 | Prompt human to test

Tell human to tests these endpoints and wait for human's confirmation to continue on to next parts.

**Create**
POST `http://localhost:3000/{{resource}}`
ex: POST `http://localhost:3000/articles`

```multipart/form-data
{
  "title": "First Article",
  "content": "Hello world!"
  "image": "exampleImage.png"
  "status": "DRAFT"
}
```

**Read all**
GET `http://localhost:3000/{{resource}}`
ex: GET `http://localhost:3000/articles`
cursor: `http://localhost:3000/{{resource}}/cursor`
ex:cursor: `http://localhost:3000/articles/cursor`
queries: `offset/cursor`, `limit`

**Get all user's {{resource}}**
GET `http://localhost:3000/{{resource}}/users/<userId>`
ex: GET `http://localhost:3000/articles/users/<userId>`
cursor: `http://localhost:3000/{{resource}}/users/<userId>/cursor`
ex: cursor: `http://localhost:3000/articles/users/<userId>/cursor`

**Read single**
GET `http://localhost:3000/{{resource}}/<id>`
ex: GET `http://localhost:3000/articles/<id>`

**Update**
PATCH `http://localhost:3000/{{resource}}/<id>`
ex: PATCH `http://localhost:3000/articles/<id>`

```multipart/form-data
{
  "title": "Updated title"
}
```

**Delete**
DELETE `http://localhost:3000/{{resource}}/<id>`
ex: DELETE `http://localhost:3000/articles/<id>`

## admin endpoints/summary

**Read all**
GET `http://localhost:3000/admin/{{resource}}`
ex: GET `http://localhost:3000/admin/articles`
cursor: `http://localhost:3000/admin/{{resource}}/cursor`
ex: cursor: `http://localhost:3000/admin/articles/cursor`
queries: `offset/cursor`, `limit`

**Get all user's {{resource}}**
GET `http://localhost:3000/admin/{{resource}}/users/<userId>`
ex: GET `http://localhost:3000/admin/article/users/<userId>`
cursor: `http://localhost:3000/admin/{{resource}}/users/<userId>/cursor`
ex: cursor: `http://localhost:3000/admin/articles/users/<userId>/cursor`

**Read single**
GET `http://localhost:3000/admin/{{resource}}/<id>`
ex: GET `http://localhost:3000/admin/articles/<id>`

**Update**
PATCH `http://localhost:3000/admin/{{resource}}/<id>`
ex: PATCH `http://localhost:3000/admin/articles/<id>`

```multipart/form-data
{
  "title": "Edited article",
  "content": "Admin edited this"
  "image": "exampleImage.png"
  "status": "DRAFT"
}
```

**Delete**
DELETE `http://localhost:3000/admin/{{resource}}/<id>`
ex: DELETE `http://localhost:3000/admin/articles/<id>`

**Restore**
POST `http://localhost:3000/admin/{{resource}}/<id>/restore`
ex: POST `http://localhost:3000/admin/articles/<id>/restore`

# part 9 | basic search engine

> ⚠️ SKIP THIS ENTIRE PART unless human explicitly requested search.

## step 1 search dto beginning

Add to dto folder `search-{{resource}}.dto.ts`. The code at beginning of file applies regardless if using offset or cursor pagination. Should adjust `{{resource}}SearchFields` object to match fields that you want to query in.

```ts
import { IsOptional, IsString, IsBoolean, IsIn, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { {{resource}}Status } from '../../../generated/prisma/client';

/**
 * Transform string booleans from query params to actual booleans
 * Query strings always come as strings, so "false" is truthy
 */
const TransformBoolean = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1' || value === 1;
  });

export enum {{resource}}SearchFields {
  TITLE = 'title',
  CONTENT = 'content',
  CREATOR_USERNAME = 'creator.username',
}

export enum {{resource}}Availability {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

const VALID_{{resource}}_SEARCH_FIELDS = Object.values({{resource}}SearchFields);

function {{resource}}SearchMixin<TBase extends new (...args: any[]) => {}>(
  Base: TBase,
) {
  class Mixed extends Base {
    ... // wait for step 2
  }
  return Mixed;
}

export class {{resource}}SearchDto extends {{resource}}SearchMixin(PaginationDto) {}
export class {{resource}}SearchCursorDto extends {{resource}}SearchMixin(
  CursorPaginationDto,
) {}
```

example:

```ts
import { IsOptional, IsString, IsBoolean, IsIn, IsEnum } from "class-validator";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationDto } from "src/common/pagination/dto/pagination.dto";
import { CursorPaginationDto } from "src/common/pagination/dto/cursor-pagination.dto";
import { ArticleStatus } from "../../../generated/prisma/client";

/**
 * Transform string booleans from query params to actual booleans
 * Query strings always come as strings, so "false" is truthy
 */
const TransformBoolean = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "boolean") return value;
    return value === "true" || value === "1" || value === 1;
  });

export enum ArticleSearchFields {
  TITLE = "title",
  CONTENT = "content",
  CREATOR_USERNAME = "creator.username",
}

export enum ArticleAvailability {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

const VALID_ARTICLE_SEARCH_FIELDS = Object.values(ArticleSearchFields);

function ArticleSearchMixin<TBase extends new (...args: any[]) => {}>(
  Base: TBase,
) {
  class Mixed extends Base {
    ... // wait for step 2
  }
  return Mixed;
}

export class ArticleSearchDto extends ArticleSearchMixin(PaginationDto) {}
export class ArticleSearchCursorDto extends ArticleSearchMixin(
  CursorPaginationDto,
) {}
```

## step 2 making filter options

lots of things to go over.

1. the case sensitive toggle search is something you most definitely would always have
2. the "deleted?" toggle search is something you may not have in case the prisma schema doesn't have delete fields
3. if you want to add another toggle search, say for example prisma schema has "verified" boolean then just the "deleted?" validator as template. so instead of

```ts
@IsOptional()
@TransformBoolean()
@IsBoolean()
deleted?: boolean;
```

you have

```ts
@IsOptional()
@TransformBoolean()
@IsBoolean()
verified?: boolean;
```

4. adjust sort/order accordingly based off prisma schema. you may not even have a `createdAt` or may have something new like `purchasedAt` or `viewCount`. to add this sort, go to `getOrderBy()` function and find adjust `validFields` array to something like `const validFields = ['createdAt', 'updatedAt', 'purchasedAt', 'viewCount'];`

5. for enum fields like "status", "role", "type", etc

you should ideally import the enum from prisma but there might be scenario in which you cant or human has specific reason, if thats the case then just do this

```ts
getStatuses(): string[] {
if (!this.statuses) return [];

const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED'];
return this.statuses
  .split(',')
  .map((status) => status.trim().toUpperCase())
  .filter((status) => validStatuses.includes(status as ArticleStatus));
}
```

Okay thats all for now, here is template/example :

```ts
class Mixed extends Base {
  @ApiPropertyOptional({
    description: 'Search query string',
    example: 'hello world',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description:
      'Comma-separated list of fields to search in (title, content, creator.username). Defaults to all.',
    example: 'title,content',
  })
  @IsOptional()
  @IsString()
  searchFields?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Comma-separated list of statuses to filter by (e.g., DRAFT,PUBLISHED,ARCHIVED,SCHEDULED)',
  })
  statuses?: string;

  @ApiPropertyOptional({
    description: 'Enable case-sensitive search (default: false)',
    example: false,
  })
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  caseSensitive?: boolean;

  @ApiPropertyOptional({
    description:
      'Filter by availability. ALL shows both active and deleted, ACTIVE shows only active, DELETED shows only deleted. Defaults to ALL.',
    enum: {{resource}}Availability,
    example: {{resource}}Availability.ALL,
  })
  @IsOptional()
  @IsEnum({{resource}}Availability)
  availability?: {{resource}}Availability;

  @ApiPropertyOptional({
    description:
      'Sort by field and direction (field|direction). E.g., createdAt|desc, updatedAt|asc',
    example: 'createdAt|desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  /**
   * Parse and validate searchFields into an array of valid fields
   * Invalid fields are silently ignored
   */
  getSearchFields(): string[] {
    if (!this.searchFields) {
      // Default to all fields
      return VALID_{{resource}}_SEARCH_FIELDS;
    }

    return this.searchFields
      .split(',')
      .map((field) => field.trim())
      .filter((field) => VALID_{{resource}}_SEARCH_FIELDS.includes(field as any));
  }

  /**
   * Parse and validate statuses filter into an array
   * Invalid statuses are silently ignored
   */
  getStatuses(): string[] {
    if (!this.statuses) return [];

    const validStatuses = Object.values({{resource}}Status);
    // const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED'];
    return this.statuses
      .split(',')
      .map((status) => status.trim().toUpperCase())
      .filter((status) => validStatuses.includes(status as {{resource}}Status));
  }

  /**
   * Get search options (caseSensitive flag)
   */
  getSearchOptions() {
    return {
      caseSensitive: this.caseSensitive ?? false,
    };
  }

  /**
   * Parse sort parameter into Prisma orderBy clause
   * Format: "field|direction" e.g., "createdAt|desc"
   * Defaults to createdAt|desc
   */
  getOrderBy(): Record<string, 'asc' | 'desc'> {
    if (!this.sort) {
      return { createdAt: 'desc' };
    }

    const [field, direction] = this.sort.split('|');
    const validFields = ['createdAt', 'updatedAt'];
    const validDirection = ['asc', 'desc'].includes(direction?.toLowerCase())
      ? (direction?.toLowerCase() as 'asc' | 'desc')
      : 'desc';

    if (!validFields.includes(field)) {
      return { createdAt: 'desc' };
    }

    return { [field]: validDirection };
  }
}
```

example:

```ts
class Mixed extends Base {
  @ApiPropertyOptional({
    description: "Search query string",
    example: "hello world",
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description:
      "Comma-separated list of fields to search in (title, content, creator.username). Defaults to all.",
    example: "title,content",
  })
  @IsOptional()
  @IsString()
  searchFields?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      "Comma-separated list of statuses to filter by (e.g., DRAFT,PUBLISHED,ARCHIVED,SCHEDULED)",
  })
  statuses?: string;

  @ApiPropertyOptional({
    description: "Enable case-sensitive search (default: false)",
    example: false,
  })
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  caseSensitive?: boolean;

  @ApiPropertyOptional({
    description:
      "Filter by availability. ALL shows both active and deleted, ACTIVE shows only active, DELETED shows only deleted. Defaults to ALL.",
    enum: ArticleAvailability,
    example: ArticleAvailability.ALL,
  })
  @IsOptional()
  @IsEnum(ArticleAvailability)
  availability?: ArticleAvailability;

  @ApiPropertyOptional({
    description:
      "Sort by field and direction (field|direction). E.g., createdAt|desc, updatedAt|asc",
    example: "createdAt|desc",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  /**
   * Parse and validate searchFields into an array of valid fields
   * Invalid fields are silently ignored
   */
  getSearchFields(): string[] {
    if (!this.searchFields) {
      // Default to all fields
      return VALID_ARTICLE_SEARCH_FIELDS;
    }

    return this.searchFields
      .split(",")
      .map((field) => field.trim())
      .filter((field) => VALID_ARTICLE_SEARCH_FIELDS.includes(field as any));
  }

  /**
   * Parse and validate statuses filter into an array
   * Invalid statuses are silently ignored
   */
  getStatuses(): string[] {
    if (!this.statuses) return [];

    const validStatuses = Object.values(ArticleStatus);
    // const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED'];
    return this.statuses
      .split(",")
      .map((status) => status.trim().toUpperCase())
      .filter((status) => validStatuses.includes(status as ArticleStatus));
  }

  /**
   * Get search options (caseSensitive flag)
   */
  getSearchOptions() {
    return {
      caseSensitive: this.caseSensitive ?? false,
    };
  }

  /**
   * Parse sort parameter into Prisma orderBy clause
   * Format: "field|direction" e.g., "createdAt|desc"
   * Defaults to createdAt|desc
   */
  getOrderBy(): Record<string, "asc" | "desc"> {
    if (!this.sort) {
      return { createdAt: "desc" };
    }

    const [field, direction] = this.sort.split("|");
    const validFields = ["createdAt", "updatedAt"];
    const validDirection = ["asc", "desc"].includes(direction?.toLowerCase())
      ? (direction?.toLowerCase() as "asc" | "desc")
      : "desc";

    if (!validFields.includes(field)) {
      return { createdAt: "desc" };
    }

    return { [field]: validDirection };
  }
}
```

## step 3 add search to service file (offset)

```ts
import { {{resource}}SearchDto } from './dto/search-{{resource}}.dto';

async searchAll(searchDto: {{resource}}SearchDto, currentUserId?: number) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();
    const statuses = searchDto.getStatuses();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    // Build filter conditions
    const filterConditions: any[] = [
      { deleted: false },
      { creator: { status: 'ACTIVE' } },
    ];

    if (statuses.length > 0) {
      filterConditions.push({ status: { in: statuses } });
    }

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      AND: filterConditions,
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.{{resource}},
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
        select: DEFAULT_{{resource}}_SELECT,
      },
      countQuery: { where },
    });

    // ⚠️ Remove enhanceWithLikes call if human did NOT request likes.
    // If removed, replace `enhancedItems` with `items` in the return below.
    const enhancedItems = await enhanceWithLikes(
      this.prisma,
      '{{resource}}',
      items,
      currentUserId,
    );

    return {
      items: enhancedItems,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }
```

example:

```ts
import { ArticleSearchDto } from './dto/search-article.dto';

async searchAll(searchDto: ArticleSearchDto, currentUserId?: number) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();
  const statuses = searchDto.getStatuses();

  const textSearchWhere = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  // Build filter conditions
  const filterConditions: any[] = [
    { deleted: false },
    { creator: { status: 'ACTIVE' } },
  ];

  if (statuses.length > 0) {
    filterConditions.push({ status: { in: statuses } });
  }

  // Combine text search and filters
  const where = {
    ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
    AND: filterConditions,
  };

  const { items, pageInfo, isRedirected } = await offsetPaginate({
    model: this.prisma.article,
    limit: searchDto.limit ?? 10,
    offset: searchDto.offset ?? 0,
    query: {
      where,
      orderBy,
      select: DEFAULT_ARTICLE_SELECT,
    },
    countQuery: { where },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    'ARTICLE',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

## step 4 update controller.ts to have search (offset)

Typically suppose to replace your findAll with search since empty search query gives same result as normal findAll.

Reminder that the search endpoint needs to be **before** any dynamic endpoint that does something like `:id` needs to be last

```ts
import { {{resource}}SearchDto} from './dto/search-{{resource}}.dto';

// commented out as its redundant now
// @Get()
// findAll(@Query() pag: PaginationDto) {
//   return this.{{resource}}sService.findAll(pag);
// }
@Get()
search(@Query() searchDto: {{resource}}SearchDto) {
  return this.{{resource}}Service.searchAll(searchDto);
}
```

example :

```ts
import { ArticleSearchDto } from './dto/search-article.dto';

// commented out as its redundant now
// @Get()
// findAll(@Query() pag: PaginationDto) {
//   return this.articlesService.findAll(pag);
// }
@Get()
search(@Query() searchDto: ArticleSearchDto) {
  return this.articlesService.searchAll(searchDto);
}
```

## step 5 add admin search to service file to admin-{{resource}}.service.ts (offset)

> ⚠️ SKIP THIS STEP unless human explicitly requested admin.

```ts
import { {{resource}}SearchDto, {{resource}}Availability } from '../{{resource}}/dto/search-{{resource}}.dto';

async searchAll(searchDto: {{resource}}SearchDto) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();
  const statuses = searchDto.getStatuses();

  const textSearchWhere = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  // Build filter conditions
  const filterConditions: any[] = [];

  if (statuses.length > 0) {
    filterConditions.push({ status: { in: statuses } });
  }

  if (searchDto.availability === {{resource}}Availability.ACTIVE) {
    filterConditions.push({ deleted: false });
  } else if (searchDto.availability === {{resource}}Availability.DELETED) {
    filterConditions.push({ deleted: true });
  }
  // {{resource}}Availability.ALL or undefined: no filter, show everything

  // Combine text search and filters
  const where = {
    ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
    ...(filterConditions.length > 0 && { AND: filterConditions }),
  };

  const { items, pageInfo, isRedirected } = await offsetPaginate({
    model: this.prisma.{{resource}},
    limit: searchDto.limit ?? 10,
    offset: searchDto.offset ?? 0,
    query: {
      where,
      orderBy,
      select: DEFAULT_{{resource}}_SELECT,
    },
    countQuery: { where },
  });

  return {
    items,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

example:

```ts
import { ArticleSearchDto, ArticleAvailability, } from '../articles/dto/search-article.dto';

async searchAll(searchDto: ArticleSearchDto) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();
  const statuses = searchDto.getStatuses();

  const textSearchWhere = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  // Build filter conditions
  const filterConditions: any[] = [];

  if (statuses.length > 0) {
    filterConditions.push({ status: { in: statuses } });
  }

  if (searchDto.availability === ArticleAvailability.ACTIVE) {
    filterConditions.push({ deleted: false });
  } else if (searchDto.availability === ArticleAvailability.DELETED) {
    filterConditions.push({ deleted: true });
  }
  // ArticleAvailability.ALL or undefined: no filter, show everything

  // Combine text search and filters
  const where = {
    ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
    ...(filterConditions.length > 0 && { AND: filterConditions }),
  };

  const { items, pageInfo, isRedirected } = await offsetPaginate({
    model: this.prisma.article,
    limit: searchDto.limit ?? 10,
    offset: searchDto.offset ?? 0,
    query: {
      where,
      orderBy,
      select: DEFAULT_ARTICLE_SELECT,
    },
    countQuery: { where },
  });

  return {
    items,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

## step 6 update admin-{{resource}}.controller.ts to have admin search (offset)

> ⚠️ SKIP THIS STEP unless human explicitly requested admin.

Typically suppose to replace your findAll with search since empty search query gives same result as normal findAll.

Reminder that the search endpoint needs to be **before** any dynamic endpoint that does something like `:id` needs to be last

```ts
import { {{resource}}SearchDto } from '../{{resource}}/dto/search-{{resource}}.dto';

// commented out as its redundant now
// @Get()
// findAll(@Query() pag: PaginationDto) {
//   return this.admin{{resource}}Service.findAll(pag);
// }
@Get()
search(@Query() searchDto: {{resource}}SearchDto) {
  return this.admin{{resource}}Service.searchAll(searchDto);
}
```

example :

```ts
import { ArticleSearchDto } from '../articles/dto/search-article.dto';

// commented out as its redundant now
// @Get()
// findAll(@Query() pag: PaginationDto) {
//   return this.adminArticleService.findAll(pag);
// }
@Get()
search(@Query() searchDto: ArticleSearchDto) {
  return this.adminArticleService.searchAll(searchDto);
}
```

## step 7 add search to service file (cursor)

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

```ts
import { {{resource}}SearchCursorDto } from './dto/search-{{resource}}.dto';

async searchAllCursor(
  searchDto: {{resource}}SearchCursorDto,
  currentUserId?: number,
) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();
  const statuses = searchDto.getStatuses();

  const textSearchWhere = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  // Build filter conditions
  const filterConditions: any[] = [
    { deleted: false },
    { creator: { status: 'ACTIVE' } },
  ];

  if (statuses.length > 0) {
    filterConditions.push({ status: { in: statuses } });
  }

  // Combine text search and filters
  const where = {
    ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
    AND: filterConditions,
  };

  const { cursor, limit } = searchDto;

  const { items, nextCursor } = await cursorPaginate({
    model: this.prisma.{{resource}},
    limit: limit ?? 10,
    cursor,
    query: {
      where,
      orderBy,
      select: DEFAULT_{{resource}}_SELECT,
    },
  });

  // ⚠️ Remove enhanceWithLikes call if human did NOT request likes.
  // If removed, replace `enhancedItems` with `items` in the return below.
  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    '{{resource}}',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    nextCursor,
  };
}
```

example :

```ts
import { ArticleSearchCursorDto } from './dto/search-article.dto';

async searchAllCursor(
  searchDto: ArticleSearchCursorDto,
  currentUserId?: number,
) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();
  const statuses = searchDto.getStatuses();

  const textSearchWhere = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  // Build filter conditions
  const filterConditions: any[] = [
    { deleted: false },
    { creator: { status: 'ACTIVE' } },
  ];

  if (statuses.length > 0) {
    filterConditions.push({ status: { in: statuses } });
  }

  // Combine text search and filters
  const where = {
    ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
    AND: filterConditions,
  };

  const { cursor, limit } = searchDto;

  const { items, nextCursor } = await cursorPaginate({
    model: this.prisma.article,
    limit: limit ?? 10,
    cursor,
    query: {
      where,
      orderBy,
      select: DEFAULT_ARTICLE_SELECT,
    },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    'ARTICLE',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    nextCursor,
  };
}
```

## step 8 update controller.ts to have search (cursor)

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

Typically suppose to replace your findAll with search since empty search query gives same result as normal findAll.

Reminder that the search endpoint needs to be **before** any dynamic endpoint that does something like `:id` needs to be last

```ts
import { {{resource}}SearchCursorDto} from './dto/search-{{resource}}.dto';

// commented out as its redundant now
// @Get('cursor')
// findAllCursor(@Query() pag: CursorPaginationDto) {
//   return this.{{resource}}sService.findAllCursor(pag);
// }

@Get('cursor')
searchCursor(@Query() searchDto: {{resource}}SearchCursorDto) {
  return this.{{resource}}Service.searchAllCursor(searchDto);
}
```

example :

```ts
import { ArticleSearchCursorDto } from './dto/search-article.dto';

// commented out as its redundant now
// @Get('cursor')
// findAllCursor(@Query() pag: CursorPaginationDto) {
//   return this.articlesService.findAllCursor(pag);
// }

@Get('cursor')
searchCursor(@Query() searchDto: ArticleSearchCursorDto) {
  return this.articlesService.searchAllCursor(searchDto);
}
```

## step 9 add admin search to service file to admin-{{resource}}.service.ts (cursor)

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination AND admin.

```ts
import { {{resource}}SearchCursorDto, {{resource}}Availability } from '../{{resource}}/dto/search-{{resource}}.dto';

async searchAllCursor(searchDto: {{resource}}SearchCursorDto) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();
  const statuses = searchDto.getStatuses();

  const textSearchWhere = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  // Build filter conditions
  const filterConditions: any[] = [];

  if (statuses.length > 0) {
    filterConditions.push({ status: { in: statuses } });
  }

  if (searchDto.availability === {{resource}}Availability.ACTIVE) {
    filterConditions.push({ deleted: false });
  } else if (searchDto.availability === {{resource}}Availability.DELETED) {
    filterConditions.push({ deleted: true });
  }
  // {{resource}}Availability.ALL or undefined: no filter, show everything

  // Combine text search and filters
  const where = {
    ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
    ...(filterConditions.length > 0 && { AND: filterConditions }),
  };

  const { cursor, limit } = searchDto;

  const { items, nextCursor } = await cursorPaginate({
    model: this.prisma.{{resource}},
    limit: limit ?? 10,
    cursor,
    query: {
      where,
      orderBy,
      select: DEFAULT_{{resource}}_SELECT,
    },
  });

  return {
    items,
    nextCursor,
  };
}
```

example :

```ts
import { ArticleSearchCursorDto, ArticleAvailability } from '../articles/dto/search-article.dto';

async searchAllCursor(searchDto: ArticleSearchCursorDto) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();
  const statuses = searchDto.getStatuses();

  const textSearchWhere = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  // Build filter conditions
  const filterConditions: any[] = [];

  if (statuses.length > 0) {
    filterConditions.push({ status: { in: statuses } });
  }

  if (searchDto.availability === ArticleAvailability.ACTIVE) {
    filterConditions.push({ deleted: false });
  } else if (searchDto.availability === ArticleAvailability.DELETED) {
    filterConditions.push({ deleted: true });
  }
  // ArticleAvailability.ALL or undefined: no filter, show everything

  // Combine text search and filters
  const where = {
    ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
    ...(filterConditions.length > 0 && { AND: filterConditions }),
  };

  const { cursor, limit } = searchDto;

  const { items, nextCursor } = await cursorPaginate({
    model: this.prisma.article,
    limit: limit ?? 10,
    cursor,
    query: {
      where,
      orderBy,
      select: DEFAULT_ARTICLE_SELECT,
    },
  });

  return {
    items,
    nextCursor,
  };
}
```

## step 10 update admin-{{resource}}.controller.ts to have admin search (cursor)

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination AND admin.

Typically suppose to replace your findAll with search since empty search query gives same result as normal findAll.

Reminder that the search endpoint needs to be **before** any dynamic endpoint that does something like `:id` needs to be last

```ts
import { {{resource}}SearchCursorDto } from '../{{resource}}/dto/search-{{resource}}.dto';

// commented out as its redundant now
// @Get('cursor')
// findAllCursor(@Query() pag: CursorPaginationDto) {
//   return this.admin{{resource}}Service.findAllCursor(pag);
// }
@Get('cursor')
searchCursor(@Query() searchDto: {{resource}}SearchCursorDto) {
  return this.admin{{resource}}Service.searchAllCursor(searchDto);
}
```

example:

```ts
import { ArticleSearchCursorDto } from '../articles/dto/search-article.dto';

// commented out as its redundant now
// @Get('cursor')
// findAllCursor(@Query() pag: CursorPaginationDto) {
//   return this.adminArticleService.findAllCursor(pag);
// }
@Get('cursor')
searchCursor(@Query() searchDto: ArticleSearchCursorDto) {
  return this.adminArticleService.searchAllCursor(searchDto);
}
```

## step 11 new queries for updated endpoint to for human to test

**limit** : number

- `limit=10`

**offset** : number

- `offset=1`

**cursor** : number

- `cursor=1`

**query** : string

- `query=cat`

**search fields** : string
only search in these included fields (can be single or many at once)

- `searchFields:title,content,creator.username`
- `searchFields:title`

**statuses** : string
filter based of status. enum of: "DRAFT","PUBLISHED","ARCHIVED","SCHEDULED"
to clarify, this is multi-select enum, can do search of "DRAFT,PUBLISHED" and will search for `OR`

- `statuses:DRAFT`
- `statuses:DRAFT,PUBLISHED`

**availability** : string
filter based of status. enum of: "DELETED","ACTIVE","ALL"
to clarify, this is single-select enum.

- `availability=DELETED`

**sort**: string
enum of createdAt, updatedAt

- `sort=createdAt|desc` (or `asc`)
- `sort=updatedAt|desc` (or `asc`)

"Resource actions" / CRUD extensions

## step 12 (optional) add search suggest

with search suggest, try to keep it minimal/simple.

```ts
async searchSuggest(q: string, limit: number) {
    if (!q) return [];

    return this.prisma.{{resource}}.findMany({
      where: {
        deleted: false,
        creator: { status: 'ACTIVE' },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: DEFAULT_{{RESOURCE}}_SELECT,
      take: limit,
    });
  }
```

example:

```ts
async searchSuggest(q: string, limit: number) {
    if (!q) return [];

    return this.prisma.article.findMany({
      where: {
        deleted: false,
        creator: { status: 'ACTIVE' },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: DEFAULT_ARTICLE_SELECT,
      take: limit,
    });
  }
```

## step 13 (optional) add search suggest endpoint

```ts
@Get('search/suggest')
  searchSuggest(@Query('q') q: string, @Query('limit') limit = 5) {
    return this.articlesService.searchSuggest(q, Number(limit));
  }
```

example:

```ts
@Get('search/suggest')
  searchSuggest(@Query('q') q: string, @Query('limit') limit = 5) {
    return this.{{resource}}Service.searchSuggest(q, Number(limit));
  }
```

# part 10 | adding resource actions to backend

by the time i am writing this, there is only likes, views, comments, and collection. there might be more or less when you currently read this. prompt human the available resource actions found (likes, views, comments, collections, etc), ask which ones to apply/add.

## adding likes

> ⚠️ SKIP THIS PART unless human explicitly requested likes.

> ⚠️ Before proceeding: verify the schema model has `likeCount Int @default(0)`. If it is missing, **stop** — tell the human to add it to the schema and run a migration, then wait for confirmation before continuing.

### step 1 add/check {{Resource}} in resource.types.ts

```ts
export enum ResourceTypeEnum {
  POST = 'POST',
  COMMENT = 'COMMENT',
  {{resource}} = '{{resource}}',
}

// export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';
export type ResourceType = 'POST' | 'COMMENT' | '{{resource}}';
```

example :

```ts
export enum ResourceTypeEnum {
  POST = "POST",
  COMMENT = "COMMENT",
  ARTICLE = "ARTICLE",
}

// export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';
export type ResourceType = "POST" | "COMMENT" | "ARTICLE";
```

### step 2 add {{resource}} to LIKEABLE_RESOURCES in resource.types.ts

```ts
export const LIKEABLE_RESOURCES = ["POST", "COMMENT", "{{resource}}"] as const;
```

example :

```ts
export const LIKEABLE_RESOURCES = ["POST", "COMMENT", "ARTICLE"] as const;
```

### step 3 add {{resource}} LIKEABLE_RESOURCE_CONFIG in likes.service.ts

```ts
const LIKEABLE_RESOURCE_CONFIG: Record<LikeableResourceType, ResourceConfig> = {
  POST: { model: 'post', label: 'Post' },
  COMMENT: { model: 'comment', label: 'Comment' },
  {{resource}}: { model: '{{resource}}', label: '{{resource}}' },
};
```

example :

```ts
const LIKEABLE_RESOURCE_CONFIG: Record<LikeableResourceType, ResourceConfig> = {
  POST: { model: "post", label: "Post" },
  COMMENT: { model: "comment", label: "Comment" },
  ARTICLE: { model: "article", label: "Article" },
};
```

### step 4 add to `likeCount` to shared return in {{resource}}.service.ts

```ts
const DEFAULT_{{resource}}_SELECT = {
  ...
  likeCount: true
};
```

example :

```ts
const DEFAULT_ARTICLE_SELECT = {
  ...
  likeCount: true
};
```

### step 5 add to `likeCount` to shared return in admin-{{resource}}.service.ts

> ⚠️ SKIP THIS STEP unless human explicitly requested admin.

```ts
const DEFAULT_{{resource}}_SELECT = {
  ...
  likeCount: true
};
```

example :

```ts
const DEFAULT_ARTICLE_SELECT = {
  ...
  likeCount: true
};
```

### step 6 import `enhanceWithLikes` to {{resource}}.service.ts

```ts
import { enhanceWithLikes } from "src/common/likes/enhance-with-likes";
```

### step 7 add like and its count to findById

```ts
async findById(id: number, userId: number | undefined) {
  const {{resource}} = await this.prisma.{{resource}}.findUnique({
    where: { id },
    select: DEFAULT_{{resource}}_SELECT,
  });

  if (!{{resource}} || {{resource}}.deleted) {
    throw new NotFoundException('{{resource}} not found');
  }

  const [enhanced] = await enhanceWithLikes(
    this.prisma,
    '{{resource}}',
    [{{resource}}],
    userId ?? undefined,
  );
  return enhanced;
}
```

example:

```ts
async findById(id: number, userId: number | undefined) {
  const article = await this.prisma.article.findUnique({
    where: { id },
    select: DEFAULT_ARTICLE_SELECT,
  });

  if (!article || article.deleted) {
    throw new NotFoundException('Article not found');
  }

  const [enhanced] = await enhanceWithLikes(
    this.prisma,
    'ARTICLE',
    [article],
    userId ?? undefined,
  );
  return enhanced;
}
```

### step 8 update findById endpoint to have Jwt optional guard

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get(':id')
findById(@Param('id', ParseIntPipe) id: number, @Req() req) {
  const userId = req.user?.sub ? req.user.sub : undefined;
  return this.{{resource}}sService.findById(id, userId);
}
```

example:

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get(':id')
findById(@Param('id', ParseIntPipe) id: number, @Req() req) {
  const userId = req.user?.sub ? req.user.sub : undefined;
  return this.articlesService.findById(id, userId);
}
```

### step 9 add like and its count to findAll (offset pagination)

```ts
async findAll(pag: PaginationDto, currentUserId?: number) {
  const where = { deleted: false, creator: { status: 'ACTIVE' } };
  const { items, pageInfo, isRedirected } = await offsetPaginate({
    model: this.prisma.{{resource}},
    limit: pag.limit ?? 10,
    offset: pag.offset ?? 0,
    query: {
      where,
      orderBy: { createdAt: 'desc' } as const,
      select: DEFAULT_{{resource}}_SELECT,
    },
    countQuery: { where: where },
  });

  const enhancedItems = await enhanceWithLikes(this.prisma, '{{resource}}', items, currentUserId);

  return {
    items: enhancedItems,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

example:

```ts
async findAll(pag: PaginationDto, currentUserId?: number) {
  const where = { deleted: false, creator: { status: 'ACTIVE' } };
  const { items, pageInfo, isRedirected } = await offsetPaginate({
    model: this.prisma.article,
    limit: pag.limit ?? 10,
    offset: pag.offset ?? 0,
    query: {
      where,
      orderBy: { createdAt: 'desc' } as const,
      select: DEFAULT_ARTICLE_SELECT,
    },
    countQuery: { where: where },
  });

  const enhancedItems = await enhanceWithLikes(this.prisma, 'ARTICLE', items, currentUserId);

  return {
    items: enhancedItems,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

### step 10 update findAll (offset pagination) endpoint to have Jwt optional guard

```ts
@UseGuards(JwtAccessOptionalGuard)
  @Get()
  findAll(@Query() pag: PaginationDto, @Req() req) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.{{resource}}Service.findAll(pag, userId);
  }
```

example:

```ts
@UseGuards(JwtAccessOptionalGuard)
  @Get()
  findAll(@Query() pag: PaginationDto, @Req() req) {
    const userId = req.user?.sub ? req.user.sub : undefined;
    return this.articlesService.findAll(pag, userId);
  }
```

### step 11 add like and its count to find All (cursor)

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

```ts
async findAllCursor(pag: CursorPaginationDto, currentUserId?: number) {
  const { cursor, limit } = pag;

  const { items, nextCursor } = await cursorPaginate({
    model: this.prisma.{{resource}},
    limit: limit ?? 10,
    cursor,
    query: {
      where: { deleted: false, creator: { status: 'ACTIVE' } },
      orderBy: { createdAt: 'desc' } as const,
      select: DEFAULT_{{resource}}_SELECT,
    },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    '{{resource}}',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    nextCursor,
  };
}
```

example:

```ts
async findAllCursor(pag: CursorPaginationDto, currentUserId?: number) {
  const { cursor, limit } = pag;

  const { items, nextCursor } = await cursorPaginate({
    model: this.prisma.article,
    limit: limit ?? 10,
    cursor,
    query: {
      where: { deleted: false, creator: { status: 'ACTIVE' } },
      orderBy: { createdAt: 'desc' } as const,
      select: DEFAULT_ARTICLE_SELECT,
    },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    'ARTICLE',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    nextCursor,
  };
}
```

### step 12 update findAll (cursor pagination) endpoint to have Jwt optional guard

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('cursor')
findAllCursor(@Query() pag: CursorPaginationDto, @Req() req) {
  const userId = req.user?.sub ? req.user.sub : undefined;
  return this.{{resource}}Service.findAllCursor(pag, userId);
}
```

example:

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('cursor')
findAllCursor(@Query() pag: CursorPaginationDto, @Req() req) {
  const userId = req.user?.sub ? req.user.sub : undefined;
  return this.articlesService.findAllCursor(pag, userId);
}
```

### step 13 add like and its count to findByUserId (offset pagination)

```ts
async findByUserId(
  userId: number,
  pag: PaginationDto,
  currentUserId?: number,
) {
  const where = {
    creatorId: userId,
    deleted: false,
    creator: { status: 'ACTIVE' },
  };
  const { items, pageInfo, isRedirected } = await offsetPaginate({
    model: this.prisma.{{resource}},
    limit: pag.limit ?? 10,
    offset: pag.offset ?? 0,
    query: {
      where,
      orderBy: { createdAt: 'desc' } as const,
      select: DEFAULT_{{resource}}_SELECT,
    },
    countQuery: { where },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    '{{resource}}',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

example:

```ts
async findByUserId(
  userId: number,
  pag: PaginationDto,
  currentUserId?: number,
) {
  const where = {
    creatorId: userId,
    deleted: false,
    creator: { status: 'ACTIVE' },
  };
  const { items, pageInfo, isRedirected } = await offsetPaginate({
    model: this.prisma.article,
    limit: pag.limit ?? 10,
    offset: pag.offset ?? 0,
    query: {
      where,
      orderBy: { createdAt: 'desc' } as const,
      select: DEFAULT_ARTICLE_SELECT,
    },
    countQuery: { where },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    'ARTICLE',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

### step 14 update findByUserId (offset pagination) endpoint to have Jwt optional guard

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('users/:userId')
findByUserId(
  @Param('userId', ParseIntPipe) userId: number,
  @Query() pag: PaginationDto,
  @Req() req,
) {
  const currentUserId = req.user?.sub;
  return this.{{resource}}Service.findByUserId(userId, pag, currentUserId);
}
```

example:

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('users/:userId')
findByUserId(
  @Param('userId', ParseIntPipe) userId: number,
  @Query() pag: PaginationDto,
  @Req() req,
) {
  const currentUserId = req.user?.sub;
  return this.articlesService.findByUserId(userId, pag, currentUserId);
}
```

### step 15 add like and its count to findByUserId (cursor pagination)

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

```ts
async findByUserIdCursor(
  userId: number,
  pag: CursorPaginationDto,
  currentUserId?: number,
) {
  const { cursor, limit } = pag;

  const { items, nextCursor } = await cursorPaginate({
    model: this.prisma.{{resource}},
    limit: limit ?? 10,
    cursor,
    query: {
      where: {
        creatorId: userId,
        deleted: false,
        creator: { status: 'ACTIVE' },
      },
      orderBy: { createdAt: 'desc' } as const,
      select: DEFAULT_{{resource}}_SELECT,
    },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    '{{resource}}',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    nextCursor,
  };
}
```

example:

```ts
async findByUserIdCursor(
  userId: number,
  pag: CursorPaginationDto,
  currentUserId?: number,
) {
  const { cursor, limit } = pag;

  const { items, nextCursor } = await cursorPaginate({
    model: this.prisma.article,
    limit: limit ?? 10,
    cursor,
    query: {
      where: {
        creatorId: userId,
        deleted: false,
        creator: { status: 'ACTIVE' },
      },
      orderBy: { createdAt: 'desc' } as const,
      select: DEFAULT_ARTICLE_SELECT,
    },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    'ARTICLE',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    nextCursor,
  };
}
```

### step 16 update findByUserId (cursor pagination) endpoint to have Jwt optional guard

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('users/:userId/cursor')
findByUserIdCursor(
  @Param('userId', ParseIntPipe) userId: number,
  @Query() pag: CursorPaginationDto,
  @Req() req,
) {
  const currentUserId = req.user?.sub;
  return this.{{resource}}Service.findByUserIdCursor(userId, pag, currentUserId);
}
```

example:

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('users/:userId/cursor')
findByUserIdCursor(
  @Param('userId', ParseIntPipe) userId: number,
  @Query() pag: CursorPaginationDto,
  @Req() req,
) {
  const currentUserId = req.user?.sub;
  return this.articlesService.findByUserIdCursor(userId, pag, currentUserId);
}
```

### step 17 add like and its count to searchAll (offset pagination)

```ts
async searchAll(searchDto: {{resource}}SearchDto, currentUserId?: number) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();

  const where = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  const whereWithStatus = {
    ...where,
    deleted: false,
    creator: { status: 'ACTIVE' },
  };
  const { items, pageInfo, isRedirected } = await offsetPaginate({
    model: this.prisma.{{resource}},
    limit: searchDto.limit ?? 10,
    offset: searchDto.offset ?? 0,
    query: {
      where: whereWithStatus,
      orderBy,
      select: DEFAULT_{{resource}}_SELECT,
    },
    countQuery: { where: whereWithStatus },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    '{{resource}}',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

example:

```ts
async searchAll(searchDto: ArticleSearchDto, currentUserId?: number) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();

  const where = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  const whereWithStatus = {
    ...where,
    deleted: false,
    creator: { status: 'ACTIVE' },
  };
  const { items, pageInfo, isRedirected } = await offsetPaginate({
    model: this.prisma.article,
    limit: searchDto.limit ?? 10,
    offset: searchDto.offset ?? 0,
    query: {
      where: whereWithStatus,
      orderBy,
      select: DEFAULT_ARTICLE_SELECT,
    },
    countQuery: { where: whereWithStatus },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    'ARTICLE',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

### step 18 update searchAll (offset pagination) endpoint to have Jwt optional guard

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get()
search(@Query() searchDto: {{resource}}SearchDto, @Req() req) {
  const currentUserId = req.user?.sub;
  return this.{{resource}}Service.searchAll(searchDto, currentUserId);
}
```

example:

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get()
search(@Query() searchDto: ArticleSearchDto, @Req() req) {
  const currentUserId = req.user?.sub;
  return this.articlesService.searchAll(searchDto, currentUserId);
}
```

### step 19 add like and its count to searchAll (cursor pagination)

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

```ts
async searchAllCursor(
  searchDto: {{resource}}SearchCursorDto,
  currentUserId?: number,
) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();

  const where = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  const { cursor, limit } = searchDto;

  const { items, nextCursor } = await cursorPaginate({
    model: this.prisma.{{resource}},
    limit: limit ?? 10,
    cursor,
    query: {
      where: { ...where, deleted: false, creator: { status: 'ACTIVE' } },
      orderBy,
      select: DEFAULT_{{resource}}_SELECT,
    },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    '{{resource}}',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    nextCursor,
  };
}
```

example:

```ts
async searchAllCursor(
  searchDto: ArticleSearchCursorDto,
  currentUserId?: number,
) {
  const searchFields = searchDto.getSearchFields();
  const searchOptions = searchDto.getSearchOptions();
  const orderBy = searchDto.getOrderBy();

  const where = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchFields,
    options: searchOptions,
  });

  const { cursor, limit } = searchDto;

  const { items, nextCursor } = await cursorPaginate({
    model: this.prisma.article,
    limit: limit ?? 10,
    cursor,
    query: {
      where: { ...where, deleted: false, creator: { status: 'ACTIVE' } },
      orderBy,
      select: DEFAULT_ARTICLE_SELECT,
    },
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    'ARTICLE',
    items,
    currentUserId,
  );

  return {
    items: enhancedItems,
    nextCursor,
  };
}
```

### step 20 update searchAll (cursor pagination) endpoint to have Jwt optional guard

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('cursor')
searchCursor(@Query() searchDto: {{resource}}SearchCursorDto, @Req() req) {
  const currentUserId = req.user?.sub;
  return this.{{resource}}Service.searchAllCursor(searchDto, currentUserId);
}
```

example:

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('cursor')
searchCursor(@Query() searchDto: ArticleSearchCursorDto, @Req() req) {
  const currentUserId = req.user?.sub;
  return this.articlesService.searchAllCursor(searchDto, currentUserId);
}
```

### step 21 new function findLikedByUser to get all of user's liked {{resource}} (offset pagination)

```ts
async findLikedByUser(
  userId: number,
  pag: PaginationDto,
  currentUserId?: number,
) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  const totalCount = await this.prisma.like.count({
    where: { userId, resourceType: '{{resource}}' },
  });

  const likes = await this.prisma.like.findMany({
    where: { userId, resourceType: '{{resource}}' },
    orderBy: { createdAt: 'desc' },
    skip: pag.offset ?? 0,
    take: pag.limit ?? 10,
    select: { resourceId: true },
  });

  const {{resource}}Ids = likes.map((like) => like.resourceId);

  if ({{resource}}Ids.length === 0) {
    return {
      items: [],
      pageInfo: {
        total: 0,
        limit: pag.limit ?? 10,
        offset: pag.offset ?? 0,
        hasMore: false,
      },
    };
  }

  const {{resource}} = await this.prisma.{{resource}}.findMany({
    where: { id: { in: {{resource}}Ids }, deleted: false },
    select: DEFAULT_{{resource}}_SELECT,
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    '{{resource}}',
    {{resource}},
    currentUserId,
  );

  const limit = pag.limit ?? 10;
  const offset = pag.offset ?? 0;

  return {
    items: enhancedItems,
    pageInfo: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
    },
  };
}
```

example:

```ts
async findLikedByUser(
  userId: number,
  pag: PaginationDto,
  currentUserId?: number,
) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  const totalCount = await this.prisma.like.count({
    where: { userId, resourceType: 'ARTICLE' },
  });

  const likes = await this.prisma.like.findMany({
    where: { userId, resourceType: 'ARTICLE' },
    orderBy: { createdAt: 'desc' },
    skip: pag.offset ?? 0,
    take: pag.limit ?? 10,
    select: { resourceId: true },
  });

  const articleIds = likes.map((like) => like.resourceId);

  if (articleIds.length === 0) {
    return {
      items: [],
      pageInfo: {
        total: 0,
        limit: pag.limit ?? 10,
        offset: pag.offset ?? 0,
        hasMore: false,
      },
    };
  }

  const articles = await this.prisma.article.findMany({
    where: { id: { in: articleIds }, deleted: false },
    select: DEFAULT_ARTICLE_SELECT,
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    'ARTICLE',
    articles,
    currentUserId,
  );

  const limit = pag.limit ?? 10;
  const offset = pag.offset ?? 0;

  return {
    items: enhancedItems,
    pageInfo: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
    },
  };
}
```

### step 22 endpoint for findLikedByUser (offset pagination)

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('users/:userId/liked')
findLikedByUser(
  @Param('userId', ParseIntPipe) userId: number,
  @Query() pag: PaginationDto,
  @Req() req,
) {
  const currentUserId = req.user?.sub;
  return this.{{resource}}Service.findLikedByUser(userId, pag, currentUserId);
}
```

example:

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('users/:userId/liked')
findLikedByUser(
  @Param('userId', ParseIntPipe) userId: number,
  @Query() pag: PaginationDto,
  @Req() req,
) {
  const currentUserId = req.user?.sub;
  return this.articlesService.findLikedByUser(userId, pag, currentUserId);
}
```

### step 23 new function findLikedByUser to get all of user's liked {{resource}} (cursor pagination)

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

```ts
async findLikedByUserCursor(
  userId: number,
  pag: CursorPaginationDto,
  currentUserId?: number,
) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  const { cursor, limit } = pag;

  const likes = await this.prisma.like.findMany({
    where: { userId, resourceType: '{{resource}}' },
    orderBy: { createdAt: 'desc' },
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: (limit ?? 10) + 1,
    select: { id: true, resourceId: true },
  });

  const hasMore = likes.length > (limit ?? 10);
  const items = hasMore ? likes.slice(0, -1) : likes;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  const {{resource}}Ids = items.map((like) => like.resourceId);

  if ({{resource}}Ids.length === 0) {
    return { items: [], nextCursor: null };
  }

  const {{resource}} = await this.prisma.{{resource}}.findMany({
    where: { id: { in: {{resource}}Ids }, deleted: false },
    select: DEFAULT_{{resource}}_SELECT,
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    '{{resource}}',
    {{resource}},
    currentUserId,
  );

  return { items: enhancedItems, nextCursor };
}
```

example:

```ts
async findLikedByUserCursor(
  userId: number,
  pag: CursorPaginationDto,
  currentUserId?: number,
) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  const { cursor, limit } = pag;

  const likes = await this.prisma.like.findMany({
    where: { userId, resourceType: 'ARTICLE' },
    orderBy: { createdAt: 'desc' },
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: (limit ?? 10) + 1,
    select: { id: true, resourceId: true },
  });

  const hasMore = likes.length > (limit ?? 10);
  const items = hasMore ? likes.slice(0, -1) : likes;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  const articleIds = items.map((like) => like.resourceId);

  if (articleIds.length === 0) {
    return { items: [], nextCursor: null };
  }

  const articles = await this.prisma.article.findMany({
    where: { id: { in: articleIds }, deleted: false },
    select: DEFAULT_ARTICLE_SELECT,
  });

  const enhancedItems = await enhanceWithLikes(
    this.prisma,
    'ARTICLE',
    articles,
    currentUserId,
  );

  return { items: enhancedItems, nextCursor };
}
```

### step 24 endpoint for findLikedByUser (cursor pagination)

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('users/:userId/liked/cursor')
findLikedByUserCursor(
  @Param('userId', ParseIntPipe) userId: number,
  @Query() pag: CursorPaginationDto,
  @Req() req,
) {
  const currentUserId = req.user?.sub;
  return this.{{resource}}Service.findLikedByUserCursor(
    userId,
    pag,
    currentUserId,
  );
}
```

example:

```ts
@UseGuards(JwtAccessOptionalGuard)
@Get('users/:userId/liked/cursor')
findLikedByUserCursor(
  @Param('userId', ParseIntPipe) userId: number,
  @Query() pag: CursorPaginationDto,
  @Req() req,
) {
  const currentUserId = req.user?.sub;
  return this.articlesService.findLikedByUserCursor(
    userId,
    pag,
    currentUserId,
  );
}
```

### step 25 Test like endpoints/summary

Tell human to tests these endpoints and wait for human's confirmation to continue on to next parts.

**toggle like**
POST `http://localhost:3000/likes/toggle`

```json
{
  "resourceType": "ARTICLE",
  "resourceId": "1"
}
```

Response:

```json
{
  "liked": true,
  "likeCount": 1
}
```

**get users liked {{resource}} (offset)**
GET `http://localhost:3000/{{resource}}/users/{{userId}}/liked`
ex: GET `http://localhost:3000/articles/users/{{userId}}/liked`

**get users liked {{resource}} (cursor)**
GET `http://localhost:3000/{{resource}}/users/{{userId}}/liked/cursor`
ex: GET `http://localhost:3000/articles/users/{{userId}}/liked/cursor`

**check views is present when getting article by ID, findall, search, etc**
GET `http://localhost:3000/{{resource}}/{{articleId}}`
ex: GET `http://localhost:3000/articles/{{articleId}}`

## adding views

> ⚠️ SKIP THIS PART unless human explicitly requested view count.

> ⚠️ Before proceeding: verify the schema model has `viewCount Int @default(0)`. If it is missing, **stop** — tell the human to add it to the schema and run a migration, then wait for confirmation before continuing.

### step 1 add/check {{Resource}} in resource.types.ts

```ts
export enum ResourceTypeEnum {
  POST = 'POST',
  COMMENT = 'COMMENT',
  {{resource}} = '{{resource}}',
}

// export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';
export type ResourceType = 'POST' | 'COMMENT' | '{{resource}}';
```

example :

```ts
export enum ResourceTypeEnum {
  POST = "POST",
  COMMENT = "COMMENT",
  ARTICLE = "ARTICLE",
}

// export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';
export type ResourceType = "POST" | "COMMENT" | "ARTICLE";
```

### step 2 add {{resource}} to VIEWABLE_RESOURCES in resource.types.ts

```ts
export const VIEWABLE_RESOURCES = ["POST", "{{resource}}"] as const;
```

example :

```ts
export const VIEWABLE_RESOURCES = ["POST", "ARTICLE"] as const;
```

### step 3 add {{resource}} VIEWABLE_RESOURCE_CONFIG in view-handler.service.ts

```ts
const VIEWABLE_RESOURCE_CONFIG: Record<
  ViewableResourceType,
  ViewableResourceConfig
> = {
  POST: { model: 'post', label: 'Post' },
  {{resource}}: { model: '{{resource}}', label: '{{resource}}' },
};
```

example :

```ts
const VIEWABLE_RESOURCE_CONFIG: Record<
  ViewableResourceType,
  ViewableResourceConfig
> = {
  POST: { model: "post", label: "Post" },
  ARTICLE: { model: "article", label: "Article" },
};
```

### step 4 add to `viewCount` to shared return in {{resource}}.service.ts

```ts
const DEFAULT_{{resource}}_SELECT = {
  ...
  viewCount: true
};
```

example :

```ts
const DEFAULT_ARTICLE_SELECT = {
  ...
  viewCount: true
};
```

### step 5 add to `viewCount` to shared return in admin-{{resource}}.service.ts

> ⚠️ SKIP THIS STEP unless human explicitly requested admin.

```ts
const DEFAULT_{{resource}}_SELECT = {
  ...
  viewCount: true
};
```

example :

```ts
const DEFAULT_ARTICLE_SELECT = {
  ...
  viewCount: true
};
```

### step 6 Test view endpoint for {{resource}}

Tell human to tests these endpoints and wait for human's confirmation to continue on to next parts.

**record view**
POST `http://localhost:3000/views`

```json
{
  "resourceType": "{{resource}}",
  "resourceId": "1"
}
```

example:

```json
{
  "resourceType": "ARTICLE",
  "resourceId": "1"
}
```

**get view stats**
GET `http://localhost:3000/views/{{resource}}/{{resourceId}}`
ex: GET `http://localhost:3000/views/ARTICLES/{{articleId}}`

**check views is present when getting article by ID, findall, search, etc**
GET `http://localhost:3000/{{resource}}/{{resourceId}}`
ex: GET `http://localhost:3000/articles/{{articleId}}`

## adding comments

> ⚠️ SKIP THIS PART unless human explicitly requested comments.

### step 1 add/check {{Resource}} in resource.types.ts

```ts
export enum ResourceTypeEnum {
  POST = 'POST',
  COMMENT = 'COMMENT',
  {{resource}} = '{{resource}}',
}

// export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';
export type ResourceType = 'POST' | 'COMMENT' | '{{resource}}';
```

example :

```ts
export enum ResourceTypeEnum {
  POST = "POST",
  COMMENT = "COMMENT",
  ARTICLE = "ARTICLE",
}

// export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';
export type ResourceType = "POST" | "COMMENT" | "ARTICLE";
```

### step 2 add {{resource}} to COMMENTABLE_RESOURCES in resource.types.ts

```ts
export const COMMENTABLE_RESOURCES = [
  "POST",
  "COMMENT",
  "{{resource}}",
] as const;
```

example :

```ts
export const COMMENTABLE_RESOURCES = ["POST", "COMMENT", "ARTICLE"] as const;
```

### step 3 add {{resource}} COMMENTABLE_RESOURCE_CONFIG in comments.service.ts

```ts
const COMMENTABLE_RESOURCE_CONFIG: Record<
  CommentableResourceType,
  CommentableResourceConfig
> = {
  POST: { model: 'post', label: 'Post' },
  COMMENT: { model: 'comment', label: 'Comment' },
  {{resource}}: { model: '{{resource}}', label: '{{resource}}' },
};
```

example :

```ts
const COMMENTABLE_RESOURCE_CONFIG: Record<
  CommentableResourceType,
  CommentableResourceConfig
> = {
  POST: { model: "post", label: "Post" },
  COMMENT: { model: "comment", label: "Comment" },
  ARTICLE: { model: "article", label: "Article" },
};
```

### step 4 Test comment endpoint for {{resource}}

Tell human to tests these endpoints and wait for human's confirmation to continue on to next parts.

**create comment**
POST `http://localhost:3000/comments`

```json
{
  "resourceType": "{{resource}}",
  "resourceId": 1,
  "content": "New comment"
}
```

example:

```json
{
  "resourceType": "ARTICLE",
  "resourceId": 1,
  "content": "New comment"
}
```

**get comment on {{resource}}**
GET `http://localhost:3000/comments/resource/{{resource}}/{{resourceId}}`
ex: GET `http://localhost:3000/comments/resource/ARTICLE/{{articleId}}`

## adding collection

> ⚠️ SKIP THIS PART unless human explicitly requested collections.

### step 1 add/check {{Resource}} in resource.types.ts

```ts
export enum ResourceTypeEnum {
  POST = 'POST',
  COMMENT = 'COMMENT',
  {{resource}} = '{{resource}}',
}

// export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';
export type ResourceType = 'POST' | 'COMMENT' | '{{resource}}';
```

example :

```ts
export enum ResourceTypeEnum {
  POST = "POST",
  COMMENT = "COMMENT",
  ARTICLE = "ARTICLE",
}

// export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';
export type ResourceType = "POST" | "COMMENT" | "ARTICLE";
```

### step 2 add {{resource}} to COLLECTABLE_RESOURCES in resource.types.ts

```ts
export const COLLECTABLE_RESOURCES = ["POST", "{{resource}}"] as const;
```

example :

```ts
export const COLLECTABLE_RESOURCES = ["POST", "ARTICLE"] as const;
```

### step 3 add {{resource}} COLLECTABLE_RESOURCE_CONFIG in collections.service.ts

```ts
const COLLECTABLE_RESOURCE_CONFIG: Record<
  CollectableResourceType,
  CollectableResourceConfig
> = {
  POST: { model: 'post', label: 'Post' },
  {{resource}}: { model: '{{resource}}', label: '{{resource}}' },
};
```

example :

```ts
const COLLECTABLE_RESOURCE_CONFIG: Record<
  CollectableResourceType,
  CollectableResourceConfig
> = {
  POST: { model: "post", label: "Post" },
  ARTICLE: { model: "article", label: "Article" },
};
```

### step 4 add logic getting collections for {{resource}} to service

```ts
async getCollectionsFor{{resource}}(id: number, userId: number) {
  const collections = await this.prisma.collectionItem.findMany({
    where: {
      resourceType: '{{resource}}',
      resourceId: id,
      deleted: false,
      collection: {
        deleted: false,
      },
    },
    select: {
      collection: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return collections.map((item) => item.collection);
}
```

example:

```ts
async getCollectionsForArticle(id: number, userId: number) {
  const collections = await this.prisma.collectionItem.findMany({
    where: {
      resourceType: 'ARTICLE',
      resourceId: id,
      deleted: false,
      collection: {
        deleted: false,
      },
    },
    select: {
      collection: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return collections.map((item) => item.collection);
}
```

### step 5 add logic getting collections for {{resource}} to service

```ts
@UseGuards(JwtAccessGuard)
@Get(':id/collections')
get{{resource}}Collections(@Param('id', ParseIntPipe) id: number, @Req() req) {
  const userId = req.user.sub;
  return this.{{resource}}Service.getCollectionsFor{{resource}}(id, userId);
}
```

example:

```ts
@UseGuards(JwtAccessGuard)
@Get(':id/collections')
getArticleCollections(@Param('id', ParseIntPipe) id: number, @Req() req) {
  const userId = req.user.sub;
  return this.articlesService.getCollectionsForArticle(id, userId);
}
```

### step 6 Test collection endpoint for {{resource}}

Tell human to tests these endpoints and wait for human's confirmation to continue on to next parts.

first make collection if you haven't already
**add to collection**

POST `http://localhost:3000/collections/{{collectionId}}/items`

```json
{
  "resourceType": "{{resource}}",
  "resourceId": 1
}
```

example:

```json
{
  "resourceType": "ARTICLE",
  "resourceId": 1
}
```

**get collection by ID**
check its in collection
GET `http://localhost:3000/collections/{{collectionId}}`

**collections containing this article**
GET `http://localhost:3000/articles/{{articleId}}/collections`

# part 11 | add swagger docs to DTO and controller.ts

I won't add examples as you should know how to add swagger docs.
Just go to the .dto files and controller.ts file and add swagger docs inferencing based off current code.

# part 12 | adding basic frontend files

## step 1 make folders

in `apps/web/src` make these folders if not already

`web/src/features/articles/`
`web/src/components/pages/article/`
`web/src/app/(default)/article/`
if admin
`web/src/features/admin/articles/`
`web/src/components/pages/admin/articles/`
`web/src/app/(admin)/admin/articles/`

- examples

# part 13 | frontend api

## step 1 make `web/src/features/{{resource}}/types/{{resource}}.ts`

from part 2, step 2 of making shared return, use that to help inference on how to make interface type
_here is reminder of shared return from backend_

```ts
const DEFAULT_{{resource}}_SELECT = {
  id: true,
  title: true,
  content: true,
  imagePath: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};
```

with reminder in mind here is how to make `types/{{resource}}.ts`

`web/src/features/{{resource}}/types/{{resource}}.ts`

```ts
import { PaginatedResponse } from "@/types/pagination";

export const ARTICLE_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "SCHEDULED",
] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

interface Creator {
  id: number;
  username: string;
  avatarPath: string;
}
export interface Article {
  id: number;
  title: string;
  content: string;
  imagePath?: string | null;
  creator: Creator;
  createdAt: string;
  updatedAt: string;
  status: ArticleStatus;
}

export type ArticlesList = PaginatedResponse<Article>;

export interface ArticleListCursor {
  items: Article[];
  nextCursor: string;
}

export interface CreateArticleInput {
  title: string;
  content: string;
  status: ArticleStatus;
}

export interface UpdateArticleInput {
  title?: string;
  content?: string;
  status?: ArticleStatus;
}
```

example:
`web/src/features/articles/types/article.ts`

```ts
import { PaginatedResponse } from "@/types/pagination";

export const {{resource}}_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "SCHEDULED",
] as const;
export type {{resource}}Status = (typeof {{resource}}_STATUSES)[number];

interface Creator {
  id: number;
  username: string;
  avatarPath: string;
}
export interface {{resource}} {
  id: number;
  title: string;
  content: string;
  imagePath?: string | null;
  creator: Creator;
  createdAt: string;
  updatedAt: string;
  status: {{resource}}Status;
}

export type {{resource}}sList = PaginatedResponse<{{resource}}>;

export interface {{resource}}ListCursor {
  items: {{resource}}[];
  nextCursor: string;
}

export interface Create{{resource}}Input {
  title: string;
  content: string;
  status: {{resource}}Status;
}

export interface Update{{resource}}Input {
  title?: string;
  content?: string;
  status?: {{resource}}Status;
}
```

## step 2 make admin `features/admin/{{resource}}/types/{{resource}}.ts`

`web/src/features/admin/{{resource}}/types/{{resource}}.ts`

```ts
import { PaginatedResponse } from "@/types/pagination";

export const ARTICLE_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "SCHEDULED",
] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

interface Creator {
  id: number;
  username: string;
  avatarPath: string;
}
export interface Article {
  id: number;
  title: string;
  content: string;
  imagePath?: string | null;
  creator: Creator;
  createdAt: string;
  updatedAt: string;
  status: ArticleStatus;
  deleted: boolean;
  deletedAt: string;
}

export type ArticlesList = PaginatedResponse<Article>;

export interface ArticleListCursor {
  items: Article[];
  nextCursor: string;
}

export interface UpdateArticleInput {
  title?: string;
  content?: string;
  status?: ArticleStatus;
}
```

example:
`web/src/features/admin/articles/types/article.ts`

```ts
import { PaginatedResponse } from "@/types/pagination";

export const {{resource}}_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "SCHEDULED",
] as const;
export type {{resource}}Status = (typeof {{resource}}_STATUSES)[number];

interface Creator {
  id: number;
  username: string;
  avatarPath: string;
}
export interface {{resource}} {
  id: number;
  title: string;
  content: string;
  imagePath?: string | null;
  creator: Creator;
  createdAt: string;
  updatedAt: string;
  status: {{resource}}Status;
  deleted: boolean;
  deletedAt: string;
}

export type {{resource}}sList = PaginatedResponse<{{resource}}>;

export interface {{resource}}ListCursor {
  items: {{resource}}[];
  nextCursor: string;
}

export interface Update{{resource}}Input {
  title?: string;
  content?: string;
  status?: {{resource}}Status;
}
```

## step 3 converting endpoints to `features/{{resource}}/api.ts`

> ⚠️ Omit offset functions (`fetch{{resource}}sOffset`, `fetch{{resource}}sByUserId`) if human did NOT request offset pagination. Omit cursor functions (`fetch{{resource}}sCursor`, `fetch{{resource}}sByUserIdCursor`) if human did NOT request cursor pagination.

`web/src/features/{{resource}}/api.ts`

```ts
import { fetcher } from "@/lib/fetcher";
import type {
  {{resource}},
  {{resource}}sList,
  {{resource}}ListCursor,
  Create{{resource}}Input,
  Update{{resource}}Input,
} from "./types/{{resource}}";

// GET /{{resource}}s?limit=10&offset=123
export const fetch{{resource}}sOffset = ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) =>
  fetcher<{{resource}}sList>("/{{resource}}", {
    searchParams: { limit, offset },
  });

// GET /{{resource}}s/cursor
export const fetch{{resource}}sCursor = ({
  limit,
  cursor,
}: {
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<{{resource}}ListCursor>("/{{resource}}/cursor", {
    searchParams: { limit, cursor: cursor ?? undefined },
  });

// GET /{{resource}}s/:id
export const fetch{{resource}}ById = (id: number) =>
  fetcher<{{resource}}>(`/{{resource}}/${id}`);

// GET /{{resource}}s/users/:userId?limit=10&offset=0
export const fetch{{resource}}sByUserId = ({
  userId,
  limit,
  offset,
}: {
  userId: number;
  limit: number;
  offset: number;
}) =>
  fetcher<{{resource}}sList>(`/{{resource}}/users/${userId}`, {
    searchParams: { limit, offset },
  });

// GET /{{resource}}s/users/:userId/cursor?limit=10&cursor=abc123
export const fetch{{resource}}sByUserIdCursor = ({
  userId,
  limit,
  cursor,
}: {
  userId: number;
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<{{resource}}ListCursor>(`/{{resource}}/users/${userId}/cursor`, {
    searchParams: { limit, cursor: cursor ?? undefined },
  });

// POST /{{resource}}s
export const create{{resource}} = (data: Create{{resource}}Input) =>
  fetcher<{{resource}}>("/{{resource}}", {
    method: "POST",
    json: data,
  });

// PATCH /{{resource}}s/:id
export const update{{resource}} = (id: number, data: Update{{resource}}Input) =>
  fetcher<{{resource}}>(`/{{resource}}/${id}`, {
    method: "PATCH",
    json: data,
  });

// DELETE /{{resource}}s/:id
export const delete{{resource}} = (id: number) =>
  fetcher<void>(`/{{resource}}/${id}`, {
    method: "DELETE",
  });
```

example:
`web/src/features/articles/api.ts`

```ts
import { fetcher } from "@/lib/fetcher";
import type {
  Article,
  ArticlesList,
  ArticleListCursor,
  CreateArticleInput,
  UpdateArticleInput,
} from "./types/article";

// GET /articles?limit=10&offset=123
export const fetchArticlesOffset = ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) =>
  fetcher<ArticlesList>("/articles", {
    searchParams: { limit, offset },
  });

// GET /articles/cursor
export const fetchArticlesCursor = ({
  limit,
  cursor,
}: {
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<ArticleListCursor>("/articles/cursor", {
    searchParams: { limit, cursor: cursor ?? undefined },
  });

// GET /articles/:id
export const fetchArticleById = (id: number) =>
  fetcher<Article>(`/articles/${id}`);

// GET /articles/users/:userId?limit=10&offset=0
export const fetchArticlesByUserId = ({
  userId,
  limit,
  offset,
}: {
  userId: number;
  limit: number;
  offset: number;
}) =>
  fetcher<ArticlesList>(`/articles/users/${userId}`, {
    searchParams: { limit, offset },
  });

// GET /articles/users/:userId/cursor?limit=10&cursor=abc123
export const fetchArticlesByUserIdCursor = ({
  userId,
  limit,
  cursor,
}: {
  userId: number;
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<ArticleListCursor>(`/articles/users/${userId}/cursor`, {
    searchParams: { limit, cursor: cursor ?? undefined },
  });

// POST /articles
export const createArticle = (data: CreateArticleInput) =>
  fetcher<Article>("/articles", {
    method: "POST",
    json: data,
  });

// PATCH /articles/:id
export const updateArticle = (id: number, data: UpdateArticleInput) =>
  fetcher<Article>(`/articles/${id}`, {
    method: "PATCH",
    json: data,
  });

// DELETE /articles/:id
export const deleteArticle = (id: number) =>
  fetcher<void>(`/articles/${id}`, {
    method: "DELETE",
  });
```

## step 4 if needing file upload

replace create and update

```ts
import { toFormData } from "@/lib/utils/form-data";
...
// POST /{{resource}}
export const create{{resource}} = (data: Create{{resource}}Input, file?: File) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    return fetcher<{{resource}}>("/{{resource}}", {
      method: "POST",
      body: toFormData(data, file),
    });
  }

  return fetcher<{{resource}}>("/{{resource}}", {
    method: "POST",
    json: data,
  });
};

// PATCH /{{resource}}/:id
export const update{{resource}} = (
  id: number,
  data: Update{{resource}}Input,
  file?: File,
) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    return fetcher<{{resource}}>(`/{{resource}}/${id}`, {
      method: "PATCH",
      body: toFormData(data, file),
    });
  }

  return fetcher<{{resource}}>(`/{{resource}}/${id}`, {
    method: "PATCH",
    json: data,
  });
};
```

example:

```ts
import { toFormData } from "@/lib/utils/form-data";
...
// POST /articles
export const createArticle = (data: CreateArticleInput, file?: File) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    return fetcher<Article>("/articles", {
      method: "POST",
      body: toFormData(data, file),
    });
  }

  return fetcher<Article>("/articles", {
    method: "POST",
    json: data,
  });
};

// PATCH /articles/:id
export const updateArticle = (
  id: number,
  data: UpdateArticleInput,
  file?: File,
) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    return fetcher<Article>(`/articles/${id}`, {
      method: "PATCH",
      body: toFormData(data, file),
    });
  }

  return fetcher<Article>(`/articles/${id}`, {
    method: "PATCH",
    json: data,
  });
};
```

## step 5 converting endpoints to `features/admin/articles/api.ts`

`web/src/features/admin/{{resource}}/api.ts`

```ts
import { fetcher } from "@/lib/fetcher";
import type {
  {{resource}},
  {{resource}}List,
  Update{{resource}}Input,
} from "./types/{{resource}}";

// GET /admin/{{resource}}?limit=10&offset=123
export const fetchAdmin{{resource}}Offset = ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) =>
  fetcher<{{resource}}List>("/admin/{{resource}}", {
    searchParams: { limit, offset },
  });

// GET /admin/{{resource}}/:id
export const fetchAdmin{{resource}}ById = (id: number) =>
  fetcher<{{resource}}>(`/admin/{{resource}}/${id}`);

// PATCH /admin/{{resource}}/:id
export const updateAdmin{{resource}} = (id: number, data: Update{{resource}}Input) =>
  fetcher<{{resource}}>(`/admin/{{resource}}/${id}`, {
    method: "PATCH",
    json: data,
  });

// DELETE /admin/{{resource}}/:id
export const deleteAdmin{{resource}} = (id: number) =>
  fetcher<void>(`/admin/{{resource}}/${id}`, {
    method: "DELETE",
  });

// POST /admin/{{resource}}/:id/restore
export const restoreAdmin{{resource}} = (id: number) =>
  fetcher<{{resource}}>(`/admin/{{resource}}/${id}/restore`, {
    method: "POST",
  });
```

example:
`web/src/features/admin/articles/api.ts`

```ts
import { fetcher } from "@/lib/fetcher";
import type {
  Article,
  ArticlesList,
  UpdateArticleInput,
} from "./types/article";

// GET /admin/articles?limit=10&offset=123
export const fetchAdminArticlesOffset = ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) =>
  fetcher<ArticlesList>("/admin/articles", {
    searchParams: { limit, offset },
  });

// GET /admin/articles/:id
export const fetchAdminArticleById = (id: number) =>
  fetcher<Article>(`/admin/articles/${id}`);

// PATCH /admin/articles/:id
export const updateAdminArticle = (id: number, data: UpdateArticleInput) =>
  fetcher<Article>(`/admin/articles/${id}`, {
    method: "PATCH",
    json: data,
  });

// DELETE /admin/articles/:id
export const deleteAdminArticle = (id: number) =>
  fetcher<void>(`/admin/articles/${id}`, {
    method: "DELETE",
  });

// POST /admin/articles/:id/restore
export const restoreAdminArticle = (id: number) =>
  fetcher<Article>(`/admin/articles/${id}/restore`, {
    method: "POST",
  });
```

## step 6 if admin needing file upload

replace update

```ts
import { toFormData } from "@/lib/utils/form-data";
...
// PATCH /admin/{{resource}}/:id
export const updateAdmin{{resource}} = (
  id: number,
  data: Update{{resource}}Input,
  file?: File,
) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    return fetcher<{{resource}}>(`/admin/{{resource}}/${id}`, {
      method: "PATCH",
      body: toFormData(data, file),
    });
  }

  return fetcher<{{resource}}>(`/admin/{{resource}}/${id}`, {
    method: "PATCH",
    json: data,
  });
};
```

example:

```ts
import { toFormData } from "@/lib/utils/form-data";
...
// PATCH /admin/articles/:id
export const updateAdminArticle = (
  id: number,
  data: UpdateArticleInput,
  file?: File,
) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    return fetcher<Article>(`/admin/articles/${id}`, {
      method: "PATCH",
      body: toFormData(data, file),
    });
  }

  return fetcher<Article>(`/admin/articles/${id}`, {
    method: "PATCH",
    json: data,
  });
};
```

## step 7 make `features/{{resource}}/hooks.ts`

> ⚠️ Omit offset hooks (`use{{resource}}Offset`, `use{{resource}}ByUserId`) if human did NOT request offset pagination. Omit cursor hooks (`use{{resource}}Cursor`, `use{{resource}}ByUserIdCursor`) if human did NOT request cursor pagination.

`web/src/features/{{resource}}/hooks.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query"; // only if using cursor
import {
  create{{resource}},
  fetch{{resource}}ById,
  fetch{{resource}}Offset,
  fetch{{resource}}Cursor,
  fetch{{resource}}ByUserId,
  fetch{{resource}}ByUserIdCursor,
  update{{resource}},
  delete{{resource}},
} from "./api";

export function use{{resource}}Offset(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["{{resource}}", page],
    queryFn: () => fetch{{resource}}Offset({ limit, offset }),
  });
}

export function use{{resource}}Cursor(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ["{{resource}}"],
    queryFn: ({ pageParam }) =>
      fetch{{resource}}Cursor({
        limit,
        cursor: pageParam ?? null,
      }),

    // pageParam = nextCursor from backend
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
  });
}

export function use{{resource}}ById(id: number) {
  return useQuery({
    queryKey: ["{{resource}}", id],
    queryFn: () => fetch{{resource}}ById(id),
    enabled: !!id,
  });
}

export function use{{resource}}ByUserId(
  userId: number,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["{{resource}}-by-user", userId, page],
    queryFn: () => fetch{{resource}}ByUserId({ userId, limit, offset }),
    enabled: !!userId,
  });
}

export function use{{resource}}ByUserIdCursor(userId: number, limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ["{{resource}}-by-user-cursor", userId],
    queryFn: ({ pageParam }) =>
      fetch{{resource}}ByUserIdCursor({
        userId,
        limit,
        cursor: pageParam ?? null,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!userId,
  });
}

export function useCreate{{resource}}() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: create{{resource}},
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["{{resource}}"] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useUpdate{{resource}}() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof update{{resource}}>[1];
    }) => update{{resource}}(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["{{resource}}"] });
      qc.invalidateQueries({ queryKey: ["{{resource}}", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useDelete{{resource}}() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: delete{{resource}},
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["{{resource}}"] });
      qc.removeQueries({ queryKey: ["{{resource}}", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
```

example:
`web/src/features/articles/hooks.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query"; // only if using cursor
import {
  createArticle,
  fetchArticleById,
  fetchArticlesOffset,
  fetchArticlesCursor,
  fetchArticlesByUserId,
  fetchArticlesByUserIdCursor,
  updateArticle,
  deleteArticle,
} from "./api";

export function useArticlesOffset(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["articles", page],
    queryFn: () => fetchArticlesOffset({ limit, offset }),
  });
}

export function useArticlesCursor(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ["articles"],
    queryFn: ({ pageParam }) =>
      fetchArticlesCursor({
        limit,
        cursor: pageParam ?? null,
      }),

    // pageParam = nextCursor from backend
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
  });
}

export function useArticleById(id: number) {
  return useQuery({
    queryKey: ["article", id],
    queryFn: () => fetchArticleById(id),
    enabled: !!id,
  });
}

export function useArticlesByUserId(
  userId: number,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["articles-by-user", userId, page],
    queryFn: () => fetchArticlesByUserId({ userId, limit, offset }),
    enabled: !!userId,
  });
}

export function useArticlesByUserIdCursor(userId: number, limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ["articles-by-user-cursor", userId],
    queryFn: ({ pageParam }) =>
      fetchArticlesByUserIdCursor({
        userId,
        limit,
        cursor: pageParam ?? null,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!userId,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateArticle>[1];
    }) => updateArticle(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["article", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.removeQueries({ queryKey: ["article", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
```

## step 8 if needing file upload

replace create and update

```ts
import { Create{{resource}}Input } from "./types/{{resource}}";
...
export function useCreate{{resource}}() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ data, file }: { data: Create{{resource}}Input; file?: File }) =>
      create{{resource}}(data, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["{{resource}}"] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useUpdate{{resource}}() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      file,
    }: {
      id: number;
      data: Parameters<typeof update{{resource}}>[1];
      file?: File;
    }) => update{{resource}}(id, data, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["{{resource}}"] });
      qc.invalidateQueries({ queryKey: ["{{resource}}", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
```

example:

```ts
import { CreateArticleInput } from "./types/article";
...
export function useCreateArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ data, file }: { data: CreateArticleInput; file?: File }) =>
      createArticle(data, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      file,
    }: {
      id: number;
      data: Parameters<typeof updateArticle>[1];
      file?: File;
    }) => updateArticle(id, data, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["article", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
```

## step 9 make `features/admin/{{resource}}/hooks.ts`

`web/src/features/admin/{{resource}}/hooks.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdmin{{resource}}Offset,
  fetchAdmin{{resource}}ById,
  updateAdmin{{resource}},
  deleteAdmin{{resource}},
  restoreAdmin{{resource}},
} from "./api";

export function useAdmin{{resource}}Offset(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["admin-{{resource}}", page],
    queryFn: () => fetchAdmin{{resource}}Offset({ limit, offset }),
  });
}

export function useAdmin{{resource}}ById(id: number) {
  return useQuery({
    queryKey: ["admin-{{resource}}", id],
    queryFn: () => fetchAdmin{{resource}}ById(id),
    enabled: !!id,
  });
}

export function useAdminUpdate{{resource}}() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateAdmin{{resource}}>[1];
    }) => updateAdmin{{resource}}(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin-{{resource}}"] });
      qc.invalidateQueries({ queryKey: ["admin-{{resource}}", id] });
    },
    throwOnError: false,
  });
}

export function useAdminDelete{{resource}}() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteAdmin{{resource}},
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["admin-{{resource}}"] });
      qc.removeQueries({ queryKey: ["admin-{{resource}}", id] });
    },
    throwOnError: false,
  });
}

export function useAdminRestore{{resource}}() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: restoreAdmin{{resource}},
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["admin-{{resource}}"] });
      qc.invalidateQueries({ queryKey: ["admin-{{resource}}", id] });
    },
    throwOnError: false,
  });
}
```

example:

`web/src/features/admin/articles/hooks.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminArticlesOffset,
  fetchAdminArticleById,
  updateAdminArticle,
  deleteAdminArticle,
  restoreAdminArticle,
} from "./api";

export function useAdminArticlesOffset(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["admin-articles", page],
    queryFn: () => fetchAdminArticlesOffset({ limit, offset }),
  });
}

export function useAdminArticleById(id: number) {
  return useQuery({
    queryKey: ["admin-article", id],
    queryFn: () => fetchAdminArticleById(id),
    enabled: !!id,
  });
}

export function useAdminUpdateArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateAdminArticle>[1];
    }) => updateAdminArticle(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["admin-article", id] });
    },
    throwOnError: false,
  });
}

export function useAdminDeleteArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminArticle,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.removeQueries({ queryKey: ["admin-article", id] });
    },
    throwOnError: false,
  });
}

export function useAdminRestoreArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: restoreAdminArticle,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["admin-article", id] });
    },
    throwOnError: false,
  });
}
```

## step 10 if admin needing file upload

replace update

```ts
export function useAdminUpdate{{resource}}() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      file,
    }: {
      id: number;
      data: Parameters<typeof updateAdmin{{resource}}>[1];
      file?: File;
    }) => updateAdmin{{resource}}(id, data, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin-{{resource}}"] });
      qc.invalidateQueries({ queryKey: ["admin-{{resource}}", id] });
    },
    throwOnError: false,
  });
}
```

example:

```ts
export function useAdminUpdateArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      file,
    }: {
      id: number;
      data: Parameters<typeof updateAdminArticle>[1];
      file?: File;
    }) => updateAdminArticle(id, data, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["admin-article", id] });
    },
    throwOnError: false,
  });
}
```

# part 14 files for creation

## step 1 make zod schema for create

look at the DTO files from backend to use guide on what zod validation should be
edit `features/{{resource}}/schemas/create{{resource}}.schema.ts`

`web/src/features/{{resource}}/schemas/create{{resource}}.schema.ts`

```ts
import { z } from "zod";
import { {{resource}}_STATUSES } from "../types/{{resource}}";

export const create{{resource}}Schema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  status: z.enum({{resource}}_STATUSES),
});

export type Create{{resource}}Input = z.infer<typeof create{{resource}}Schema>;
```

example:
`web/src/features/articles/schemas/createArticle.schema.ts`

```ts
import { z } from "zod";
import { ARTICLE_STATUSES } from "../types/article";

export const createArticleSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  status: z.enum(ARTICLE_STATUSES),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
```

## step 2 create form component

`web/src/features/{{resource}}/components/Create{{resource}}Form.tsx`

```tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  create{{resource}}Schema,
  Create{{resource}}Input,
} from "../schemas/create{{resource}}.schema";
import { useCreate{{resource}} } from "../hooks";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { {{resource}}_STATUSES } from "../types/{{resource}}";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function Create{{resource}}Form() {
  const form = useForm<Create{{resource}}Input>({
    resolver: zodResolver(create{{resource}}Schema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      status: "DRAFT",
    },
  });

  const {
    formState: { isValid },
  } = form;
  const router = useRouter();
  const create{{resource}}Mutation = useCreate{{resource}}();

  function onSubmit(data: Create{{resource}}Input) {
    const payload = {
      ...data,
    };
    create{{resource}}Mutation.mutate(payload, {
      onSuccess: (response) => {
        toast.success("{{resource}} created");
        router.push(`/{{resource}}/${response.id}`);
      },
      onError: (error) => {
        toast.error(`Error creating {{resource}}. ${error.message}`);
      },
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-sm"
      >
        {/* title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>

              <FormControl>
                <Input placeholder="title" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>

              <FormControl>
                <Textarea placeholder="content" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* status */}
        <div className="space-y-2">
          <Label htmlFor="inline-status" className="text-sm">
            Status
          </Label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="inline-status"
                  disabled={create{{resource}}Mutation.isPending}
                >
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {{{resource}}_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.status && (
            <p className="text-xs text-red-500">
              {form.formState.errors.status.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={create{{resource}}Mutation.isPending || !isValid}
        >
          {create{{resource}}Mutation.isPending ? "Creating..." : "Create {{resource}}"}
        </Button>
      </form>
    </Form>
  );
}
```

example:
`web/src/features/articles/components/CreateArticleForm.tsx`

```tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createArticleSchema,
  CreateArticleInput,
} from "../schemas/createArticle.schema";
import { useCreateArticle } from "../hooks";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ARTICLE_STATUSES } from "../types/article";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateArticleForm() {
  const form = useForm<CreateArticleInput>({
    resolver: zodResolver(createArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      status: "DRAFT",
    },
  });

  const {
    formState: { isValid },
  } = form;
  const router = useRouter();
  const createArticleMutation = useCreateArticle();

  function onSubmit(data: CreateArticleInput) {
    const payload = {
      ...data,
    };
    createArticleMutation.mutate(payload, {
      onSuccess: (response) => {
        toast.success("Article created");
        router.push(`/article/${response.id}`);
      },
      onError: (error) => {
        toast.error(`Error creating article. ${error.message}`);
      },
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-sm"
      >
        {/* title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>

              <FormControl>
                <Input placeholder="title" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>

              <FormControl>
                <Textarea placeholder="content" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* status */}
        <div className="space-y-2">
          <Label htmlFor="inline-status" className="text-sm">
            Status
          </Label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="inline-status"
                  disabled={createArticleMutation.isPending}
                >
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.status && (
            <p className="text-xs text-red-500">
              {form.formState.errors.status.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={createArticleMutation.isPending || !isValid}
        >
          {createArticleMutation.isPending ? "Creating..." : "Create article"}
        </Button>
      </form>
    </Form>
  );
}
```

## step 3 create form with file upload

need to add:

- A: `fileDropzone` and `useState` import
- B: file state variable
- C: change onSubmit function
- D: input for file upload

A:

```tsx
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useState } from "react";
```

B:

```tsx
const [selectedFile, setSelectedFile] = useState<File | null>(null);
```

C:

```tsx
function onSubmit(data: Create{{resource}}Input) {
  create{{resource}}Mutation.mutate(
    { data, file: selectedFile ?? undefined },
    {
      onSuccess: (response) => {
        toast.success("{{resource}} created");
        router.push(`/{{resource}}/${response?.id}`);
      },
      onError: (error) => {
        toast.error(`Error creating {{resource}}. ${error.message}`);
      },
    },
  );
}
```

example:

```tsx
function onSubmit(data: CreateArticleInput) {
  createArticleMutation.mutate(
    { data, file: selectedFile ?? undefined },
    {
      onSuccess: (response) => {
        toast.success("Article created");
        router.push(`/article/${response?.id}`);
      },
      onError: (error) => {
        toast.error(`Error creating article. ${error.message}`);
      },
    },
  );
}
```

D:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="articleImage"
    onFileSelect={setSelectedFile}
    disabled={createArticleMutation.isPending}
    preview
  />
</div>;
```

example:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="{{resource}}Image"
    onFileSelect={setSelectedFile}
    disabled={create{{resource}}Mutation.isPending}
    preview
  />
</div>;
```

## step 4 inline create form

`web/src/features/{{resource}}/components/InlineCreate{{resource}}Form.tsx`

```tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  create{{resource}}Schema,
  Create{{resource}}Input,
} from "../schemas/create{{resource}}.schema";
import { useCreate{{resource}} } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { {{resource}}_STATUSES } from "../types/{{resource}}";

interface InlineCreate{{resource}}FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

export function InlineCreate{{resource}}Form({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: InlineCreate{{resource}}FormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<Create{{resource}}Input>({
    resolver: zodResolver(create{{resource}}Schema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      status: "DRAFT",
    },
  });

  const create{{resource}}Mutation = useCreate{{resource}}();

  const { isValid } = form.formState;

  const handleSubmit = (data: Create{{resource}}Input) => {
    create{{resource}}Mutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.();
      },
      onError: (err) => {
        onError?.(err);
      },
    });
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Create {{resource}}
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* title */}
      <div className="space-y-2">
        <Label htmlFor="inline-title" className="text-sm">
          Title
        </Label>
        <Input
          id="inline-title"
          type="text"
          placeholder="title"
          disabled={create{{resource}}Mutation.isPending}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* content */}
      <div className="space-y-2">
        <Label htmlFor="inline-content" className="text-sm">
          Content
        </Label>
        <Textarea
          id="inline-content"
          placeholder="content"
          disabled={create{{resource}}Mutation.isPending}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      {/* status */}
      <div className="space-y-2">
        <Label htmlFor="inline-status" className="text-sm">
          Status
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="inline-status"
                disabled={create{{resource}}Mutation.isPending}
              >
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {{{resource}}_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-xs text-red-500">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={create{{resource}}Mutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={create{{resource}}Mutation.isPending || !isValid}
        >
          {create{{resource}}Mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {create{{resource}}Mutation.isPending ? "Creating..." : "Create {{resource}}"}
        </Button>
      </div>
    </form>
  );
}
```

example:
`web/src/features/articles/components/InlineCreateArticleForm.tsx`

```tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createArticleSchema,
  CreateArticleInput,
} from "../schemas/createArticle.schema";
import { useCreateArticle } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ARTICLE_STATUSES } from "../types/article";

interface InlineCreateArticleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

export function InlineCreateArticleForm({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: InlineCreateArticleFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreateArticleInput>({
    resolver: zodResolver(createArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      status: "DRAFT",
    },
  });

  const createArticleMutation = useCreateArticle();

  const { isValid } = form.formState;

  const handleSubmit = (data: CreateArticleInput) => {
    createArticleMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.();
      },
      onError: (err) => {
        onError?.(err);
      },
    });
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Create Article
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* title */}
      <div className="space-y-2">
        <Label htmlFor="inline-title" className="text-sm">
          Title
        </Label>
        <Input
          id="inline-title"
          type="text"
          placeholder="title"
          disabled={createArticleMutation.isPending}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* content */}
      <div className="space-y-2">
        <Label htmlFor="inline-content" className="text-sm">
          Content
        </Label>
        <Textarea
          id="inline-content"
          placeholder="content"
          disabled={createArticleMutation.isPending}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      {/* status */}
      <div className="space-y-2">
        <Label htmlFor="inline-status" className="text-sm">
          Status
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="inline-status"
                disabled={createArticleMutation.isPending}
              >
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {ARTICLE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-xs text-red-500">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={createArticleMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={createArticleMutation.isPending || !isValid}
        >
          {createArticleMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {createArticleMutation.isPending ? "Creating..." : "Create article"}
        </Button>
      </div>
    </form>
  );
}
```

## step 5 inline create form with file upload

need to add:

- A: `fileDropzone` import
- B: file state variable
- C: change handleSubmit function
- D: input for file upload
- E: clear file on reset button in action buttons

A:

```tsx
import { FileDropzone } from "@/components/ui/file-dropzone";
```

B:

```tsx
const [selectedFile, setSelectedFile] = useState<File | null>(null);
```

C:

```tsx
const handleSubmit = (data: Create{{resource}}Input) => {
  create{{resource}}Mutation.mutate(
    { data, file: selectedFile ?? undefined },
    {
      onSuccess: () => {
        form.reset();
        setSelectedFile(null);
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.();
      },
      onError: (err) => {
        onError?.(err);
      },
    },
  );
};
```

example:

```tsx
const handleSubmit = (data: CreateArticleInput) => {
  createArticleMutation.mutate(
    { data, file: selectedFile ?? undefined },
    {
      onSuccess: () => {
        form.reset();
        setSelectedFile(null);
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.();
      },
      onError: (err) => {
        onError?.(err);
      },
    },
  );
};
```

D:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="{{resource}}Image"
    onFileSelect={setSelectedFile}
    disabled={create{{resource}}Mutation.isPending}
    preview
  />
</div>;
```

example:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="articleImage"
    onFileSelect={setSelectedFile}
    disabled={createArticleMutation.isPending}
    preview
  />
</div>;
```

E:

```tsx
{/* Action Buttons */}
<div className="flex gap-3 pt-2">
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="cursor-pointer"
    onClick={() => {
      if (!isAlwaysOpen) {
        setIsOpen(false);
      }
      form.reset();
      setSelectedFile(null);
      onCancel?.();
    }}
    disabled={create{{resource}}Mutation.isPending}
  >
```

example:

```tsx
{/* Action Buttons */}
<div className="flex gap-3 pt-2">
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="cursor-pointer"
    onClick={() => {
      if (!isAlwaysOpen) {
        setIsOpen(false);
      }
      form.reset();
      setSelectedFile(null);
      onCancel?.();
    }}
    disabled={createArticleMutation.isPending}
  >
```

## step 6 modal for create

`web/src/features/{{resource}}/components/modal/Create{{resource}}Modal.tsx`

```tsx
import { InlineCreate{{resource}}Form } from "../InlineCreate{{resource}}Form";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function Create{{resource}}Modal() {
  const { closeModal } = useModal();

  return (
    <InlineCreate{{resource}}Form
      onSuccess={() => {
        toast.success("Successfully made {{resource}}");
        closeModal();
      }}
      onCancel={() => {
        toast.info("Reset form");
      }}
      onError={() => {
        toast.error("Error trying to make {{resource}}");
      }}
      isAlwaysOpen={false}
    />
  );
}
```

example:
`web/src/features/articles/components/modal/CreateArticleModal.tsx`

```tsx
import { InlineCreateArticleForm } from "../InlineCreateArticleForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function CreateArticleModal() {
  const { closeModal } = useModal();

  return (
    <InlineCreateArticleForm
      onSuccess={() => {
        toast.success("Successfully made article");
        closeModal();
      }}
      onCancel={() => {
        toast.info("Reset form");
      }}
      onError={() => {
        toast.error("Error trying to make article");
      }}
      isAlwaysOpen={false}
    />
  );
}
```

# part 15 files for update/edit

for the admin variants, despite forms being identical, its more so for future proof. for instance a new field like shadowbanned, only want admin able to modify it.

## step 1 make zod schema for update

look at the DTO files from backend to use as guide on what zod validation should be

`web/src/features/{{resource}}/schemas/update{{resource}}.schema.ts`

```ts
import { z } from "zod";
import { {{resource}}_STATUSES } from "../types/{{resource}}";

export const update{{resource}}Schema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(1000).optional(),
  status: z.enum({{resource}}_STATUSES).optional(),
});

export type Update{{resource}}Input = z.infer<typeof update{{resource}}Schema>;
```

example:
`web/src/features/articles/schemas/updateArticle.schema.ts`

```ts
import { z } from "zod";
import { ARTICLE_STATUSES } from "../types/article";

export const updateArticleSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(1000).optional(),
  status: z.enum(ARTICLE_STATUSES).optional(),
});

export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
```

## step 2 make admin zod schema for update

`web/src/features/admin/{{resource}}/schemas/adminUpdate{{resource}}.schema.ts`

```ts
import { z } from "zod";
import { {{resource}}_STATUSES } from "../types/{{resource}}";

export const adminUpdate{{resource}}Schema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(1000).optional(),
  status: z.enum({{resource}}_STATUSES).optional(),
});

export type AdminUpdate{{resource}}Input = z.infer<typeof adminUpdate{{resource}}Schema>;
```

example:
`web/src/features/admin/articles/schemas/adminUpdateArticle.schema.ts`

```ts
import { z } from "zod";
import { ARTICLE_STATUSES } from "../types/article";

export const adminUpdateArticleSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(1000).optional(),
  status: z.enum(ARTICLE_STATUSES).optional(),
});

export type AdminUpdateArticleInput = z.infer<typeof adminUpdateArticleSchema>;
```

## step 3 edit form component

`web/src/features/{{resource}}/components/Edit{{resource}}Form.tsx`

```tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  update{{resource}}Schema,
  Update{{resource}}Input,
} from "../schemas/update{{resource}}.schema";
import { useUpdate{{resource}} } from "../hooks";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { {{resource}}, {{resource}}_STATUSES } from "../types/{{resource}}";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function Edit{{resource}}Form({ {{resource}}Data }: { {{resource}}Data: {{resource}} }) {
  const form = useForm<Update{{resource}}Input>({
    resolver: zodResolver(update{{resource}}Schema),
    mode: "onChange",
    defaultValues: {
      title: {{resource}}Data.title,
      content: {{resource}}Data.content,
      status: {{resource}}Data.status,
    },
  });

  const {
    formState: { isValid },
  } = form;
  const router = useRouter();
  const update{{resource}}Mutation = useUpdate{{resource}}();

  function onSubmit(data: Update{{resource}}Input) {
    update{{resource}}Mutation.mutate(
      {
        id: {{resource}}Data.id,
        data: data,
      },
      {
        onSuccess: (response) => {
          toast.success("{{resource}} updated");
          router.push(`/{{resource}}/${response.id}`);
        },
        onError: (error) => {
          toast.error(`Error updating {{resource}}. ${error.message}`);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-sm"
      >
        {/* title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>

              <FormControl>
                <Input placeholder="title" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>

              <FormControl>
                <Textarea placeholder="content" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* status */}
        <div className="space-y-2">
          <Label htmlFor="inline-status" className="text-sm">
            Status
          </Label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="inline-status"
                  disabled={update{{resource}}Mutation.isPending}
                >
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {{{resource}}_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.status && (
            <p className="text-xs text-red-500">
              {form.formState.errors.status.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={update{{resource}}Mutation.isPending || !isValid}
        >
          {update{{resource}}Mutation.isPending ? "Updating..." : "Update {{resource}}"}
        </Button>
      </form>
    </Form>
  );
}
```

example:
`web/src/features/articles/components/EditArticleForm.tsx`

```tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateArticleSchema,
  UpdateArticleInput,
} from "../schemas/updateArticle.schema";
import { useUpdateArticle } from "../hooks";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Article, ARTICLE_STATUSES } from "../types/article";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function EditArticleForm({ articleData }: { articleData: Article }) {
  const form = useForm<UpdateArticleInput>({
    resolver: zodResolver(updateArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: articleData.title,
      content: articleData.content,
      status: articleData.status,
    },
  });

  const {
    formState: { isValid },
  } = form;
  const router = useRouter();
  const updateArticleMutation = useUpdateArticle();

  function onSubmit(data: UpdateArticleInput) {
    updateArticleMutation.mutate(
      {
        id: articleData.id,
        data: data,
      },
      {
        onSuccess: (response) => {
          toast.success("Article updated");
          router.push(`/article/${response.id}`);
        },
        onError: (error) => {
          toast.error(`Error updating article. ${error.message}`);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-sm"
      >
        {/* title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>

              <FormControl>
                <Input placeholder="title" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>

              <FormControl>
                <Textarea placeholder="content" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* status */}
        <div className="space-y-2">
          <Label htmlFor="inline-status" className="text-sm">
            Status
          </Label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="inline-status"
                  disabled={updateArticleMutation.isPending}
                >
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.status && (
            <p className="text-xs text-red-500">
              {form.formState.errors.status.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={updateArticleMutation.isPending || !isValid}
        >
          {updateArticleMutation.isPending ? "Updating..." : "Update article"}
        </Button>
      </form>
    </Form>
  );
}
```

## step 4 edit form component with file upload

need to add:

- A: `fileDropzone` and `useState` import
- B: file state variable
- C: change onSubmit function
- D: input for file upload
  A:

```tsx
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useState } from "react";
```

B:

```tsx
const [selectedFile, setSelectedFile] = useState<File | null>(null);
```

C:

```tsx
function onSubmit(data: Update{{resource}}Input) {
  update{{resource}}Mutation.mutate(
    {
      id: {{resource}}Data.id,
      data: data,
      file: selectedFile ?? undefined,
    },
    {
      onSuccess: (response) => {
        toast.success("{{resource}} updated");
        router.push(`/{{resource}}/${response.id}`);
      },
      onError: (error) => {
        toast.error(`Error updating {{resource}}. ${error.message}`);
      },
    },
  );
}
```

example:

```tsx
function onSubmit(data: UpdateArticleInput) {
  updateArticleMutation.mutate(
    {
      id: articleData.id,
      data: data,
      file: selectedFile ?? undefined,
    },
    {
      onSuccess: (response) => {
        toast.success("Article updated");
        router.push(`/article/${response.id}`);
      },
      onError: (error) => {
        toast.error(`Error updating article. ${error.message}`);
      },
    },
  );
}
```

D:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="{{resource}}Image"
    onFileSelect={setSelectedFile}
    disabled={update{{resource}}Mutation.isPending}
    preview
    currentImageUrl={{{resource}}Data.imagePath ?? undefined}
  />
</div>;
```

example:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="articleImage"
    onFileSelect={setSelectedFile}
    disabled={updateArticleMutation.isPending}
    preview
    currentImageUrl={articleData.imagePath ?? undefined}
  />
</div>;
```

## step 5 admin edit form component

`web/src/features/admin/{{resource}}/components/AdminEdit{{resource}}Form.tsx`

```tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminUpdate{{resource}}Schema,
  AdminUpdate{{resource}}Input,
} from "../schemas/adminUpdate{{resource}}.schema";
import { useAdminUpdate{{resource}} } from "../hooks";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { {{resource}}, {{resource}}_STATUSES } from "../types/{{resource}}";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminEdit{{resource}}Form({
  {{resource}}Data,
}: {
  {{resource}}Data: {{resource}};
}) {
  const form = useForm<AdminUpdate{{resource}}Input>({
    resolver: zodResolver(adminUpdate{{resource}}Schema),
    mode: "onChange",
    defaultValues: {
      title: {{resource}}Data.title,
      content: {{resource}}Data.content,
      status: {{resource}}Data.status,
    },
  });

  const {
    formState: { isValid },
  } = form;
  const router = useRouter();
  const update{{resource}}Mutation = useAdminUpdate{{resource}}();

  function onSubmit(data: AdminUpdate{{resource}}Input) {
    update{{resource}}Mutation.mutate(
      {
        id: {{resource}}Data.id,
        data: data,
      },
      {
        onSuccess: (response) => {
          toast.success("{{resource}} updated");
          router.push(`/{{resource}}/${response.id}`);
        },
        onError: (error) => {
          toast.error(`Error updating {{resource}}. ${error.message}`);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-sm"
      >
        {/* title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>

              <FormControl>
                <Input placeholder="title" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>

              <FormControl>
                <Textarea placeholder="content" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* status */}
        <div className="space-y-2">
          <Label htmlFor="inline-status" className="text-sm">
            Status
          </Label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="inline-status"
                  disabled={update{{resource}}Mutation.isPending}
                >
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {{{resource}}_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.status && (
            <p className="text-xs text-red-500">
              {form.formState.errors.status.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={update{{resource}}Mutation.isPending || !isValid}
        >
          {update{{resource}}Mutation.isPending ? "Updating..." : "Update {{resource}}"}
        </Button>
      </form>
    </Form>
  );
}
```

example:
`web/src/features/admin/articles/components/AdminEditArticleForm.tsx`

```tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminUpdateArticleSchema,
  AdminUpdateArticleInput,
} from "../schemas/adminUpdateArticle.schema";
import { useAdminUpdateArticle } from "../hooks";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Article, ARTICLE_STATUSES } from "../types/article";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminEditArticleForm({
  articleData,
}: {
  articleData: Article;
}) {
  const form = useForm<AdminUpdateArticleInput>({
    resolver: zodResolver(adminUpdateArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: articleData.title,
      content: articleData.content,
      status: articleData.status,
    },
  });

  const {
    formState: { isValid },
  } = form;
  const router = useRouter();
  const updateArticleMutation = useAdminUpdateArticle();

  function onSubmit(data: AdminUpdateArticleInput) {
    updateArticleMutation.mutate(
      {
        id: articleData.id,
        data: data,
      },
      {
        onSuccess: (response) => {
          toast.success("Article updated");
          router.push(`/article/${response.id}`);
        },
        onError: (error) => {
          toast.error(`Error updating article. ${error.message}`);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-sm"
      >
        {/* title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>

              <FormControl>
                <Input placeholder="title" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>

              <FormControl>
                <Textarea placeholder="content" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* status */}
        <div className="space-y-2">
          <Label htmlFor="inline-status" className="text-sm">
            Status
          </Label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="inline-status"
                  disabled={updateArticleMutation.isPending}
                >
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.status && (
            <p className="text-xs text-red-500">
              {form.formState.errors.status.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={updateArticleMutation.isPending || !isValid}
        >
          {updateArticleMutation.isPending ? "Updating..." : "Update article"}
        </Button>
      </form>
    </Form>
  );
}
```

## step 6 admin edit form component with file upload

need to add:

- A: `fileDropzone` and `useState` import
- B: file state variable
- C: change onSubmit function
- D: input for file upload

A:

```tsx
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useState } from "react";
```

B:

```tsx
const [selectedFile, setSelectedFile] = useState<File | null>(null);
```

C:

```tsx
function onSubmit(data: AdminUpdate{{resource}}Input) {
  update{{resource}}Mutation.mutate(
    {
      id: {{resource}}Data.id,
      data: data,
      file: selectedFile ?? undefined,
    },
    {
      onSuccess: (response) => {
        toast.success("{{resource}} updated");
        router.push(`/{{resource}}/${response.id}`);
      },
      onError: (error) => {
        toast.error(`Error updating {{resource}}. ${error.message}`);
      },
    },
  );
}
```

example:

```tsx
function onSubmit(data: AdminUpdateArticleInput) {
  updateArticleMutation.mutate(
    {
      id: articleData.id,
      data: data,
      file: selectedFile ?? undefined,
    },
    {
      onSuccess: (response) => {
        toast.success("Article updated");
        router.push(`/article/${response.id}`);
      },
      onError: (error) => {
        toast.error(`Error updating article. ${error.message}`);
      },
    },
  );
}
```

D:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="{{resource}}Image"
    onFileSelect={setSelectedFile}
    disabled={update{{resource}}Mutation.isPending}
    preview
    currentImageUrl={{{resource}}Data.imagePath ?? undefined}
  />
</div>;
```

example:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="articleImage"
    onFileSelect={setSelectedFile}
    disabled={updateArticleMutation.isPending}
    preview
    currentImageUrl={articleData.imagePath ?? undefined}
  />
</div>;
```

## step 7 inline edit form

`web/src/features/{{resource}}/components/InlineEdit{{resource}}Form.tsx`

```tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  update{{resource}}Schema,
  Update{{resource}}Input,
} from "../schemas/update{{resource}}.schema";
import { useUpdate{{resource}} } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { {{resource}}, {{resource}}_STATUSES } from "../types/{{resource}}";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InlineUpdate{{resource}}FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
  {{resource}}Data: {{resource}};
}

export function InlineEdit{{resource}}Form({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
  {{resource}}Data,
}: InlineUpdate{{resource}}FormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<Update{{resource}}Input>({
    resolver: zodResolver(update{{resource}}Schema),
    mode: "onChange",
    defaultValues: {
      title: {{resource}}Data.title,
      content: {{resource}}Data.content,
      status: {{resource}}Data.status,
    },
  });

  const update{{resource}}Mutation = useUpdate{{resource}}();

  const { isValid } = form.formState;

  const handleSubmit = (data: Update{{resource}}Input) => {
    update{{resource}}Mutation.mutate(
      { id: {{resource}}Data.id, data },
      {
        onSuccess: () => {
          form.reset();
          if (!isAlwaysOpen) {
            setIsOpen(false);
          }
          onSuccess?.();
        },
        onError: (err) => {
          onError?.(err);
        },
      },
    );
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Edit {{resource}}
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* title */}
      <div className="space-y-2">
        <Label htmlFor="inline-title" className="text-sm">
          Title
        </Label>
        <Input
          id="inline-title"
          type="text"
          placeholder="title"
          disabled={update{{resource}}Mutation.isPending}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* content */}
      <div className="space-y-2">
        <Label htmlFor="inline-content" className="text-sm">
          Content
        </Label>
        <Textarea
          id="inline-content"
          placeholder="content"
          disabled={update{{resource}}Mutation.isPending}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      {/* status */}
      <div className="space-y-2">
        <Label htmlFor="inline-status" className="text-sm">
          Status
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="inline-status"
                disabled={update{{resource}}Mutation.isPending}
              >
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {{{resource}}_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-xs text-red-500">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={update{{resource}}Mutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={update{{resource}}Mutation.isPending || !isValid}
        >
          {update{{resource}}Mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {update{{resource}}Mutation.isPending ? "Updating..." : "Update {{resource}}"}
        </Button>
      </div>
    </form>
  );
}
```

example:
`web/src/features/articles/components/InlineEditArticleForm.tsx`

```tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateArticleSchema,
  UpdateArticleInput,
} from "../schemas/updateArticle.schema";
import { useUpdateArticle } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Article, ARTICLE_STATUSES } from "../types/article";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InlineUpdateArticleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
  articleData: Article;
}

export function InlineEditArticleForm({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
  articleData,
}: InlineUpdateArticleFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<UpdateArticleInput>({
    resolver: zodResolver(updateArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: articleData.title,
      content: articleData.content,
      status: articleData.status,
    },
  });

  const updateArticleMutation = useUpdateArticle();

  const { isValid } = form.formState;

  const handleSubmit = (data: UpdateArticleInput) => {
    updateArticleMutation.mutate(
      { id: articleData.id, data },
      {
        onSuccess: () => {
          form.reset();
          if (!isAlwaysOpen) {
            setIsOpen(false);
          }
          onSuccess?.();
        },
        onError: (err) => {
          onError?.(err);
        },
      },
    );
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Edit Article
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* title */}
      <div className="space-y-2">
        <Label htmlFor="inline-title" className="text-sm">
          Title
        </Label>
        <Input
          id="inline-title"
          type="text"
          placeholder="title"
          disabled={updateArticleMutation.isPending}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* content */}
      <div className="space-y-2">
        <Label htmlFor="inline-content" className="text-sm">
          Content
        </Label>
        <Textarea
          id="inline-content"
          placeholder="content"
          disabled={updateArticleMutation.isPending}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      {/* status */}
      <div className="space-y-2">
        <Label htmlFor="inline-status" className="text-sm">
          Status
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="inline-status"
                disabled={updateArticleMutation.isPending}
              >
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {ARTICLE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-xs text-red-500">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={updateArticleMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={updateArticleMutation.isPending || !isValid}
        >
          {updateArticleMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {updateArticleMutation.isPending ? "Updating..." : "Update article"}
        </Button>
      </div>
    </form>
  );
}
```

## step 8 inline edit form with file upload

need to add:

- A: `fileDropzone` import
- B: file state variable
- C: change handleSubmit function
- D: input for file upload
- E: clear file on reset button in action buttons

A:

```tsx
import { FileDropzone } from "@/components/ui/file-dropzone";
```

B:

```tsx
const [selectedFile, setSelectedFile] = useState<File | null>(null);
```

C:

```tsx
const handleSubmit = (data: UpdateArticleInput) => {
  updateArticleMutation.mutate(
    { id: articleData.id, data, file: selectedFile ?? undefined },
    {
      onSuccess: () => {
        form.reset();
        setSelectedFile(null);
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.();
      },
      onError: (err) => {
        onError?.(err);
      },
    },
  );
};
```

D:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="{{resource}}Image"
    onFileSelect={setSelectedFile}
    disabled={update{{resource}}Mutation.isPending}
    preview
    currentImageUrl={{{resource}}Data.imagePath ?? undefined}
  />
</div>;
```

example:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="articleImage"
    onFileSelect={setSelectedFile}
    disabled={updateArticleMutation.isPending}
    preview
    currentImageUrl={articleData.imagePath ?? undefined}
  />
</div>;
```

E:

```tsx
{/* Action Buttons */}
<div className="flex gap-3 pt-2">
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="cursor-pointer"
    onClick={() => {
      if (!isAlwaysOpen) {
        setIsOpen(false);
      }
      form.reset();
      setSelectedFile(null);
      onCancel?.();
    }}
    disabled={update{{resource}}Mutation.isPending}
  >
```

example:

```tsx
{/* Action Buttons */}
<div className="flex gap-3 pt-2">
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="cursor-pointer"
    onClick={() => {
      if (!isAlwaysOpen) {
        setIsOpen(false);
      }
      form.reset();
      setSelectedFile(null);
      onCancel?.();
    }}
    disabled={updateArticleMutation.isPending}
  >
```

## step 9 admin inline edit form

`web/src/features/admin/{{resource}}/components/AdminInlineEdit{{resource}}Form.tsx`

```ts
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminUpdate{{resource}}Schema,
  AdminUpdate{{resource}}Input,
} from "../schemas/adminUpdate{{resource}}.schema";
import { useAdminUpdate{{resource}} } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { {{resource}}, {{resource}}_STATUSES } from "../types/{{resource}}";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InlineUpdate{{resource}}FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
  {{resource}}Data: {{resource}};
}

export function AdminInlineEdit{{resource}}Form({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
  {{resource}}Data,
}: InlineUpdate{{resource}}FormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<AdminUpdate{{resource}}Input>({
    resolver: zodResolver(adminUpdate{{resource}}Schema),
    mode: "onChange",
    defaultValues: {
      title: {{resource}}Data.title,
      content: {{resource}}Data.content,
      status: {{resource}}Data.status,
    },
  });

  const update{{resource}}Mutation = useAdminUpdate{{resource}}();

  const { isValid } = form.formState;

  const handleSubmit = (data: AdminUpdate{{resource}}Input) => {
    update{{resource}}Mutation.mutate(
      { id: {{resource}}Data.id, data },
      {
        onSuccess: () => {
          form.reset();
          if (!isAlwaysOpen) {
            setIsOpen(false);
          }
          onSuccess?.();
        },
        onError: (err) => {
          onError?.(err);
        },
      },
    );
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Edit {{resource}}
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* title */}
      <div className="space-y-2">
        <Label htmlFor="inline-title" className="text-sm">
          Title
        </Label>
        <Input
          id="inline-title"
          type="text"
          placeholder="title"
          disabled={update{{resource}}Mutation.isPending}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* content */}
      <div className="space-y-2">
        <Label htmlFor="inline-content" className="text-sm">
          Content
        </Label>
        <Textarea
          id="inline-content"
          placeholder="content"
          disabled={update{{resource}}Mutation.isPending}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      {/* status */}
      <div className="space-y-2">
        <Label htmlFor="inline-status" className="text-sm">
          Status
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="inline-status"
                disabled={update{{resource}}Mutation.isPending}
              >
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {{{resource}}_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-xs text-red-500">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={update{{resource}}Mutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={update{{resource}}Mutation.isPending || !isValid}
        >
          {update{{resource}}Mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {update{{resource}}Mutation.isPending ? "Updating..." : "Update {{resource}}"}
        </Button>
      </div>
    </form>
  );
}
```

example:
`web/src/features/admin/articles/components/AdminInlineEditArticleForm.tsx`

```ts
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminUpdateArticleSchema,
  AdminUpdateArticleInput,
} from "../schemas/adminUpdateArticle.schema";
import { useAdminUpdateArticle } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Article, ARTICLE_STATUSES } from "../types/article";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InlineUpdateArticleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
  articleData: Article;
}

export function AdminInlineEditArticleForm({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
  articleData,
}: InlineUpdateArticleFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<AdminUpdateArticleInput>({
    resolver: zodResolver(adminUpdateArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: articleData.title,
      content: articleData.content,
      status: articleData.status,
    },
  });

  const updateArticleMutation = useAdminUpdateArticle();

  const { isValid } = form.formState;

  const handleSubmit = (data: AdminUpdateArticleInput) => {
    updateArticleMutation.mutate(
      { id: articleData.id, data },
      {
        onSuccess: () => {
          form.reset();
          if (!isAlwaysOpen) {
            setIsOpen(false);
          }
          onSuccess?.();
        },
        onError: (err) => {
          onError?.(err);
        },
      },
    );
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Edit Article
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* title */}
      <div className="space-y-2">
        <Label htmlFor="inline-title" className="text-sm">
          Title
        </Label>
        <Input
          id="inline-title"
          type="text"
          placeholder="title"
          disabled={updateArticleMutation.isPending}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* content */}
      <div className="space-y-2">
        <Label htmlFor="inline-content" className="text-sm">
          Content
        </Label>
        <Textarea
          id="inline-content"
          placeholder="content"
          disabled={updateArticleMutation.isPending}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      {/* status */}
      <div className="space-y-2">
        <Label htmlFor="inline-status" className="text-sm">
          Status
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="inline-status"
                disabled={updateArticleMutation.isPending}
              >
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {ARTICLE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-xs text-red-500">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={updateArticleMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={updateArticleMutation.isPending || !isValid}
        >
          {updateArticleMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {updateArticleMutation.isPending ? "Updating..." : "Update article"}
        </Button>
      </div>
    </form>
  );
}
```

## step 10 admin inline edit form with file upload

need to add:

- A: `fileDropzone` import
- B: file state variable
- C: change handleSubmit function
- D: input for file upload
- E: clear file on reset button in action buttons

A:

```tsx
import { FileDropzone } from "@/components/ui/file-dropzone";
```

B:

```tsx
const [selectedFile, setSelectedFile] = useState<File | null>(null);
```

C:

```tsx
const handleSubmit = (data: AdminUpdateArticleInput) => {
  updateArticleMutation.mutate(
    { id: articleData.id, data, file: selectedFile ?? undefined },
    {
      onSuccess: () => {
        form.reset();
        setSelectedFile(null);
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.();
      },
      onError: (err) => {
        onError?.(err);
      },
    },
  );
};
```

D:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="{{resource}}Image"
    onFileSelect={setSelectedFile}
    disabled={update{{resource}}Mutation.isPending}
    preview
    currentImageUrl={{{resource}}Data.imagePath ?? undefined}
  />
</div>;
```

example:

```tsx
{
  /* file upload */
}
<div className="space-y-2">
  <Label className="text-sm">Featured Image (Optional)</Label>
  <FileDropzone
    preset="articleImage"
    onFileSelect={setSelectedFile}
    disabled={updateArticleMutation.isPending}
    preview
    currentImageUrl={articleData.imagePath ?? undefined}
  />
</div>;
```

E:

```tsx
{/* Action Buttons */}
<div className="flex gap-3 pt-2">
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="cursor-pointer"
    onClick={() => {
      if (!isAlwaysOpen) {
        setIsOpen(false);
      }
      form.reset();
      setSelectedFile(null);
      onCancel?.();
    }}
    disabled={update{{resource}}Mutation.isPending}
  >
```

example:

```tsx
{/* Action Buttons */}
<div className="flex gap-3 pt-2">
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="cursor-pointer"
    onClick={() => {
      if (!isAlwaysOpen) {
        setIsOpen(false);
      }
      form.reset();
      setSelectedFile(null);
      onCancel?.();
    }}
    disabled={updateArticleMutation.isPending}
  >
```

## step 11 modal for edit

`web/features/{{resource}}/components/modal/Edit{{resource}}Modal.tsx`

```tsx
import { InlineEdit{{resource}}Form } from "../InlineEdit{{resource}}Form";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { {{resource}} } from "../../types/{{resource}}";

export function Edit{{resource}}Modal({ data }: { data: {{resource}} }) {
  const { closeModal } = useModal();

  return (
    <InlineEdit{{resource}}Form
      {{resource}}Data={data}
      onSuccess={() => {
        toast.success("Successfully edited {{resource}}");
        closeModal();
      }}
      onCancel={() => {
        toast.info("Reset form");
      }}
      onError={() => {
        toast.error("Error trying to edit {{resource}}");
      }}
      isAlwaysOpen={true}
    />
  );
}
```

example:
`web/features/articles/components/modal/EditArticleModal.tsx`

```tsx
import { InlineEditArticleForm } from "../InlineEditArticleForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { Article } from "../../types/article";

export function EditArticleModal({ data }: { data: Article }) {
  const { closeModal } = useModal();

  return (
    <InlineEditArticleForm
      articleData={data}
      onSuccess={() => {
        toast.success("Successfully edited article");
        closeModal();
      }}
      onCancel={() => {
        toast.info("Reset form");
      }}
      onError={() => {
        toast.error("Error trying to edit article");
      }}
      isAlwaysOpen={true}
    />
  );
}
```

## step 12 admin modal for edit

`web/src/features/admin/{{resource}}/components/modal/AdminEdit{{resource}}Modal.tsx`

```ts
import { AdminInlineEdit{{resource}}Form } from "../AdminInlineEdit{{resource}}Form";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { {{resource}} } from "../../types/{{resource}}";

export function AdminEdit{{resource}}Modal({ data }: { data: {{resource}} }) {
  const { closeModal } = useModal();

  return (
    <AdminInlineEdit{{resource}}Form
      {{resource}}Data={data}
      onSuccess={() => {
        toast.success("Successfully edited {{resource}}");
        closeModal();
      }}
      onCancel={() => {
        toast.info("Reset form");
      }}
      onError={() => {
        toast.error("Error trying to edit {{resource}}");
      }}
      isAlwaysOpen={true}
    />
  );
}
```

example:
`web/src/features/admin/articles/components/modal/AdminEditArticleModal.tsx`

```ts
import { AdminInlineEditArticleForm } from "../AdminInlineEditArticleForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { Article } from "../../types/article";

export function AdminEditArticleModal({ data }: { data: Article }) {
  const { closeModal } = useModal();

  return (
    <AdminInlineEditArticleForm
      articleData={data}
      onSuccess={() => {
        toast.success("Successfully edited article");
        closeModal();
      }}
      onCancel={() => {
        toast.info("Reset form");
      }}
      onError={() => {
        toast.error("Error trying to edit article");
      }}
      isAlwaysOpen={true}
    />
  );
}
```

# part 16 | make generic component for {{resource}}

Instructions for AI, roughly guess UI component based off schema model and type.ts, this is more so just to quickly check if api/hooks work. doesn't matter if its ugly. The examples below assumes image but if different media like video, attempt to render it in html. recommend what libraries or components to use in comments.

`web/src/components/ui/{{resource}}.tsx`

```tsx
import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { {{resource}} as {{resource}}Type } from "@/features/{{resource}}/types/{{resource}}";
import { Trash, PencilLine, Calendar } from "lucide-react";
import { ConfirmModal } from "../modal/ConfirmModal";
import { useModal } from "../providers/ModalProvider";
import { useDelete{{resource}} } from "@/features/{{resource}}/hooks";
import { toast } from "sonner";
import { InlineEdit{{resource}}Form } from "@/features/{{resource}}/components/InlineEdit{{resource}}Form";
import { AppImage } from "./AppImage"; // omit if schema doesn't have media image

export function {{resource}}({
  data,
  isOwner,
  truncateContent = true,
  truncateTitle = true,
}: {
  data: {{resource}}Type;
  isOwner: boolean;
  truncateContent?: boolean;
  truncateTitle?: boolean;
}) {
  const delete{{resource}} = useDelete{{resource}}();
  const { openModal, closeModal } = useModal();
  const router = useRouter();

  function modify{{resource}}(isOwner: boolean) {
    if (!isOwner) {
      return;
    } else {
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => router.push(`/{{resource}}/edit/${data.id}`)}
            title="Edit {{resource}}"
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          {/* edit inline button below me is for testing purposes, remove me after test */}
          <Button
            onClick={() => {
              openModal({
                title: "edit {{resource}}",
                content: <InlineEdit{{resource}}Form {{resource}}Data={data} />,
              });
            }}
            title="edit {{resource}}"
          >
            edit inline
          </Button>
          {/* EoF test */}
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => {
              openModal({
                title: "Delete {{resource}}",
                content: (
                  <ConfirmModal
                    message={`Are you sure you want to delete this {{resource}}?`}
                    onConfirm={() =>
                      delete{{resource}}.mutate(data.id, {
                        onSuccess: () => {
                          closeModal();
                          router.push(`/{{resource}}`);
                        },
                        onError: (error) => {
                          toast.error("Failed to delete {{resource}}: " + error);
                        },
                      })
                    }
                    variant={"destructive"}
                  />
                ),
              });
            }}
            title="Delete {{resource}}"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    }
  }

  const formattedDate = new Date(data.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="p-3 md:p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2 pb-3 border-b border-border/50">
        <div className="flex-1">
          <h2
            className={`cursor-pointer text-sm md:text-base font-semibold hover:text-blue-500 transition-colors ${truncateTitle ? "line-clamp-2" : ""}`}
            style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
            onClick={() => router.push(`/{{resource}}/${data.id}`)}
          >
            {data?.title}
          </h2>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">
              {data.status
                ? data.status.charAt(0).toUpperCase() +
                  data.status.slice(1).toLowerCase()
                : "Draft"}
            </span>
          </div>
        </div>
        {modify{{resource}}(isOwner)}
      </div>
      {/* omit me if doing image */}
      {data?.imagePath && (
        <div className="w-full h-48 md:h-64 rounded-md overflow-hidden my-3 bg-muted">
          <AppImage
            src={data.imagePath}
            alt={data.title}
            className="w-full h-full object-cover"
            expandable
          />
        </div>
      )}
      {/* EoF omit */}
      <p
        className={`text-xs md:text-sm text-foreground my-3 ${truncateContent ? "line-clamp-3" : ""}`}
        style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
      >
        {data?.content}
      </p>
      <div className="flex items-center justify-between gap-2 mt-3 min-w-0">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
          onClick={() => router.push("/user/" + data?.creator.username)}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage
              src={data?.creator.avatarPath}
              alt={data?.creator.username}
            />
            <AvatarFallback className="text-xs">
              {data?.creator.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
            {data?.creator.username}
          </p>
        </div>
        <div className="flex gap-2 items-center text-xs md:text-sm shrink-0">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Card>
  );
}
```

example:
`web/src/components/ui/Article.tsx`

```tsx
import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Article as ArticleType } from "@/features/articles/types/article";
import { Trash, PencilLine, Calendar } from "lucide-react";
import { ConfirmModal } from "../modal/ConfirmModal";
import { useModal } from "../providers/ModalProvider";
import { useDeleteArticle } from "@/features/articles/hooks";
import { toast } from "sonner";
import { InlineEditArticleForm } from "@/features/articles/components/InlineEditArticleForm";
import { AppImage } from "./AppImage"; // omit if schema doesn't have media image

export function Article({
  data,
  isOwner,
  truncateContent = true,
  truncateTitle = true,
}: {
  data: ArticleType;
  isOwner: boolean;
  truncateContent?: boolean;
  truncateTitle?: boolean;
}) {
  const deleteArticle = useDeleteArticle();
  const { openModal, closeModal } = useModal();
  const router = useRouter();

  function modifyArticle(isOwner: boolean) {
    if (!isOwner) {
      return;
    } else {
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => router.push(`/article/edit/${data.id}`)}
            title="Edit article"
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          {/* edit inline button below me is for testing purposes, remove me after test */}
          <Button
            onClick={() => {
              openModal({
                title: "edit Article",
                content: <InlineEditArticleForm articleData={data} />,
              });
            }}
            title="edit article"
          >
            edit inline
          </Button>
          {/* EoF test */}
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => {
              openModal({
                title: "Delete Article",
                content: (
                  <ConfirmModal
                    message={`Are you sure you want to delete this article?`}
                    onConfirm={() =>
                      deleteArticle.mutate(data.id, {
                        onSuccess: () => {
                          closeModal();
                          router.push(`/article`);
                        },
                        onError: (error) => {
                          toast.error("Failed to delete article: " + error);
                        },
                      })
                    }
                    variant={"destructive"}
                  />
                ),
              });
            }}
            title="Delete article"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    }
  }

  const formattedDate = new Date(data.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="p-3 md:p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2 pb-3 border-b border-border/50">
        <div className="flex-1">
          <h2
            className={`cursor-pointer text-sm md:text-base font-semibold hover:text-blue-500 transition-colors ${truncateTitle ? "line-clamp-2" : ""}`}
            style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
            onClick={() => router.push(`/article/${data.id}`)}
          >
            {data?.title}
          </h2>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">
              {data.status
                ? data.status.charAt(0).toUpperCase() +
                  data.status.slice(1).toLowerCase()
                : "Draft"}
            </span>
          </div>
        </div>
        {modifyArticle(isOwner)}
      </div>
      {/* omit me if doing image */}
      {data?.imagePath && (
        <div className="w-full h-48 md:h-64 rounded-md overflow-hidden my-3 bg-muted">
          <AppImage
            src={data.imagePath}
            alt={data.title}
            className="w-full h-full object-cover"
            expandable
          />
        </div>
      )}
      {/* EoF omit */}
      <p
        className={`text-xs md:text-sm text-foreground my-3 ${truncateContent ? "line-clamp-3" : ""}`}
        style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
      >
        {data?.content}
      </p>
      <div className="flex items-center justify-between gap-2 mt-3 min-w-0">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
          onClick={() => router.push("/user/" + data?.creator.username)}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage
              src={data?.creator.avatarPath}
              alt={data?.creator.username}
            />
            <AvatarFallback className="text-xs">
              {data?.creator.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
            {data?.creator.username}
          </p>
        </div>
        <div className="flex gap-2 items-center text-xs md:text-sm shrink-0">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Card>
  );
}
```

# part 17 | make pagination component

## step 1 make pagination list component using UI component made in previous part

`web/src/components/pages/{{resource}}/Paginated{{resource}}.tsx`

```ts
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { use{{resource}}Offset } from "@/features/{{resource}}/hooks";
import { {{resource}} } from "@/components/ui/{{resource}}";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { useSessionUser } from "@/features/auth/hooks";
import { PageLoadingState } from "@/components/common/PageLoadingState";

const DEFAULT_LIMIT = 4;

function {{resource}}ListContent() {
  const { data: user } = useSessionUser();

  const searchParams = useSearchParams();

  // Get page from query params
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading } = use{{resource}}Offset(page, DEFAULT_LIMIT);

  const {{resource}} = data?.items ?? [];
  const totalItems = data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedList
      url="{{resource}}"
      page={page}
      limit={DEFAULT_LIMIT}
      items={{{resource}}}
      totalItems={totalItems}
      isLoading={isLoading}
      renderItem={({{resource}}) => (
        <{{resource}} data={{{resource}}} isOwner={{{resource}}.creator.id === user?.id} />
      )}
      title="{{resource}}"
      layout="flex"
      renderSkeleton={() => <PageLoadingState variant="card" />}
    />
  );
}

export function Paginated{{resource}}() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <{{resource}}ListContent />
    </Suspense>
  );
}
```

example:
`web/src/components/pages/article/PaginatedArticles.tsx`

```ts
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useArticlesOffset } from "@/features/articles/hooks";
import { Article } from "@/components/ui/Article";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { useSessionUser } from "@/features/auth/hooks";
import { PageLoadingState } from "@/components/common/PageLoadingState";

const DEFAULT_LIMIT = 4;

function ArticlesListContent() {
  const { data: user } = useSessionUser();

  const searchParams = useSearchParams();

  // Get page from query params
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading } = useArticlesOffset(page, DEFAULT_LIMIT);

  const articles = data?.items ?? [];
  const totalItems = data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedList
      url="article"
      page={page}
      limit={DEFAULT_LIMIT}
      items={articles}
      totalItems={totalItems}
      isLoading={isLoading}
      renderItem={(articles) => (
        <Article data={articles} isOwner={articles.creator.id === user?.id} />
      )}
      title="Articles"
      layout="flex"
      renderSkeleton={() => <PageLoadingState variant="card" />}
    />
  );
}

export function PaginatedArticles() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ArticlesListContent />
    </Suspense>
  );
}
```

## step 2 (optional) cursor pagination with load more button

`web/src/components/pages/{{resource}}/Cursor{{resource}}.tsx`

```tsx
"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { {{resource}} } from "@/components/ui/{{resource}}";
import { CursorList } from "@/components/ui/pagination/CursorList";
import { use{{resource}}Cursor } from "@/features/{{resource}}/hooks";
import { useSessionUser } from "@/features/auth/hooks";

const DEFAULT_LIMIT = 4;

export function Cursor{{resource}}() {
  const { data: user } = useSessionUser();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    use{{resource}}Cursor(DEFAULT_LIMIT);

  const {{resource}} = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <CursorList
      items={{{resource}}}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage()}
      renderItem={({{resource}}) => (
        <{{resource}} data={{{resource}}} isOwner={{{resource}}.creator.id === user?.id} />
      )}
      layout="flex"
      title="Cursor {{resource}}"
      renderSkeleton={() => <PageLoadingState variant="card" />}
    />
  );
}
```

example:
`web/src/components/pages/article/CursorArticles.tsx`

```tsx
"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { Article } from "@/components/ui/Article";
import { CursorList } from "@/components/ui/pagination/CursorList";
import { useArticlesCursor } from "@/features/articles/hooks";
import { useSessionUser } from "@/features/auth/hooks";

const DEFAULT_LIMIT = 4;

export function CursorArticles() {
  const { data: user } = useSessionUser();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useArticlesCursor(DEFAULT_LIMIT);

  const articles = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <CursorList
      items={articles}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage()}
      renderItem={(article) => (
        <Article data={article} isOwner={article.creator.id === user?.id} />
      )}
      layout="flex"
      title="Cursor Articles"
      renderSkeleton={() => <PageLoadingState variant="card" />}
    />
  );
}
```

## step 3 (optional) cursor pagination that uses infinite scrolling

`web/src/components/pages/{{resource}}/CursorInfinite{{resource}}.tsx`

```tsx
"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { {{resource}} } from "@/components/ui/{{resource}}";
import { CursorInfiniteList } from "@/components/ui/pagination/CursorInfiniteList";
import { use{{resource}}Cursor } from "@/features/{{resource}}/hooks";
import { useSessionUser } from "@/features/auth/hooks";

const DEFAULT_LIMIT = 4;

export function CursorInfinite{{resource}}() {
  const { data: user } = useSessionUser();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    use{{resource}}Cursor(DEFAULT_LIMIT);

  const {{resource}} = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <CursorInfiniteList
      items={{{resource}}}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage()}
      renderItem={({{resource}}) => (
        <{{resource}} data={{{resource}}} isOwner={{{resource}}.creator.id === user?.id} />
      )}
      layout="flex"
      title="Infinite {{resource}}"
      renderSkeleton={() => <PageLoadingState variant="card" />}
    />
  );
}
```

example:
`web/src/components/pages/article/CursorInfiniteArticles.tsx`

```tsx
"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { Article } from "@/components/ui/Article";
import { CursorInfiniteList } from "@/components/ui/pagination/CursorInfiniteList";
import { useArticlesCursor } from "@/features/articles/hooks";
import { useSessionUser } from "@/features/auth/hooks";

const DEFAULT_LIMIT = 4;

export function CursorInfiniteArticles() {
  const { data: user } = useSessionUser();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useArticlesCursor(DEFAULT_LIMIT);

  const articles = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <CursorInfiniteList
      items={articles}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage()}
      renderItem={(article) => (
        <Article data={article} isOwner={article.creator.id === user?.id} />
      )}
      layout="flex"
      title="Infinite Articles"
      renderSkeleton={() => <PageLoadingState variant="card" />}
    />
  );
}
```

# part 18 | make pages

## basic/home

### step 1 make component for its upcoming page.tsx

omit cursor code if not using cursor

`web/src/components/pages/{{resource}}/{{resource}}Page.tsx`

```tsx
"use client";

import { Paginated{{resource}} } from "./Paginated{{resource}}";
import { Cursor{{resource}} } from "./Cursor{{resource}}";
import { CursorInfinite{{resource}} } from "./CursorInfinite{{resource}}";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalProvider";
import { Create{{resource}}Modal } from "@/features/{{resource}}/components/modal/Create{{resource}}Modal";

export function {{resource}}Page() {
  const router = useRouter();

  const { openModal } = useModal();

  return (
    <div>
      <div>
        <Button
          className="cursor-pointer w-full md:w-auto"
          onClick={() => router.push("/{{resource}}/create")}
        >
          <Plus /> {{resource}}
        </Button>
        {/* test inline forms work. remove this button after test */}
        <Button
          onClick={() => {
            openModal({
              title: "Create new {{resource}}",
              content: <Create{{resource}}Modal />,
            });
          }}
        >
          Create {{resource}}
        </Button>
        {/* EoF test */}
      </div>
      <Paginated{{resource}} />
      {/* <Cursor{{resource}} /> */}
      {/* <CursorInfinite{{resource}} /> */}
    </div>
  );
}
```

example:

`web/src/components/pages/article/ArticlePage.tsx`

```tsx
"use client";

import { PaginatedArticles } from "./PaginatedArticles";
import { CursorArticles } from "./CursorArticles";
import { CursorInfiniteArticles } from "./CursorInfiniteArticles";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalProvider";
import { CreateArticleModal } from "@/features/articles/components/modal/CreateArticleModal";

export function ArticlePage() {
  const router = useRouter();

  const { openModal } = useModal();

  return (
    <div>
      <div>
        <Button
          className="cursor-pointer w-full md:w-auto"
          onClick={() => router.push("/article/create")}
        >
          <Plus /> Article
        </Button>
        {/* test inline forms work. remove this button after test */}
        <Button
          onClick={() => {
            openModal({
              title: "Create new article",
              content: <CreateArticleModal />,
            });
          }}
        >
          Create Article
        </Button>
        {/* EoF test */}
      </div>
      <PaginatedArticles />
      {/* <CursorArticles /> */}
      {/* <CursorInfiniteArticles /> */}
    </div>
  );
}
```

### step 2 use in page.tsx

`web/src/app/(default)/{{resource}}/page.tsx`

```tsx
import { {{resource}}Page } from "@/components/pages/{{resource}}/{{resource}}Page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "{{resource}}",
};

export default function page() {
  return (
    <div>
      <{{resource}}Page />
    </div>
  );
}
```

example:
`web/src/app/(default)/article/page.tsx`

```tsx
import { ArticlePage } from "@/components/pages/article/ArticlePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles",
};

export default function page() {
  return (
    <div>
      <ArticlePage />
    </div>
  );
}
```

## create

### step 1 make component for its upcoming page.tsx

`web/src/components/pages/{{resource}}/Create{{resource}}Page.tsx`

```tsx
import { Create{{resource}}Form } from "@/features/{{resource}}/components/Create{{resource}}Form";
import { Card } from "@/components/ui/card";

export function Create{{resource}}Page() {
  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <Create{{resource}}Form />
    </Card>
  );
}
```

example:
`web/src/components/pages/article/CreateArticlePage.tsx`

```tsx
import { CreateArticleForm } from "@/features/articles/components/CreateArticleForm";
import { Card } from "@/components/ui/card";

export function CreateArticlePage() {
  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <CreateArticleForm />
    </Card>
  );
}
```

### step 2 use in page.tsx

`web/src/app/(default)/{{resource}}/create/page.tsx`

```tsx
import { Create{{resource}}Page } from "@/components/pages/{{resource}}/Create{{resource}}Page";
import { requireAuth } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create {{resource}}",
};

export default async function page() {
  const user = await requireAuth();

  return <Create{{resource}}Page />;
}
```

example:
`web/src/app/(default)/article/create/page.tsx`

```tsx
import { CreateArticlePage } from "@/components/pages/article/CreateArticlePage";
import { requireAuth } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Article",
};

export default async function page() {
  const user = await requireAuth();

  return <CreateArticlePage />;
}
```

## edit

### step 1 make component for its upcoming page.tsx

`web/src/components/pages/{{resource}}/Edit{{resource}}Page.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { Edit{{resource}}Form } from "@/features/{{resource}}/components/Edit{{resource}}Form";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useSessionUser } from "@/features/auth/hooks";
import { use{{resource}}ById } from "@/features/{{resource}}/hooks";
import { useRouter } from "next/navigation";

export function Edit{{resource}}Page() {
  const { data: user, isLoading: loadingUser } = useSessionUser();
  const params = useParams<{ id: string }>();
  const { data: {{resource}}, isLoading: loading{{resource}} } = use{{resource}}ById(
    Number(params.id),
  );
  const router = useRouter();

  useEffect(() => {
    if (!loading{{resource}} && !{{resource}}) {
      router.push("/not-found");
    }
  }, [{{resource}}, loading{{resource}}, router]);

  useEffect(() => {
    if (!loadingUser && !loading{{resource}} && {{resource}} && user) {
      const isOwner = user.id === {{resource}}.creator?.id;
      if (!isOwner) {
        router.push("/unauthorized");
      }
    }
  }, [user, loadingUser, {{resource}}, loading{{resource}}, router]);

  if (loadingUser || loading{{resource}}) {
    return <PageLoadingState variant="card" />;
  }

  if (!{{resource}}) {
    return null;
  }

  const isOwner = user?.id === {{resource}}?.creator?.id;
  if (!isOwner) {
    return null;
  }

  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <Edit{{resource}}Form {{resource}}Data={{{resource}}} />
    </Card>
  );
}
```

example:
`web/src/components/pages/article/EditArticlePage.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { EditArticleForm } from "@/features/articles/components/EditArticleForm";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useSessionUser } from "@/features/auth/hooks";
import { useArticleById } from "@/features/articles/hooks";
import { useRouter } from "next/navigation";

export function EditArticlePage() {
  const { data: user, isLoading: loadingUser } = useSessionUser();
  const params = useParams<{ id: string }>();
  const { data: article, isLoading: loadingArticle } = useArticleById(
    Number(params.id),
  );
  const router = useRouter();

  useEffect(() => {
    if (!loadingArticle && !article) {
      router.push("/not-found");
    }
  }, [article, loadingArticle, router]);

  useEffect(() => {
    if (!loadingUser && !loadingArticle && article && user) {
      const isOwner = user.id === article.creator?.id;
      if (!isOwner) {
        router.push("/unauthorized");
      }
    }
  }, [user, loadingUser, article, loadingArticle, router]);

  if (loadingUser || loadingArticle) {
    return <PageLoadingState variant="card" />;
  }

  if (!article) {
    return null;
  }

  const isOwner = user?.id === article?.creator?.id;
  if (!isOwner) {
    return null;
  }

  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <EditArticleForm articleData={article} />
    </Card>
  );
}
```

### step 2 use in page.tsx

`web/src/app/(default)/{{resource}}/edit/[id]/page.tsx`

```tsx
import { Edit{{resource}}Page } from "@/components/pages/{{resource}}/Edit{{resource}}Page";
import { requireAuth } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit {{resource}}",
};

export default async function page() {
  const user = await requireAuth();

  return <Edit{{resource}}Page />;
}
```

example:
`web/src/app/(default)/article/edit/[id]/page.tsx`

```tsx
import { EditArticlePage } from "@/components/pages/article/EditArticlePage";
import { requireAuth } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Article",
};

export default async function page() {
  const user = await requireAuth();

  return <EditArticlePage />;
}
```

## by Id

### step 1 make component for its upcoming page.tsx

`web/src/components/pages/{{resource}}/{{resource}}Detail.tsx`

```tsx
"use client";

import { {{resource}} } from "@/components/ui/{{resource}}";
import { use{{resource}}ById } from "@/features/{{resource}}/hooks";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { PageNotFound } from "@/components/common/PageNotFound";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { User } from "@/features/users/types/user";

export function {{resource}}Detail({ user }: { user: User | undefined }) {
  const params = useParams();
  const {{resource}}Id = Number(params.id);
  const { data, isLoading, error } = use{{resource}}ById({{resource}}Id);
  const isOwner = data?.creator.id === user?.id;

  useEffect(() => {
    document.title = `${data?.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;
  }, [data?.title]);

  if (isLoading) {
    return <PageLoadingState variant="card" />;
  }

  if (error || !data) {
    return <PageNotFound title="{{resource}} Not Found" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <{{resource}}
        data={data}
        isOwner={isOwner}
        truncateTitle={false}
        truncateContent={false}
      />
    </div>
  );
}
```

example:
`web/src/components/pages/article/ArticleDetail.tsx`

```tsx
"use client";

import { Article } from "@/components/ui/Article";
import { useArticleById } from "@/features/articles/hooks";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { PageNotFound } from "@/components/common/PageNotFound";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { User } from "@/features/users/types/user";

export function ArticleDetail({ user }: { user: User | undefined }) {
  const params = useParams();
  const articleId = Number(params.id);
  const { data, isLoading, error } = useArticleById(articleId);
  const isOwner = data?.creator.id === user?.id;

  useEffect(() => {
    document.title = `${data?.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;
  }, [data?.title]);

  if (isLoading) {
    return <PageLoadingState variant="card" />;
  }

  if (error || !data) {
    return <PageNotFound title="Article Not Found" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Article
        data={data}
        isOwner={isOwner}
        truncateTitle={false}
        truncateContent={false}
      />
    </div>
  );
}
```

### step 2 use in page.tsx

`web/src/app/(default)/{{resource}}/[id]/page.tsx`

```tsx
import { getServerUser } from "@/features/auth/server";
import { {{resource}}Detail } from "@/components/pages/{{resource}}/{{resource}}Detail";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/{{resource}}/${id}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch {{resource}}: ${response.status}`);
    }

    const jsonResponse = await response.json();
    const {{resource}}Title =
      jsonResponse?.data?.title || jsonResponse?.title || "{{resource}}";

    return {
      title: {{resource}}Title,
    };
  } catch (error) {
    console.error("Error in generateMetadata for {{resource}}:", error);
    return {
      title: "{{resource}} Detail",
    };
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function page({ params }: PageProps) {
  const user = await getServerUser();
  const { id } = await params;

  return <{{resource}}Detail user={user} />;
}
```

example:
`web/src/app/(default)/article/[id]/page.tsx`

```tsx
import { getServerUser } from "@/features/auth/server";
import { ArticleDetail } from "@/components/pages/article/ArticleDetail";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/articles/${id}`,
      {
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const jsonResponse = await response.json();
    const articleTitle =
      jsonResponse?.data?.title || jsonResponse?.title || "Article";

    return {
      title: articleTitle,
    };
  } catch (error) {
    console.error("Error in generateMetadata for article:", error);
    return {
      title: "Article Detail",
    };
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function page({ params }: PageProps) {
  const user = await getServerUser();
  const { id } = await params;

  return <ArticleDetail user={user} />;
}
```

## (optional) append to profile page list of user's {{resource}}

if `web/src/components/pages/userProfile/UserProfileContent.tsx` doesn't exist, skip this section. skip step 1 and step 2

### step 1 make component for Users {{resource}} list

`web/src/components/pages/userProfile/Users{{resource}}List.tsx`

```tsx
"use client";

import { useState } from "react";
import { use{{resource}}ByUserId } from "@/features/{{resource}}/hooks";
import { {{resource}} } from "@/components/ui/{{resource}}";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { PublicUser } from "@/features/users/types/user";

interface Users{{resource}}ListProps {
  user: PublicUser;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

export function Users{{resource}}List({ user, isOwner }: Users{{resource}}ListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = use{{resource}}ByUserId(user.id, page, DEFAULT_LIMIT);

  const {{resource}} = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedListInline
      page={page}
      limit={DEFAULT_LIMIT}
      items={{{resource}}}
      totalItems={totalItems}
      isLoading={isLoading}
      onPageChange={setPage}
      renderItem={({{resource}}) => <{{resource}} data={{{resource}}} isOwner={isOwner} />}
      title={`{{resource}} by ${user.username}`}
      layout="grid"
      emptyMessage="No {{resource}} yet."
    />
  );
}
```

example"
`web/src/components/pages/userProfile/UsersArticlesList.tsx`

```tsx
"use client";

import { useState } from "react";
import { useArticlesByUserId } from "@/features/articles/hooks";
import { Article } from "@/components/ui/Article";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { PublicUser } from "@/features/users/types/user";

interface UsersArticlesListProps {
  user: PublicUser;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

export function UsersArticlesList({ user, isOwner }: UsersArticlesListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useArticlesByUserId(user.id, page, DEFAULT_LIMIT);

  const articles = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedListInline
      page={page}
      limit={DEFAULT_LIMIT}
      items={articles}
      totalItems={totalItems}
      isLoading={isLoading}
      onPageChange={setPage}
      renderItem={(article) => <Article data={article} isOwner={isOwner} />}
      title={`Articles by ${user.username}`}
      layout="grid"
      emptyMessage="No articles yet."
    />
  );
}
```

### step 2 add to UsersProfileContent.tsx

add import of newly made Users{{resource}}List.tsx
`web/src/components/pages/userProfile/UserProfileContent.tsx`

```tsx
...
import { UsersArticlesList } from "./UsersArticlesList";


export function UserProfileContent({ user, isOwner }: UserProfileContentProps) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<p>Loading...</p>}>
        <UsersPostsList user={user} isOwner={isOwner} />
        <UsersArticlesList user={user} isOwner={isOwner} />
        {isOwner && <LikedPostsList user={user} isOwner={isOwner} />}
        {isOwner && <CollectionsList user={user} isOwner={isOwner} />}
      </Suspense>
    </div>
  );
}
```

example:

```tsx
...
import { Users{{resource}}List } from "./Users{{resource}}List";


export function UserProfileContent({ user, isOwner }: UserProfileContentProps) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<p>Loading...</p>}>
        <UsersPostsList user={user} isOwner={isOwner} />
        <Users{{resource}}List user={user} isOwner={isOwner} />
        {isOwner && <LikedPostsList user={user} isOwner={isOwner} />}
        {isOwner && <CollectionsList user={user} isOwner={isOwner} />}
      </Suspense>
    </div>
  );
}
```

## part 19 | extending admin dashboard

## step 1 make columns.tsx for upcoming data table component

`web/src/components/pages/admin/{{resource}}/columns.tsx`

```tsx
"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { {{resource}} } from "@/features/admin/{{resource}}/types/{{resource}}";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  useAdminDelete{{resource}},
  useAdminRestore{{resource}},
} from "@/features/admin/{{resource}}/hooks";
import { useRouter } from "next/navigation";
import { SortableHeader } from "@/components/table/SortableHeader";
import { TextPreviewCell } from "@/components/table/TextPreviewCell";
import { formatDate } from "@/lib/utils/date";
import { AdminEdit{{resource}}Modal } from "@/features/admin/{{resource}}/components/modal/AdminEdit{{resource}}Modal";
import { useModal } from "@/components/providers/ModalProvider";
import { AppImage } from "@/components/ui/AppImage"; // omit me if not using image

export const columns: ColumnDef<{{resource}}>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
    cell: ({ row }) => {
      const {{resource}} = row.original;
      const id = String(row.getValue("id"));

      if ({{resource}}.deleted) {
        const date = String({{resource}}.deletedAt);
        const formatted = formatDate(date);

        return (
          <div className="flex items-center gap-2">
            <span>{id}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Trash2 className="h-4 w-4 text-muted-foreground opacity-60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Deleted at {formatted}</TooltipContent>
            </Tooltip>
          </div>
        );
      }

      return <div>{id}</div>;
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("title") as string) ?? ""}
        title="Title"
      />
    ),
  },
  // omit me if no image
  {
    accessorKey: "imagePath",
    header: "Image",
    cell: ({ row }) => {
      const {{resource}} = row.original;
      if (!{{resource}}.imagePath) {
        return <div className="text-xs text-muted-foreground">No image</div>;
      }
      return (
        <AppImage
          src={{{resource}}.imagePath}
          alt={{{resource}}.title}
          className="h-16 w-16 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
          expandable
        />
      );
    },
  },
  // EoF Omit
  {
    accessorKey: "content",
    header: ({ column }) => <SortableHeader column={column} label="Content" />,
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("content") as string) ?? ""}
        title="Content"
      />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
  },
  {
    accessorKey: "creator.username",
    header: ({ column }) => <SortableHeader column={column} label="Username" />,
    cell: ({ row }) => {
      const username: string = row.original.creator.username;
      const avatarPath: string | null = row.original.creator.avatarPath;

      return (
        <div className="flex gap-1 items-center">
          <Avatar className="h-8 w-8">
            {avatarPath && <AvatarImage src={avatarPath} alt={username} />}
            <AvatarFallback>{username[0]}</AvatarFallback>
          </Avatar>
          <p>{username}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Created At" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("createdAt"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "deleted",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const {{resource}} = row.original;
      if ({{resource}}.deleted) {
        const date = String({{resource}}.deletedAt);
        const formatted = formatDate(date);

        return <div>Deleted at {formatted}</div>;
      } else {
        return <div>Active</div>;
      }
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const {{resource}} = row.original;
      const router = useRouter();
      const restore{{resource}} = useAdminRestore{{resource}}();
      const delete{{resource}} = useAdminDelete{{resource}}();
      const { openModal } = useModal();

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            {{{resource}}.deleted ? (
              <div>
                <DropdownMenuItem
                  onClick={() => {
                    openModal({
                      title: "Edit data for " + row.original.title,
                      content: <AdminEdit{{resource}}Modal data={row.original} />,
                    });
                  }}
                >
                  Edit {{resource}}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    restore{{resource}}.mutate({{resource}}.id);
                  }}
                >
                  Restore {{resource}}
                </DropdownMenuItem>
              </div>
            ) : (
              <div>
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/{{resource}}/${{{resource}}.id}`);
                  }}
                >
                  View {{resource}}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    openModal({
                      title: "Edit data for " + row.original.title,
                      content: <AdminEdit{{resource}}Modal data={row.original} />,
                    });
                  }}
                >
                  Edit {{resource}}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    delete{{resource}}.mutate({{resource}}.id);
                  }}
                >
                  Delete {{resource}}
                </DropdownMenuItem>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
```

example:
`web/src/components/pages/admin/articles/columns.tsx`

```tsx
"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { Article } from "@/features/admin/articles/types/article";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  useAdminDeleteArticle,
  useAdminRestoreArticle,
} from "@/features/admin/articles/hooks";
import { useRouter } from "next/navigation";
import { SortableHeader } from "@/components/table/SortableHeader";
import { TextPreviewCell } from "@/components/table/TextPreviewCell";
import { formatDate } from "@/lib/utils/date";
import { AdminEditArticleModal } from "@/features/admin/articles/components/modal/AdminEditArticleModal";
import { useModal } from "@/components/providers/ModalProvider";
import { AppImage } from "@/components/ui/AppImage"; // omit me if not using image

export const columns: ColumnDef<Article>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
    cell: ({ row }) => {
      const article = row.original;
      const id = String(row.getValue("id"));

      if (article.deleted) {
        const date = String(article.deletedAt);
        const formatted = formatDate(date);

        return (
          <div className="flex items-center gap-2">
            <span>{id}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Trash2 className="h-4 w-4 text-muted-foreground opacity-60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Deleted at {formatted}</TooltipContent>
            </Tooltip>
          </div>
        );
      }

      return <div>{id}</div>;
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("title") as string) ?? ""}
        title="Title"
      />
    ),
  },
  // omit me if no image
  {
    accessorKey: "imagePath",
    header: "Image",
    cell: ({ row }) => {
      const article = row.original;
      if (!article.imagePath) {
        return <div className="text-xs text-muted-foreground">No image</div>;
      }
      return (
        <AppImage
          src={article.imagePath}
          alt={article.title}
          className="h-16 w-16 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
          expandable
        />
      );
    },
  },
  // EoF Omit
  {
    accessorKey: "content",
    header: ({ column }) => <SortableHeader column={column} label="Content" />,
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("content") as string) ?? ""}
        title="Content"
      />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
  },
  {
    accessorKey: "creator.username",
    header: ({ column }) => <SortableHeader column={column} label="Username" />,
    cell: ({ row }) => {
      const username: string = row.original.creator.username;
      const avatarPath: string | null = row.original.creator.avatarPath;

      return (
        <div className="flex gap-1 items-center">
          <Avatar className="h-8 w-8">
            {avatarPath && <AvatarImage src={avatarPath} alt={username} />}
            <AvatarFallback>{username[0]}</AvatarFallback>
          </Avatar>
          <p>{username}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Created At" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("createdAt"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "deleted",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const article = row.original;
      if (article.deleted) {
        const date = String(article.deletedAt);
        const formatted = formatDate(date);

        return <div>Deleted at {formatted}</div>;
      } else {
        return <div>Active</div>;
      }
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const article = row.original;
      const router = useRouter();
      const restoreArticle = useAdminRestoreArticle();
      const deleteArticle = useAdminDeleteArticle();
      const { openModal } = useModal();

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            {article.deleted ? (
              <div>
                <DropdownMenuItem
                  onClick={() => {
                    openModal({
                      title: "Edit data for " + row.original.title,
                      content: <AdminEditArticleModal data={row.original} />,
                    });
                  }}
                >
                  Edit article
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    restoreArticle.mutate(article.id);
                  }}
                >
                  Restore article
                </DropdownMenuItem>
              </div>
            ) : (
              <div>
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/article/${article.id}`);
                  }}
                >
                  View article
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    openModal({
                      title: "Edit data for " + row.original.title,
                      content: <AdminEditArticleModal data={row.original} />,
                    });
                  }}
                >
                  Edit article
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    deleteArticle.mutate(article.id);
                  }}
                >
                  Delete article
                </DropdownMenuItem>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
```

## step 2 make {{resource}}DataTable.tsx

`web/src/components/pages/admin/{{resource}}/{{resource}}DataTable.tsx`

```tsx
"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { useAdmin{{resource}}Offset } from "@/features/admin/{{resource}}/hooks";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { useSearchParams } from "next/navigation";

const DEFAULT_LIMIT = 4;

export function {{resource}}DataTable() {
  // Parse page and limit from search params
  const searchParams = useSearchParams();

  // Get page from query params
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading, error } = useAdmin{{resource}}Offset(
    page,
    DEFAULT_LIMIT,
  );

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  if (error || !data) {
    return (
      <div>Something went wrong. could not pull {{resource}}. {error?.message}</div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data.items} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/{{resource}}"
          page={page}
          limit={DEFAULT_LIMIT}
          totalItems={data.pageInfo.totalItems}
        />
      </div>
    </div>
  );
}
```

example:
`web/src/components/pages/admin/articles/ArticleDataTable.tsx`

```tsx
"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { useAdminArticlesOffset } from "@/features/admin/articles/hooks";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { useSearchParams } from "next/navigation";

const DEFAULT_LIMIT = 4;

export function ArticleDataTable() {
  // Parse page and limit from search params
  const searchParams = useSearchParams();

  // Get page from query params
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading, error } = useAdminArticlesOffset(
    page,
    DEFAULT_LIMIT,
  );

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  if (error || !data) {
    return (
      <div>Something went wrong. could not pull articles. {error?.message}</div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data.items} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/articles"
          page={page}
          limit={DEFAULT_LIMIT}
          totalItems={data.pageInfo.totalItems}
        />
      </div>
    </div>
  );
}
```

## step 3 make page component

`web/src/components/pages/admin/{{resource}}/Admin{{resource}}Page.tsx`

```tsx
import { {{resource}}DataTable } from "./{{resource}}DataTable";

export function Admin{{resource}}Page() {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <p>admin {{resource}} page here</p>
      <{{resource}}DataTable />
    </div>
  );
}
```

example:
`web/src/components/pages/admin/articles/AdminArticlePage.tsx`

```tsx
import { ArticleDataTable } from "./ArticleDataTable";

export function AdminArticlePage() {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <p>admin article page here</p>
      <ArticleDataTable />
    </div>
  );
}
```

## step 4 make app admin page

`web/src/app/(admin)/admin/{{resource}}/page.tsx`

```tsx
import { Admin{{resource}}Page } from "@/components/pages/admin/{{resource}}/Admin{{resource}}Page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "{{resource}}",
};

export default function page() {
  return <Admin{{resource}}Page />;
}
```

example:
`web/src/app/(admin)/admin/articles/page.tsx`

```tsx
import { AdminArticlePage } from "@/components/pages/admin/articles/AdminArticlePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles",
};

export default function page() {
  return <AdminArticlePage />;
}
```

## step 5 add new resource to sidebar

Inside `web/src/components/layout/admin/Sidebar.tsx` append to Menu items list a new object for resource. Feel free to pick lucide icon to represent resource.

```tsx
// Menu items.
export const items = [
  ...{
    title: "{{resource}}",
    url: "/admin/{{resource}}",
    icon: Newspaper,
  },
];
```

example:

```tsx
// Menu items.
export const items = [
  ...{
    title: "Articles",
    url: "/admin/articles",
    icon: Newspaper,
  },
];
```

## step 6 add to admin stats type {{resource}}

`web/src/features/admin/types/stats.ts`

```tsx
export interface {{resource}}tats {
  total: number;
  active: number;
  byStatus: {
    draft: number;
    published: number;
    archived: number;
    scheduled: number;
  };
  deleted: number;
  deletionRate: number;
}

export interface DashboardStats {
  system: SystemStats;
  users: UserStats;
  posts: PostStats;
  {{resource}}: {{resource}}tats;
  timestamp: string;
}
```

example:

```tsx
export interface ArticleStats {
  total: number;
  active: number;
  byStatus: {
    draft: number;
    published: number;
    archived: number;
    scheduled: number;
  };
  deleted: number;
  deletionRate: number;
}

export interface DashboardStats {
  system: SystemStats;
  users: UserStats;
  posts: PostStats;
  articles: ArticleStats;
  timestamp: string;
}
```

## step 7 make {{resource}} stats widget

change lucide icon to something more appropriate

`web/src/components/pages/admin/dashboard/widgets/{{resource}}StatsWidget.tsx`

```tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  FileEdit,
  CheckCircle2,
  Archive,
  Clock,
  XCircle,
} from "lucide-react";
import { {{resource}}tats } from "@/features/admin/types";

interface {{resource}}StatsWidgetProps {
  data?: {{resource}}tats;
}

export function {{resource}}StatsWidget({ data }: {{resource}}StatsWidgetProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <BookOpen className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total {{resource}}</p>
            <p className="text-2xl font-bold">{data?.total ?? 0}</p>
          </div>
        </div>
        <Badge variant="outline" className="ml-auto">
          Active: {data?.active ?? 0}
        </Badge>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Draft</span>
          </div>
          <span className="font-semibold">{data?.byStatus.draft ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm">Published</span>
          </div>
          <span className="font-semibold">{data?.byStatus.published ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Archived</span>
          </div>
          <span className="font-semibold">{data?.byStatus.archived ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Scheduled</span>
          </div>
          <span className="font-semibold">{data?.byStatus.scheduled ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">Deleted</span>
          </div>
          <span className="font-semibold">{data?.deleted ?? 0}</span>
        </div>

        {data?.total ? (
          <div className="pt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Deletion Rate</span>
              <span>{data.deletionRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${data.deletionRate}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
```

example:
`web/src/components/pages/admin/dashboard/widgets/ArticlesStatsWidget.tsx`

```tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  FileEdit,
  CheckCircle2,
  Archive,
  Clock,
  XCircle,
} from "lucide-react";
import { ArticleStats } from "@/features/admin/types";

interface ArticlesStatsWidgetProps {
  data?: ArticleStats;
}

export function ArticlesStatsWidget({ data }: ArticlesStatsWidgetProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <BookOpen className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Articles</p>
            <p className="text-2xl font-bold">{data?.total ?? 0}</p>
          </div>
        </div>
        <Badge variant="outline" className="ml-auto">
          Active: {data?.active ?? 0}
        </Badge>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Draft</span>
          </div>
          <span className="font-semibold">{data?.byStatus.draft ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm">Published</span>
          </div>
          <span className="font-semibold">{data?.byStatus.published ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Archived</span>
          </div>
          <span className="font-semibold">{data?.byStatus.archived ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Scheduled</span>
          </div>
          <span className="font-semibold">{data?.byStatus.scheduled ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">Deleted</span>
          </div>
          <span className="font-semibold">{data?.deleted ?? 0}</span>
        </div>

        {data?.total ? (
          <div className="pt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Deletion Rate</span>
              <span>{data.deletionRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${data.deletionRate}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
```

## step 8 add to admin dashboard page

`web/src/components/pages/admin/dashboard/AdminDashboardPage.tsx`

```tsx
import { {{resource}}StatsWidget } from "./widgets/{{resource}}StatsWidget";
...

if (isLoading) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 md:grid-cols-2">
      {/* for each widget add a skeleton */}
        <Skeleton className="h-80 md:col-span-2" /> {/*system stats*/}
        <Skeleton className="h-64" /> {/*user stats*/}
        <Skeleton className="h-64" /> {/*post stats*/}
        <Skeleton className="h-64" /> {/*{{resource}} stats*/}
      </div>
    </div>
  );
}
...
<div className="grid gap-6 md:grid-cols-2">
  <SystemStatsWidget data={data?.system} />
  <UsersStatsWidget data={data?.users} />
  <PostsStatsWidget data={data?.posts} />
  <{{resource}}StatsWidget data={data?.{{resource}}} />
  <RecentActivityWidget />
</div>
```

more context example:

```tsx
"use client";

import { useStats } from "@/features/admin/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersStatsWidget } from "./widgets/UsersStatsWidget";
import { PostsStatsWidget } from "./widgets/PostsStatsWidget";
import { ArticlesStatsWidget } from "./widgets/ArticlesStatsWidget";
import { SystemStatsWidget } from "./widgets/SystemStatsWidget";
import { RecentActivityWidget } from "./widgets/RecentActivityWidget";

export function AdminDashboardPage() {
  const { data, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          {/* for each widget add a skeleton */}
          <Skeleton className="h-80 md:col-span-2" /> {/*system stats*/}
          <Skeleton className="h-64" /> {/*user stats*/}
          <Skeleton className="h-64" /> {/*post stats*/}
          <Skeleton className="h-64" /> {/*article stats*/}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform's statistics and activity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SystemStatsWidget data={data?.system} />
        <UsersStatsWidget data={data?.users} />
        <PostsStatsWidget data={data?.posts} />
        <ArticlesStatsWidget data={data?.articles} />
        <RecentActivityWidget />
      </div>
    </div>
  );
}
```

# part 20 | search feature

## update api related files to have search

### step 1 update api.ts to query search endpoint (offset)

`web/src/features/{{resource}}/api.ts`

```ts
// GET /{{resource}}?query=world&limit=5&offset=10
export const search{{resource}}Offset = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  statuses,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  statuses?: string;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (statuses) searchParams.statuses = statuses;

  return fetcher<{{resource}}List>("/{{resource}}", {
    searchParams,
  });
};
```

example:
`web/src/features/articles/api.ts`

```ts
// GET /articles?query=world&limit=5&offset=10
export const searchArticlesOffset = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  statuses,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  statuses?: string;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (statuses) searchParams.statuses = statuses;

  return fetcher<ArticlesList>("/articles", {
    searchParams,
  });
};
```

### step 2 search endpoint cursor variant (optional)

```ts
// GET /{{resource}}/cursor?query=world&limit=5&cursor=abc123
export const search{{resource}}Cursor = ({
  query,
  limit,
  cursor,
  searchFields,
  sort,
  caseSensitive,
  statuses,
}: {
  query?: string;
  limit: number;
  cursor?: string | null;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  statuses?: string;
}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
  };
  if (query) searchParams.query = query;
  if (cursor) searchParams.cursor = cursor;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (statuses) searchParams.statuses = statuses;

  return fetcher<{{resource}}ListCursor>("/{{resource}}/cursor", { searchParams });
};
```

example:

```ts
// GET /articles/cursor?query=world&limit=5&cursor=abc123
export const searchArticlesCursor = ({
  query,
  limit,
  cursor,
  searchFields,
  sort,
  caseSensitive,
  statuses,
}: {
  query?: string;
  limit: number;
  cursor?: string | null;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  statuses?: string;
}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
  };
  if (query) searchParams.query = query;
  if (cursor) searchParams.cursor = cursor;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (statuses) searchParams.statuses = statuses;

  return fetcher<ArticleListCursor>("/articles/cursor", { searchParams });
};
```

### step 3 search suggest api (optional)

```ts
// GET /{{resource}}/search/suggest?q=hello&limit=5
export const fetch{{resource}}uggestions = (q: string, limit: number = 5) => {
  if (!q) return Promise.resolve([]);

  return fetcher<{{resource}}[]>("/{{resource}}/search/suggest", {
    searchParams: { q, limit },
  });
};
```

example:

```ts
// GET /articles/search/suggest?q=hello&limit=5
export const fetchArticleSuggestions = (q: string, limit: number = 5) => {
  if (!q) return Promise.resolve([]);

  return fetcher<Article[]>("/articles/search/suggest", {
    searchParams: { q, limit },
  });
};
```

### step 4 import search to hooks.ts

`web/src/features/{{resource}}/hooks.ts`

```ts
import {
  ...
  search{{resource}}Offset,
  search{{resource}}Cursor,
  fetch{{resource}}Suggestions,
} from "./api";
```

example:
`web/src/features/articles/hooks.ts`

```ts
import {
  ...
  searchArticlesOffset,
  searchArticlesCursor,
  fetchArticleSuggestions,
} from "./api";
```

### step 5 search hook (offset)

```ts
// commented out as its redundant now. replaced by search
// export function useArticlesOffset(page: number, limit: number) {
//   const offset = (page - 1) * limit;

//   return useQuery({
//     queryKey: ["articles", page],
//     queryFn: () => fetchArticlesOffset({ limit, offset }),
//   });
// }

export function useArticlesOffset(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    statuses?: string;
    [key: string]: any;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "articles",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.statuses,
    ],
    queryFn: () =>
      searchArticlesOffset({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        statuses: options?.statuses,
      }),
  });
}
```

example:

```ts
// commented out as its redundant now. replaced by search
// export function use{{resource}}Offset(page: number, limit: number) {
//   const offset = (page - 1) * limit;

//   return useQuery({
//     queryKey: ["{{resource}}", page],
//     queryFn: () => fetch{{resource}}Offset({ limit, offset }),
//   });
// }

export function use{{resource}}Offset(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    statuses?: string;
    [key: string]: any;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "{{resource}}",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.statuses,
    ],
    queryFn: () =>
      search{{resource}}Offset({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        statuses: options?.statuses,
      }),
  });
}
```

### step 6 search hook (cursor) (optional)

```ts
export function use{{resource}}Cursor(
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    statuses?: string;
    [key: string]: any;
  },
) {
  return useInfiniteQuery({
    queryKey: [
      "{{resource}}",
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.statuses,
    ],
    queryFn: ({ pageParam }) =>
      search{{resource}}Cursor({
        query,
        limit,
        cursor: pageParam ?? null,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        statuses: options?.statuses,
      }),

    // pageParam = nextCursor from backend
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
  });
}
```

example:

```ts
export function useArticlesCursor(
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    statuses?: string;
    [key: string]: any;
  },
) {
  return useInfiniteQuery({
    queryKey: [
      "articles",
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.statuses,
    ],
    queryFn: ({ pageParam }) =>
      searchArticlesCursor({
        query,
        limit,
        cursor: pageParam ?? null,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        statuses: options?.statuses,
      }),

    // pageParam = nextCursor from backend
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
  });
}
```

### step 7 search suggest hook (optional)

```ts
export function use{{resource}}Suggestions(q: string, limit: number = 5) {
  return useQuery({
    queryKey: ["{{resource}}-suggestions", q],
    queryFn: () => fetch{{resource}}Suggestions(q, limit),
    enabled: !!q,
  });
}
```

example:

```ts
export function useArticleSuggestions(q: string, limit: number = 5) {
  return useQuery({
    queryKey: ["article-suggestions", q],
    queryFn: () => fetchArticleSuggestions(q, limit),
    enabled: !!q,
  });
}
```

### step 8 update admin api.ts to query search endpoint (offset)

`web/src/features/admin/{{resource}}/api.ts`

```ts
// GET /admin/{{resource}}?query=world&limit=5&offset=10
export const searchAdmin{{resource}}Offset = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  statuses,
  availability,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  statuses?: string;
  availability?: string;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (statuses) searchParams.statuses = statuses;
  if (availability) searchParams.availability = availability;

  return fetcher<{{resource}}List>("/admin/{{resource}}", {
    searchParams,
  });
};
```

example:
`web/src/features/admin/articles/api.ts`

```ts
// GET /admin/articles?query=world&limit=5&offset=10
export const searchAdminArticlesOffset = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  statuses,
  availability,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  statuses?: string;
  availability?: string;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (statuses) searchParams.statuses = statuses;
  if (availability) searchParams.availability = availability;

  return fetcher<ArticlesList>("/admin/articles", {
    searchParams,
  });
};
```

### step 9 import search to admin hooks.ts

`web/src/features/admin/{{resource}}/hooks.ts`

```ts
import {
  ...
  searchAdmin{{resource}}Offset,
} from "./api";

// commented out as its redundant now. replaced by search
// export function useAdmin{{resource}}Offset(page: number, limit: number) {
//   const offset = (page - 1) * limit;

//   return useQuery({
//     queryKey: ["admin-{{resource}}", page],
//     queryFn: () => fetchAdmin{{resource}}Offset({ limit, offset }),
//   });
// }

export function useAdmin{{resource}}Offset(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    statuses?: string;
    availability?: string;
    [key: string]: any;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "admin-{{resource}}",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.statuses,
      options?.availability,
    ],
    queryFn: () =>
      searchAdmin{{resource}}Offset({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        statuses: options?.statuses,
        availability: options?.availability,
      }),
  });
}
```

example:
`web/src/features/admin/articles/hooks.ts`

```ts
import {
  ...
  searchAdminArticlesOffset,
} from "./api";

// commented out as its redundant now. replaced by search
// export function useAdminArticlesOffset(page: number, limit: number) {
//   const offset = (page - 1) * limit;

//   return useQuery({
//     queryKey: ["admin-articles", page],
//     queryFn: () => fetchAdminArticlesOffset({ limit, offset }),
//   });
// }

export function useAdminArticlesOffset(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    statuses?: string;
    availability?: string;
    [key: string]: any;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "admin-articles",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.statuses,
      options?.availability,
    ],
    queryFn: () =>
      searchAdminArticlesOffset({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        statuses: options?.statuses,
        availability: options?.availability,
      }),
  });
}
```

## search bar component

### step 1 make search config

will most likely need human input on how to go about this since for advance searches there may fields that have toggle/boolean or advance multi-searches.
anyways the gist of how to make filters in search-config.ts is:

- **checkbox (multi-filter enum)**

```ts
{
  type: "checkbox",
  name: "searchFields",
  label: "my search in",
  options: [
    { value: "foo", label: "Foo" },
    { value: "bar.baz", label: "Bar + baz" },
    ],
},
```

- **radio buttons (single select enum)**

```ts
{
  type: "radio",
  name: "foo",
  label: "Filter by Foo",
  options: [
    { value: "bar", label: "Bar!" },
    { value: "baz", label: "baz..." },
  ],
},
```

- **toggle (boolean)**

```ts
{
  type: "toggle",
  name: "deleted",
  label: "Deleted",
},
```

`web/src/features/articles/types/search-config.ts`

```ts
import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const articleSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "title", label: "Title" },
      { value: "content", label: "Content" },
      { value: "creator.username", label: "Creator" },
    ],
  },
  {
    // filter if you want multi select enum
    type: "checkbox",
    name: "statuses",
    label: "Status",
    options: [
      { value: "DRAFT", label: "Draft" },
      { value: "PUBLISHED", label: "Published" },
      { value: "ARCHIVED", label: "Archived" },
      { value: "SCHEDULED", label: "Scheduled" },
    ],
  },
  // Alternative filter if you want single select enum
  // {
  //   type: "radio-combobox",
  //   name: "statuses",
  //   label: "Filter by status",
  //   options: [
  //     { value: "DRAFT", label: "Draft" },
  //     { value: "PUBLISHED", label: "Published" },
  //     { value: "ARCHIVED", label: "Archived" },
  //     { value: "SCHEDULED", label: "Scheduled" },
  //   ],
  // },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
];

export const articleSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
];
```

example:
`web/src/features/{{resource}}/types/search-config.ts`

```ts
import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const {{resource}}earchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "title", label: "Title" },
      { value: "content", label: "Content" },
      { value: "creator.username", label: "Creator" },
    ],
  },
  {
    // filter if you want multi select enum
    type: "checkbox",
    name: "statuses",
    label: "Status",
    options: [
      { value: "DRAFT", label: "Draft" },
      { value: "PUBLISHED", label: "Published" },
      { value: "ARCHIVED", label: "Archived" },
      { value: "SCHEDULED", label: "Scheduled" },
    ],
  },
  // Alternative filter if you want single select enum
  // {
  //   type: "radio-combobox",
  //   name: "statuses",
  //   label: "Filter by status",
  //   options: [
  //     { value: "DRAFT", label: "Draft" },
  //     { value: "PUBLISHED", label: "Published" },
  //     { value: "ARCHIVED", label: "Archived" },
  //     { value: "SCHEDULED", label: "Scheduled" },
  //   ],
  // },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
];

export const {{resource}}SearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
];
```

### step 2 add search params type to `search-params.ts`

update `web/src/types/search-params.ts` to have new resource search param variant

```ts
export interface PublicArticleSearchParams extends SearchParams {
  statuses?: string;
}
```

example:

```ts
export interface Public{{resource}}SearchParams extends SearchParams {
  statuses?: string;
}
```

if you don't have advance searches like toggle or enum, then it can simply just be

```ts
export interface PublicArticleSearchParams extends SearchParams {}
```

example:

```ts
export interface Public{{resource}}SearchParams extends SearchParams {}
```

### step 3 make admin variant of search config

`web/src/features/admin/{{resource}}/types/search-config.ts`

```ts
import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const admin{{resource}}earchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "title", label: "Title" },
      { value: "content", label: "Content" },
      { value: "creator.username", label: "Creator" },
    ],
  },
  {
    // filter if you want multi select enum
    type: "checkbox",
    name: "statuses",
    label: "Status",
    options: [
      { value: "DRAFT", label: "Draft" },
      { value: "PUBLISHED", label: "Published" },
      { value: "ARCHIVED", label: "Archived" },
      { value: "SCHEDULED", label: "Scheduled" },
    ],
  },
  // Alternative filter if you want single select enum
  // {
  //   type: "radio-combobox",
  //   name: "statuses",
  //   label: "Filter by status",
  //   options: [
  //     { value: "DRAFT", label: "Draft" },
  //     { value: "PUBLISHED", label: "Published" },
  //     { value: "ARCHIVED", label: "Archived" },
  //     { value: "SCHEDULED", label: "Scheduled" },
  //   ],
  // },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
  {
    type: "toggle",
    name: "deleted",
    label: "Deleted",
  },
  {
    type: "radio-combobox",
    name: "availability",
    label: "Filter By Availability",
    options: [
      { value: "ALL", label: "All" },
      { value: "ACTIVE", label: "Active" },
      { value: "DELETED", label: "DELETED" },
    ],
  },
];

export const admin{{resource}}SearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
];
```

example:
`web/src/features/admin/articles/types/search-config.ts`

```ts
import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const adminArticleSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "title", label: "Title" },
      { value: "content", label: "Content" },
      { value: "creator.username", label: "Creator" },
    ],
  },
  {
    // filter if you want multi select enum
    type: "checkbox",
    name: "statuses",
    label: "Status",
    options: [
      { value: "DRAFT", label: "Draft" },
      { value: "PUBLISHED", label: "Published" },
      { value: "ARCHIVED", label: "Archived" },
      { value: "SCHEDULED", label: "Scheduled" },
    ],
  },
  // Alternative filter if you want single select enum
  // {
  //   type: "radio-combobox",
  //   name: "statuses",
  //   label: "Filter by status",
  //   options: [
  //     { value: "DRAFT", label: "Draft" },
  //     { value: "PUBLISHED", label: "Published" },
  //     { value: "ARCHIVED", label: "Archived" },
  //     { value: "SCHEDULED", label: "Scheduled" },
  //   ],
  // },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
  {
    type: "toggle",
    name: "deleted",
    label: "Deleted",
  },
  {
    type: "radio-combobox",
    name: "availability",
    label: "Filter By Availability",
    options: [
      { value: "ALL", label: "All" },
      { value: "ACTIVE", label: "Active" },
      { value: "DELETED", label: "DELETED" },
    ],
  },
];

export const adminArticleSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
];
```

### step 4 add admin search params type to `search-params.ts`

`web/src/types/search-params.ts`

```ts
export interface Admin{{resource}}SearchParams extends SearchParams {
  status?: string;
  deleted?: string;
}
```

example:

```ts
export interface AdminArticleSearchParams extends SearchParams {
  status?: string;
  deleted?: string;
}
```

### step 5 make search bar component

heads up that `basePath` is where to redirect URL (AKA search results page). in my example im making `/article` my frontend URL for normal lookup as well as search results page. figured i'd tell you about this in case you want a dedicated search results page like `/article/search-results`

if you skipped/omitted search suggest just remove the props for `useSuggestions`,`renderSuggestion`, and `onNavigateTo`. it will simply just be

```tsx
<SearchBar<Article>
  placeholder="Search articles..."
  queryParam="q"
  basePath={basePath}
/>
```

`web/src/features/{{resource}}/components/{{resource}}SearchBar.tsx`

```tsx
"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import { use{{resource}}Suggestions } from "@/features/{{resource}}/hooks";
import {
  {{resource}}SearchFilters,
  {{resource}}SearchSorts,
} from "@/features/{{resource}}/types/search-config";
import { {{resource}} } from "../types/{{resource}}";

const basePath = "/{{resource}}";

export function {{resource}}SearchBar() {
  return (
    <div className="flex gap-2">
      <SearchBar<{{resource}}>
        placeholder="Search {{resource}}..."
        queryParam="q"
        basePath={basePath}
        useSuggestions={use{{resource}}Suggestions}
        renderSuggestion={({{resource}}) => ({
          title: {{resource}}.title,
          subtitle: {{resource}}.content.substring(0, 60) + "...",
          image: {{resource}}.imagePath ?? undefined, // omit if not using image
        })}
        onNavigateTo={({{resource}}) => `{{resource}}/${{{resource}}.id}`}
      />

      <SearchFilterDropdown
        filters={{{resource}}SearchFilters}
        sorts={{{resource}}SearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
```

example
`web/src/features/articles/components/ArticleSearchBar.tsx`

```tsx
"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import { useArticleSuggestions } from "@/features/articles/hooks";
import {
  articleSearchFilters,
  articleSearchSorts,
} from "@/features/articles/types/search-config";
import { Article } from "../types/article";

const basePath = "/article";

export function ArticleSearchBar() {
  return (
    <div className="flex gap-2">
      <SearchBar<Article>
        placeholder="Search articles..."
        queryParam="q"
        basePath={basePath}
        useSuggestions={useArticleSuggestions}
        renderSuggestion={(article) => ({
          title: article.title,
          subtitle: article.content.substring(0, 60) + "...",
          image: article.imagePath ?? undefined, // omit if not using image
        })}
        onNavigateTo={(article) => `article/${article.id}`}
      />

      <SearchFilterDropdown
        filters={articleSearchFilters}
        sorts={articleSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
```

### step 6 make admin search bar component

`web/src/features/{{resource}}/components/{{resource}}SearchBar.tsx`

```tsx
"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  admin{{resource}}SearchFilters,
  admin{{resource}}SearchSorts,
} from "@/features/admin/{{resource}}/types/search-config";
import { {{resource}} } from "../types/{{resource}}";

const basePath = "/admin/{{resource}}";

export function Admin{{resource}}SearchBar() {
  return (
    <div className="flex gap-2">
      <SearchBar<{{resource}}>
        placeholder="Search {{resource}}..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={admin{{resource}}SearchFilters}
        sorts={admin{{resource}}SearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
```

example:
`web/src/features/articles/components/ArticleSearchBar.tsx`

```tsx
"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  adminArticleSearchFilters,
  adminArticleSearchSorts,
} from "@/features/admin/articles/types/search-config";
import { Article } from "../types/article";

const basePath = "/admin/articles";

export function AdminArticleSearchBar() {
  return (
    <div className="flex gap-2">
      <SearchBar<Article>
        placeholder="Search articles..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={adminArticleSearchFilters}
        sorts={adminArticleSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
```

## update paginated list files and pages to have search params prop

in order to make search bar work, need to pass in URL params from `page.tsx`

### step 1 update page.tsx to take in URL params

`web/src/app/(default)/{{resource}}/page.tsx`

```tsx
import { getServerUser } from "@/features/auth/server";
import { Public{{resource}}SearchParams } from "@/types/search-params";
...
export default async function page({
  searchParams,
}: {
  searchParams: Promise<Public{{resource}}SearchParams>;
}) {
  const user = await getServerUser();
  const params = await searchParams;
...
<{{resource}}Page user={user} searchParams={params} />
```

more context example:
`web/src/app/(default)/article/page.tsx`

```tsx
import { ArticlePage } from "@/components/pages/article/ArticlePage";
import type { Metadata } from "next";
import { getServerUser } from "@/features/auth/server";
import { PublicArticleSearchParams } from "@/types/search-params";

export const metadata: Metadata = {
  title: "Articles",
};

export default async function page({
  searchParams,
}: {
  searchParams: Promise<PublicArticleSearchParams>;
}) {
  const user = await getServerUser();
  const params = await searchParams;

  return (
    <div>
      <ArticlePage user={user} searchParams={params} />
    </div>
  );
}
```

### step 2 update {{resource}} page to take in search params

`web/src/components/pages/{{resource}}/{{resource}}Page.tsx`

```tsx
import { User } from "@/features/users/types/user";
import { {{resource}}SearchBar } from "@/features/{{resource}}/components/{{resource}}SearchBar";
import { Public{{resource}}SearchParams } from "@/types/search-params";

interface {{resource}}PageProps {
  user: User | null;
  searchParams?: Public{{resource}}SearchParams;
}

export function {{resource}}Page({ user, searchParams }: {{resource}}PageProps) {
  ...
  return (
    <div>
      <{{resource}}SearchBar />
      ...
      <Paginated{{resource}} searchParams={searchParams} />
      {/* <Cursor{{resource}} searchParams={searchParams} /> */}
      {/* <CursorInfinite{{resource}} searchParams={searchParams} /> */}
    </div>
  )
}
```

more context example:
`web/src/components/pages/article/ArticlePage.tsx`

```tsx
"use client";

import { PaginatedArticles } from "./PaginatedArticles";
import { CursorArticles } from "./CursorArticles";
import { CursorInfiniteArticles } from "./CursorInfiniteArticles";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalProvider";
import { CreateArticleModal } from "@/features/articles/components/modal/CreateArticleModal";
import { User } from "@/features/users/types/user";
import { ArticleSearchBar } from "@/features/articles/components/ArticleSearchBar";
import { PublicArticleSearchParams } from "@/types/search-params";

interface ArticlePageProps {
  user: User | null;
  searchParams?: PublicArticleSearchParams;
}

export function ArticlePage({ user, searchParams }: ArticlePageProps) {
  const router = useRouter();

  const { openModal } = useModal();

  return (
    <div>
      <div className="flex justify-center relative items-center h-10 mb-4">
        <ArticleSearchBar />
        {user ? (
          <div>
            <Button
              className="cursor-pointer absolute right-0"
              onClick={() => router.push("/article/create")}
            >
              <Plus /> Article
              {/* test inline forms work. remove this button after test */}
            </Button>
            <Button
              onClick={() => {
                openModal({
                  title: "Create new article",
                  content: <CreateArticleModal />,
                });
              }}
            >
              Create Article
            </Button>
            {/* EoF test */}
          </div>
        ) : (
          ""
        )}
      </div>
      <PaginatedArticles searchParams={searchParams} />
      {/* <CursorArticles searchParams={searchParams} /> */}
      {/* <CursorInfiniteArticles searchParams={searchParams} /> */}
    </div>
  );
}
```

### step 3 update paginated list to take search params

`web/src/components/pages/{{resource}}/Paginated{{resource}}.tsx`

```tsx
"use client";

import { Suspense } from "react";
import { use{{resource}}Offset } from "@/features/{{resource}}/hooks";
import { {{resource}} } from "@/components/ui/{{resource}}";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { useSessionUser } from "@/features/auth/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { Public{{resource}}SearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 4;
interface Paginated{{resource}}Props {
  searchParams?: Public{{resource}}SearchParams;
}

function {{resource}}ListContent({ searchParams }: Paginated{{resource}}Props) {
  const { data: user } = useSessionUser();

  const {
    items: {{resource}},
    totalItems,
    isLoading,
    queryParams,
    emptyMessage,
    page,
  } = usePaginatedSearch({
    searchParams,
    hook: use{{resource}}Offset,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No {{resource}} found matching "${query}". Try a different search term.`
        : "No {{resource}} available.",
  });

  return (
    <PaginatedList
      url="{{resource}}"
      page={page}
      limit={DEFAULT_LIMIT}
      items={{{resource}}}
      totalItems={totalItems}
      isLoading={isLoading}
      renderItem={({{resource}}) => (
        <{{resource}} data={{{resource}}} isOwner={{{resource}}.creator.id === user?.id} />
      )}
      renderSkeleton={() => <PageLoadingState variant="card" />}
      title="{{resource}}"
      layout="flex"
      queryParams={queryParams}
      emptyMessage={emptyMessage}
    />
  );
}

export function Paginated{{resource}}({ searchParams }: Paginated{{resource}}Props) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <{{resource}}ListContent searchParams={searchParams} />
    </Suspense>
  );
}
```

example:
`web/src/components/pages/article/PaginatedArticles.tsx`

```tsx
"use client";

import { Suspense } from "react";
import { useArticlesOffset } from "@/features/articles/hooks";
import { Article } from "@/components/ui/Article";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { useSessionUser } from "@/features/auth/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { PublicArticleSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 4;
interface PaginatedArticlesProps {
  searchParams?: PublicArticleSearchParams;
}

function ArticlesListContent({ searchParams }: PaginatedArticlesProps) {
  const { data: user } = useSessionUser();

  const {
    items: articles,
    totalItems,
    isLoading,
    queryParams,
    emptyMessage,
    page,
  } = usePaginatedSearch({
    searchParams,
    hook: useArticlesOffset,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No articles found matching "${query}". Try a different search term.`
        : "No articles available.",
  });

  return (
    <PaginatedList
      url="article"
      page={page}
      limit={DEFAULT_LIMIT}
      items={articles}
      totalItems={totalItems}
      isLoading={isLoading}
      renderItem={(article) => (
        <Article data={article} isOwner={article.creator.id === user?.id} />
      )}
      renderSkeleton={() => <PageLoadingState variant="card" />}
      title="Articles"
      layout="flex"
      queryParams={queryParams}
      emptyMessage={emptyMessage}
    />
  );
}

export function PaginatedArticles({ searchParams }: PaginatedArticlesProps) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ArticlesListContent searchParams={searchParams} />
    </Suspense>
  );
}
```

### step 4 update cursor list to take search params (optional)

`web/src/components/pages/{{resource}}/Cursor{{resource}}.tsx`

```tsx
"use client";

import { Suspense } from "react";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { {{resource}} } from "@/components/ui/{{resource}}";
import { CursorList } from "@/components/ui/pagination/CursorList";
import { use{{resource}}Cursor } from "@/features/{{resource}}/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { useCursorPaginatedSearch } from "@/hooks/useCursorPaginatedSearch";
import { Public{{resource}}SearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 4;

interface Cursor{{resource}}Props {
  searchParams?: Public{{resource}}SearchParams;
}

function {{resource}}ListContent({ searchParams }: Cursor{{resource}}Props) {
  const { data: user } = useSessionUser();

  const {
    items: {{resource}},
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    emptyMessage,
    fetchNextPage,
  } = useCursorPaginatedSearch({
    searchParams,
    hook: use{{resource}}Cursor,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No {{resource}} found matching "${query}". Try a different search term.`
        : "No {{resource}} available.",
  });

  return (
    <CursorList
      items={{{resource}}}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage?.()}
      renderItem={({{resource}}) => (
        <{{resource}} data={{{resource}}} isOwner={{{resource}}.creator.id === user?.id} />
      )}
      layout="flex"
      title="Cursor {{resource}}"
      renderSkeleton={() => <PageLoadingState variant="card" />}
      emptyMessage={emptyMessage}
    />
  );
}

export function Cursor{{resource}}({ searchParams }: Cursor{{resource}}Props) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <{{resource}}ListContent searchParams={searchParams} />
    </Suspense>
  );
}
```

example:
`web/src/components/pages/article/CursorArticles.tsx`

```tsx
"use client";

import { Suspense } from "react";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { Article } from "@/components/ui/Article";
import { CursorList } from "@/components/ui/pagination/CursorList";
import { useArticlesCursor } from "@/features/articles/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { useCursorPaginatedSearch } from "@/hooks/useCursorPaginatedSearch";
import { PublicArticleSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 4;

interface CursorArticlesProps {
  searchParams?: PublicArticleSearchParams;
}

function ArticlesListContent({ searchParams }: CursorArticlesProps) {
  const { data: user } = useSessionUser();

  const {
    items: articles,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    emptyMessage,
    fetchNextPage,
  } = useCursorPaginatedSearch({
    searchParams,
    hook: useArticlesCursor,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No articles found matching "${query}". Try a different search term.`
        : "No articles available.",
  });

  return (
    <CursorList
      items={articles}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage?.()}
      renderItem={(article) => (
        <Article data={article} isOwner={article.creator.id === user?.id} />
      )}
      layout="flex"
      title="Cursor Articles"
      renderSkeleton={() => <PageLoadingState variant="card" />}
      emptyMessage={emptyMessage}
    />
  );
}

export function CursorArticles({ searchParams }: CursorArticlesProps) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ArticlesListContent searchParams={searchParams} />
    </Suspense>
  );
}
```

### step 5 update cursor list to take search params (optional)

`web/src/components/pages/{{resource}}/CursorInfinite{{resource}}.tsx`

```tsx
"use client";

import { Suspense } from "react";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { {{resource}} } from "@/components/ui/{{resource}}";
import { CursorInfiniteList } from "@/components/ui/pagination/CursorInfiniteList";
import { use{{resource}}Cursor } from "@/features/{{resource}}/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { useCursorPaginatedSearch } from "@/hooks/useCursorPaginatedSearch";
import { Public{{resource}}SearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 4;

interface CursorInfinite{{resource}}Props {
  searchParams?: Public{{resource}}SearchParams;
}

function {{resource}}ListContent({ searchParams }: CursorInfinite{{resource}}Props) {
  const { data: user } = useSessionUser();

  const {
    items: {{resource}},
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    emptyMessage,
    fetchNextPage,
  } = useCursorPaginatedSearch({
    searchParams,
    hook: use{{resource}}Cursor,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No {{resource}} found matching "${query}". Try a different search term.`
        : "No {{resource}} available.",
  });

  return (
    <CursorInfiniteList
      items={{{resource}}}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage?.()}
      renderItem={({{resource}}) => (
        <{{resource}} data={{{resource}}} isOwner={{{resource}}.creator.id === user?.id} />
      )}
      layout="flex"
      title="Infinite {{resource}}"
      renderSkeleton={() => <PageLoadingState variant="card" />}
      emptyMessage={emptyMessage}
    />
  );
}

export function CursorInfinite{{resource}}({
  searchParams,
}: CursorInfinite{{resource}}Props) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <{{resource}}ListContent searchParams={searchParams} />
    </Suspense>
  );
}
```

example:
`web/src/components/pages/article/CursorInfiniteArticles.tsx`

```tsx
"use client";

import { Suspense } from "react";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { Article } from "@/components/ui/Article";
import { CursorInfiniteList } from "@/components/ui/pagination/CursorInfiniteList";
import { useArticlesCursor } from "@/features/articles/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { useCursorPaginatedSearch } from "@/hooks/useCursorPaginatedSearch";
import { PublicArticleSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 4;

interface CursorInfiniteArticlesProps {
  searchParams?: PublicArticleSearchParams;
}

function ArticlesListContent({ searchParams }: CursorInfiniteArticlesProps) {
  const { data: user } = useSessionUser();

  const {
    items: articles,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    emptyMessage,
    fetchNextPage,
  } = useCursorPaginatedSearch({
    searchParams,
    hook: useArticlesCursor,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No articles found matching "${query}". Try a different search term.`
        : "No articles available.",
  });

  return (
    <CursorInfiniteList
      items={articles}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage?.()}
      renderItem={(article) => (
        <Article data={article} isOwner={article.creator.id === user?.id} />
      )}
      layout="flex"
      title="Infinite Articles"
      renderSkeleton={() => <PageLoadingState variant="card" />}
      emptyMessage={emptyMessage}
    />
  );
}

export function CursorInfiniteArticles({
  searchParams,
}: CursorInfiniteArticlesProps) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ArticlesListContent searchParams={searchParams} />
    </Suspense>
  );
}
```

## update admin dashboard related files to have search params prop

### step 1 update data table to have search params

`web/src/components/pages/admin/{{resource}}/{{resource}}DataTable.tsx`

```tsx
"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { useAdmin{{resource}}Offset } from "@/features/admin/{{resource}}/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { Admin{{resource}}SearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 10;

interface {{resource}}DataTableProps {
  searchParams?: Admin{{resource}}SearchParams;
}

export function {{resource}}DataTable({ searchParams }: {{resource}}DataTableProps) {
  const {
    items: {{resource}},
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdmin{{resource}}Offset,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No {{resource}} found matching "${query}". Try a different search term.`
        : "No {{resource}} available.",
  });

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={{{resource}}} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/{{resource}}"
          page={page}
          limit={DEFAULT_LIMIT}
          queryParams={queryParams}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
```

example:
`web/src/components/pages/admin/articles/ArticleDataTable.tsx`

```tsx
"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { useAdminArticlesOffset } from "@/features/admin/articles/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminArticleSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 10;

interface articleDataTableProps {
  searchParams?: AdminArticleSearchParams;
}

export function ArticleDataTable({ searchParams }: articleDataTableProps) {
  const {
    items: articles,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminArticlesOffset,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No articles found matching "${query}". Try a different search term.`
        : "No articles available.",
  });

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={articles} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/articles"
          page={page}
          limit={DEFAULT_LIMIT}
          queryParams={queryParams}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
```

### step 2 update component page to take search params and add admin search bar

`web/src/components/pages/admin/{{resource}}/Admin{{resource}}Page.tsx`

```tsx
import { Admin{{resource}}SearchBar } from "@/features/admin/{{resource}}/components/Admin{{resource}}earchBar";
import { {{resource}}DataTable } from "./{{resource}}DataTable";
import { Admin{{resource}}SearchParams } from "@/types/search-params";

interface Admin{{resource}}PageProps {
  searchParams?: Admin{{resource}}SearchParams;
}

export function Admin{{resource}}Page({ searchParams }: Admin{{resource}}PageProps) {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <Admin{{resource}}SearchBar />
      <{{resource}}DataTable searchParams={searchParams} />
    </div>
  );
}
```

example:
`web/src/components/pages/admin/articles/AdminArticlePage.tsx`

```tsx
import { AdminArticleSearchBar } from "@/features/admin/articles/components/AdminArticleSearchBar";
import { ArticleDataTable } from "./ArticleDataTable";
import { AdminArticleSearchParams } from "@/types/search-params";

interface AdminArticlePageProps {
  searchParams?: AdminArticleSearchParams;
}

export function AdminArticlePage({ searchParams }: AdminArticlePageProps) {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <AdminArticleSearchBar />
      <ArticleDataTable searchParams={searchParams} />
    </div>
  );
}
```

### step 3 update admin page.tsx to have read params

`web/src/app/(admin)/{{resource}}/page.tsx`

```tsx
import { Admin{{resource}}SearchParams } from "@/types/search-params";
import { Admin{{resource}}Page } from "@/components/pages/admin/{{resource}}/Admin{{resource}}Page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "{{resource}}",
};

export default async function page({
  searchParams,
}: {
  searchParams: Promise<Admin{{resource}}SearchParams>;
}) {
  const params = await searchParams;
  return <Admin{{resource}}Page searchParams={params} />;
}
```

example:
`web/src/app/(admin)/articles/page.tsx`

```tsx
import { AdminArticleSearchParams } from "@/types/search-params";
import { AdminArticlePage } from "@/components/pages/admin/articles/AdminArticlePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles",
};

export default async function page({
  searchParams,
}: {
  searchParams: Promise<AdminArticleSearchParams>;
}) {
  const params = await searchParams;
  return <AdminArticlePage searchParams={params} />;
}
```

# part 21 | adding resource actions to frontend

## add resource type

this prerequisite applies to all resource actions in this part
`web/src/types/resource.ts`

```ts
export const RESOURCE_TYPES = {
  POST: "POST",
  COMMENT: "COMMENT",
  ARTICLE: "ARTICLE",
  // VIDEO: "VIDEO",
} as const;
```

## adding likes

> ⚠️ SKIP THIS PART unless human explicitly requested likes.

### step 1 add to {{resource}} type like

`web/features/{{resource}}/types/{{resource}}.ts`

```ts
export interface {{resource}} {
  ...
  likeCount: number;
  likedByMe: boolean;
}
```

example:
`web/features/articles/types/article.ts`

```ts
export interface Article {
  ...
  likeCount: number;
  likedByMe: boolean;
}
```

### step 2 add to api the endpoint {{resource}} liked by user

omit cursor code if not doing cursor
`web/src/features/{{resource}}/api.ts`

```ts
// GET /{{resource}}/liked/:userId?limit=10&offset=0
export const fetch{{resource}}LikedByUser = ({
  userId,
  limit,
  offset,
}: {
  userId: number;
  limit: number;
  offset: number;
}) =>
  fetcher<{{resource}}List>(`/{{resource}}/users/${userId}/liked`, {
    searchParams: { limit, offset },
  });

// GET /{{resource}}/liked/:userId/cursor?limit=10&cursor=abc123
export const fetch{{resource}}LikedByUserCursor = ({
  userId,
  limit,
  cursor,
}: {
  userId: number;
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<{{resource}}ListCursor>(`/{{resource}}/users/${userId}/liked/cursor`, {
    searchParams: { limit, cursor: cursor ?? undefined },
  });
```

example:
`web/src/features/articles/api.ts`

```ts
// GET /articles/liked/:userId?limit=10&offset=0
export const fetchArticleLikedByUser = ({
  userId,
  limit,
  offset,
}: {
  userId: number;
  limit: number;
  offset: number;
}) =>
  fetcher<ArticlesList>(`/articles/users/${userId}/liked`, {
    searchParams: { limit, offset },
  });

// GET /articles/liked/:userId/cursor?limit=10&cursor=abc123
export const fetchArticleLikedByUserCursor = ({
  userId,
  limit,
  cursor,
}: {
  userId: number;
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<ArticleListCursor>(`/articles/users/${userId}/liked/cursor`, {
    searchParams: { limit, cursor: cursor ?? undefined },
  });
```

### step 2 add to hook the like api

omit cursor code if not doing cursor
`web/src/features/{{resource}}/hooks.ts`

```ts
import {
  ...
  fetch{{resource}}LikedByUser,
  fetch{{resource}}LikedByUserCursor,
} from "./api";

export function use{{resource}}LikedByUser(
  userId: number,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["{{resource}}-liked-by-user", userId, page],
    queryFn: () => fetch{{resource}}LikedByUser({ userId, limit, offset }),
    enabled: !!userId,
  });
}

export function use{{resource}}LikedByUserCursor(
  userId: number,
  limit: number = 10,
) {
  return useInfiniteQuery({
    queryKey: ["{{resource}}-liked-by-user", userId],
    queryFn: ({ pageParam }) =>
      fetch{{resource}}LikedByUserCursor({
        userId,
        limit,
        cursor: pageParam ?? null,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!userId,
  });
}
```

example:
`web/src/features/articles/hooks.ts`

```ts
import {
  ...
  fetchArticleLikedByUser,
  fetchArticleLikedByUserCursor,
} from "./api";

export function useArticleLikedByUser(
  userId: number,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["articles-liked-by-user", userId, page],
    queryFn: () => fetchArticleLikedByUser({ userId, limit, offset }),
    enabled: !!userId,
  });
}

export function useArticleLikedByUserCursor(
  userId: number,
  limit: number = 10,
) {
  return useInfiniteQuery({
    queryKey: ["articles-liked-by-user", userId],
    queryFn: ({ pageParam }) =>
      fetchArticleLikedByUserCursor({
        userId,
        limit,
        cursor: pageParam ?? null,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!userId,
  });
}
```

### step 3 add to global like hooks query keys to invalidate

`web/src/features/likes/hooks.ts`

```ts
export function useToggleLike() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: toggleLike,
    onSuccess: () => {
      ...
      // add related query keys from {{resource}}/hooks.ts here
      qc.invalidateQueries({ queryKey: ["{{resource}}"], exact: false });
      qc.invalidateQueries({ queryKey: ["{{resource}}"], exact: false });
      qc.invalidateQueries({ queryKey: ["{{resource}}-by-user"], exact: false });
      qc.invalidateQueries({ queryKey: ["{{resource}}-liked-by-user"], exact: false,
      });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
```

example:
`web/src/features/likes/hooks.ts`

```ts
export function useToggleLike() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: toggleLike,
    onSuccess: () => {
      ...
      // add related query keys from articles/hooks.ts here
      qc.invalidateQueries({ queryKey: ["articles"], exact: false });
      qc.invalidateQueries({ queryKey: ["article"], exact: false });
      qc.invalidateQueries({ queryKey: ["articles-by-user"], exact: false });
      qc.invalidateQueries({ queryKey: ["articles-liked-by-user"], exact: false,
      });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
```

### step 4 update {{resource}} UI component to have like button

`web/src/components/ui/{{resource}}.tsx`

```tsx
import { LikeButton } from "../common/LikeButton";
import { useToggleLike } from "@/features/likes/hooks";
import { RESOURCE_TYPES } from "@/types/resource";
...
const like = useToggleLike();
function handleLike() {
  like.mutateAsync({ resourceType: RESOURCE_TYPES.{{resource}}, resourceId: data.id });
}
...
<LikeButton
  isOwner={isOwner}
  likedByMe={data.likedByMe}
  likeCount={data.likeCount}
  onLike={handleLike}
/>
```

more context example:
`web/src/components/ui/Article.tsx`

```tsx
import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Article as ArticleType } from "@/features/articles/types/article";
import { Trash, PencilLine, Calendar } from "lucide-react";
import { ConfirmModal } from "../modal/ConfirmModal";
import { useModal } from "../providers/ModalProvider";
import { useDeleteArticle } from "@/features/articles/hooks";
import { toast } from "sonner";
import { InlineEditArticleForm } from "@/features/articles/components/InlineEditArticleForm";
import { LikeButton } from "../common/LikeButton";
import { useToggleLike } from "@/features/likes/hooks";
import { RESOURCE_TYPES } from "@/types/resource";

export function Article({
  data,
  isOwner,
  truncateContent = true,
  truncateTitle = true,
}: {
  data: ArticleType;
  isOwner: boolean;
  truncateContent?: boolean;
  truncateTitle?: boolean;
}) {
  const deleteArticle = useDeleteArticle();
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const like = useToggleLike();

  function modifyArticle(isOwner: boolean) {
    if (!isOwner) {
      return;
    } else {
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => router.push(`/article/edit/${data.id}`)}
            title="Edit article"
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          {/* edit inline button below me is for testing purposes, remove me after test */}
          <Button
            onClick={() => {
              openModal({
                title: "edit Article",
                content: <InlineEditArticleForm articleData={data} />,
              });
            }}
            title="edit article"
          >
            edit inline
          </Button>
          {/* EoF test */}
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => {
              openModal({
                title: "Delete Article",
                content: (
                  <ConfirmModal
                    message={`Are you sure you want to delete this article?`}
                    onConfirm={() =>
                      deleteArticle.mutate(data.id, {
                        onSuccess: () => {
                          closeModal();
                          router.push(`/article`);
                        },
                        onError: (error) => {
                          toast.error("Failed to delete article: " + error);
                        },
                      })
                    }
                    variant={"destructive"}
                  />
                ),
              });
            }}
            title="Delete article"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    }
  }

  const formattedDate = new Date(data.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function handleLike() {
    like.mutateAsync({
      resourceType: RESOURCE_TYPES.ARTICLE,
      resourceId: data.id,
    });
  }

  return (
    <Card className="p-3 md:p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2 pb-3 border-b border-border/50">
        <div className="flex-1">
          <h2
            className={`cursor-pointer text-sm md:text-base font-semibold hover:text-blue-500 transition-colors ${truncateTitle ? "line-clamp-2" : ""}`}
            style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
            onClick={() => router.push(`/article/${data.id}`)}
          >
            {data?.title}
          </h2>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">
              {data.status
                ? data.status.charAt(0).toUpperCase() +
                  data.status.slice(1).toLowerCase()
                : "Draft"}
            </span>
          </div>
        </div>
        {modifyArticle(isOwner)}
      </div>
      <p
        className={`text-xs md:text-sm text-foreground my-3 ${truncateContent ? "line-clamp-3" : ""}`}
        style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
      >
        {data?.content}
      </p>
      <div className="flex items-center justify-between gap-2 mt-3 min-w-0">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
          onClick={() => router.push("/user/" + data?.creator.username)}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage
              src={data?.creator.avatarPath}
              alt={data?.creator.username}
            />
            <AvatarFallback className="text-xs">
              {data?.creator.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
            {data?.creator.username}
          </p>
        </div>
        <div className="flex gap-2 items-center text-xs md:text-sm shrink-0">
          <LikeButton
            isOwner={isOwner}
            likedByMe={data.likedByMe}
            likeCount={data.likeCount}
            onLike={handleLike}
          />
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Card>
  );
}
```

### step 5 make component for paginated list of user's liked {{resource}} (optional)

`web/src/components/pages/userProfile/Liked{{resource}}List.tsx`

```tsx
"use client";

import { useState } from "react";
import { use{{resource}}LikedByUser } from "@/features/{{resource}}/hooks";
import { {{resource}} } from "@/components/ui/{{resource}}";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { PublicUser } from "@/features/users/types/user";

interface Liked{{resource}}ListProps {
  user: PublicUser;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

export function Liked{{resource}}List({ user, isOwner }: Liked{{resource}}ListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = use{{resource}}LikedByUser(
    user.id,
    page,
    DEFAULT_LIMIT,
  );

  const {{resource}} = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedListInline
      page={page}
      limit={DEFAULT_LIMIT}
      items={{{resource}}}
      totalItems={totalItems}
      isLoading={isLoading}
      onPageChange={setPage}
      renderItem={({{resource}}) => <{{resource}} data={{{resource}}} isOwner={isOwner} />}
      title={`Liked {{resource}} by ${user.username}`}
      layout="grid"
      emptyMessage="No liked {{resource}} yet."
    />
  );
}
```

example:
`web/src/components/pages/userProfile/LikedArticlesList.tsx`

```tsx
"use client";

import { useState } from "react";
import { useArticleLikedByUser } from "@/features/articles/hooks";
import { Article } from "@/components/ui/Article";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { PublicUser } from "@/features/users/types/user";

interface LikedArticlesListProps {
  user: PublicUser;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

export function LikedArticlesList({ user, isOwner }: LikedArticlesListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useArticleLikedByUser(
    user.id,
    page,
    DEFAULT_LIMIT,
  );

  const articles = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedListInline
      page={page}
      limit={DEFAULT_LIMIT}
      items={articles}
      totalItems={totalItems}
      isLoading={isLoading}
      onPageChange={setPage}
      renderItem={(article) => <Article data={article} isOwner={isOwner} />}
      title={`Liked Articles by ${user.username}`}
      layout="grid"
      emptyMessage="No liked articles yet."
    />
  );
}
```

### step 6 add to user profile context (optional)

this file may not even exist as all examples assume default boilerplate repo. if missing just skip step

`web/src/components/pages/userProfile/UserProfileContent.tsx`

```tsx
import { Liked{{resource}}List } from "./Liked{{resource}}List";
...
export function UserProfileContent({ user, isOwner }: UserProfileContentProps) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<p>Loading...</p>}>
        ...
        <Users{{resource}}List user={user} isOwner={isOwner} />
        {isOwner && <Liked{{resource}}List user={user} isOwner={isOwner} />}
      </Suspense>
    </div>
  );
}
```

example:

```tsx
import { LikedArticlesList } from "./LikedArticlesList";
...
export function UserProfileContent({ user, isOwner }: UserProfileContentProps) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<p>Loading...</p>}>
        ...
        <UsersArticlesList user={user} isOwner={isOwner} />
        {isOwner && <LikedArticlesList user={user} isOwner={isOwner} />}
      </Suspense>
    </div>
  );
}
```

### step 7 add to admin {{resource}} type like count

`web/src/features/admin/{{resource}}/types/{{resource}}.ts`

```ts
export interface {{resource}} {
  ...
  likeCount: number;
}
```

example:
`web/src/features/admin/articles/types/article.ts`

```ts
export interface Article {
  ...
  likeCount: number;
}
```

### step 8 add to the admin {{resource}} column like count

`web/src/components/pages/admin/{{resource}}/columns.tsx`

```tsx
export const columns: ColumnDef<{{resource}}>[] = [
  ...{
    accessorKey: "likeCount",
    header: ({ column }) => <SortableHeader column={column} label="Likes" />,
  },
];
```

example:
`web/src/components/pages/admin/articles/columns.tsx`

```tsx
export const columns: ColumnDef<Article>[] = [
  ...{
    accessorKey: "likeCount",
    header: ({ column }) => <SortableHeader column={column} label="Likes" />,
  },
];
```

## adding views

### step 1 add to {{resource}} type view count

`web/src/features/{{resource}}/types/{{resource}}.ts`

```ts
export interface {{resource}} {
  ...
  viewCount: number;
}
```

example:
`web/src/features/articles/types/article.ts`

```ts
export interface Article {
  ...
  viewCount: number;
}
```

### step 2 add record view hook to {{resource}}Detail.tsx

`web/src/components/pages/article/ArticleDetail.tsx`

```tsx
import { useRecordView } from "@/features/views/hook";
...
// Record view when {{resource}} loads
useEffect(() => {
  if (data?.id) {
    recordView({
      resourceType: "{{resource}}",
      resourceId: data.id,
    });
  }
}, [data?.id, recordView]);
```

more context example:
`web/src/components/pages/article/ArticleDetail.tsx`

```tsx
"use client";

import { Article } from "@/components/ui/Article";
import { useArticleById } from "@/features/articles/hooks";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { PageNotFound } from "@/components/common/PageNotFound";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { User } from "@/features/users/types/user";
import { useRecordView } from "@/features/views/hook";

export function ArticleDetail({ user }: { user: User | undefined }) {
  const params = useParams();
  const articleId = Number(params.id);
  const { data, isLoading, error } = useArticleById(articleId);
  const { mutate: recordView } = useRecordView();
  const isOwner = data?.creator.id === user?.id;

  useEffect(() => {
    document.title = `${data?.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;
  }, [data?.title]);

  // Record view when article loads
  useEffect(() => {
    if (data?.id) {
      recordView({
        resourceType: "ARTICLE",
        resourceId: data.id,
      });
    }
  }, [data?.id, recordView]);

  if (isLoading) {
    return <PageLoadingState variant="card" />;
  }

  if (error || !data) {
    return <PageNotFound title="Article Not Found" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Article
        data={data}
        isOwner={isOwner}
        truncateTitle={false}
        truncateContent={false}
      />
    </div>
  );
}
```

### step 3 add view count to UI component

`web/src/components/ui/{{resource}}.tsx`

```tsx
import { Eye } from "lucide-react";
...
<div className="flex items-center gap-1 text-muted-foreground">
  <Eye className="h-4 w-4" />
  <span>{data.viewCount}</span>
</div>
```

more context example:
`web/src/components/ui/Article.tsx`

```tsx
<div className="flex gap-2 items-center text-xs md:text-sm shrink-0">
  <div className="flex items-center gap-1 text-muted-foreground">
    <Eye className="h-4 w-4" />
    <span>{data.viewCount}</span>
  </div>
  <LikeButton
    isOwner={isOwner}
    likedByMe={data.likedByMe}
    likeCount={data.likeCount}
    onLike={handleLike}
  />
  <Calendar className="h-4 w-4" />
  <span>{formattedDate}</span>
</div>
```

### step 4 add to admin {{resource}} type view count

`web/src/features/admin/{{resource}}/types/{{resource}}.ts`

```ts
export interface {{resource}} {
  ...
  viewCount: number;
}
```

example:
`web/src/features/admin/articles/types/article.ts`

```ts
export interface Article {
  ...
  viewCount: number;
}
```

### step 5 add to the admin {{resource}} column view count

`web/src/components/pages/admin/{{resource}}/columns.tsx`

```tsx
export const columns: ColumnDef<{{resource}}>[] = [
  ...{
    accessorKey: "viewCount",
    header: ({ column }) => <SortableHeader column={column} label="Views" />,
  },
];
```

example:
`web/src/components/pages/admin/articles/columns.tsx`

```tsx
export const columns: ColumnDef<Article>[] = [
  ...{
    accessorKey: "viewCount",
    header: ({ column }) => <SortableHeader column={column} label="Views" />,
  },
];
```

## adding comment

### step 1 add comments component to {{resource}}Detail.tsx

`web/src/components/pages/{{resource}}/{{resource}}Detail.tsx`

```tsx
import { Suspense } from "react";
import { InlineNewCommentForm } from "@/features/comments/components/InlineNewCommentForm";
import { CommentPagInline } from "@/features/comments/components/CommentPagInline";
import { toast } from "sonner";
...
<div className="bg-card rounded-lg p-4">
  <h3 className="font-semibold mb-4">Comments</h3>
  <InlineNewCommentForm
    resourceType="{{resource}}"
    resourceId={data.id}
    onSuccess={() => {
      toast.success("Comment added");
    }}
    isAlwaysOpen={true}
    user={user}
  />
  <div className="mt-10">
    <Suspense>
      <CommentPagInline resourceType="{{resource}}" resourceId={data?.id} />
    </Suspense>
  </div>
</div>
```

more context example:
`web/src/components/pages/article/ArticleDetail.tsx`

```tsx
"use client";

import { Article } from "@/components/ui/Article";
import { useArticleById } from "@/features/articles/hooks";
import { useParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { PageNotFound } from "@/components/common/PageNotFound";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { User } from "@/features/users/types/user";
import { useRecordView } from "@/features/views/hook";
import { InlineNewCommentForm } from "@/features/comments/components/InlineNewCommentForm";
import { CommentPagInline } from "@/features/comments/components/CommentPagInline";
import { toast } from "sonner";
// import { useSessionUser } from "@/features/auth/hooks";

export function ArticleDetail({ user }: { user: User | undefined }) {
  const params = useParams();
  const articleId = Number(params.id);
  const { data, isLoading, error } = useArticleById(articleId);
  const { mutate: recordView } = useRecordView();
  const isOwner = data?.creator.id === user?.id;

  useEffect(() => {
    document.title = `${data?.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;
  }, [data?.title]);

  // Record view when article loads
  useEffect(() => {
    if (data?.id) {
      recordView({
        resourceType: "ARTICLE",
        resourceId: data.id,
      });
    }
  }, [data?.id, recordView]);

  if (isLoading) {
    return <PageLoadingState variant="card" />;
  }

  if (error || !data) {
    return <PageNotFound title="Article Not Found" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Article
        data={data}
        isOwner={isOwner}
        truncateTitle={false}
        truncateContent={false}
      />
      <div className="bg-card rounded-lg p-4">
        <h3 className="font-semibold mb-4">Comments</h3>
        <InlineNewCommentForm
          resourceType="ARTICLE"
          resourceId={data.id}
          onSuccess={() => {
            toast.success("Comment added");
          }}
          isAlwaysOpen={true}
          user={user}
        />
        <div className="mt-10">
          <Suspense>
            <CommentPagInline resourceType="ARTICLE" resourceId={data?.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

### step 2 update admin comments dashboard to include {{resource}} comments

`web/src/features/admin/comments/types/search-config.ts`

```ts
{
  type: "radio-combobox",
  name: "resourceType",
  label: "Filter by resource",
  options: [
    { value: "POST", label: "Post" },
    { value: "COMMENT", label: "Comment" },
    { value: "ARTICLE", label: "Article" },
    // { value: "VIDEO", label: "Video" },
  ],
},
```

## adding collection

### step 1 add Collection button to UI component

`web/src/components/ui/{{resource}}.tsx`

```tsx
import { CollectionButton } from "../common/CollectionButton";
...
<div className="flex gap-2 items-center text-xs md:text-sm shrink-0">
  <div className="flex items-center gap-1 text-muted-foreground">
    <Eye className="h-4 w-4" />
    <span>{data.viewCount}</span>
  </div>
  <LikeButton
    isOwner={isOwner}
    likedByMe={data.likedByMe}
    likeCount={data.likeCount}
    onLike={handleLike}
  />
  <CollectionButton
    resourceId={data.id}
    resourceType={RESOURCE_TYPES.{{resource}}}
  />
  <Calendar className="h-4 w-4" />
  <span>{formattedDate}</span>
</div>
```

more context example:
`web/src/components/ui/Article.tsx`

```tsx
import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Article as ArticleType } from "@/features/articles/types/article";
import { Trash, PencilLine, Calendar, Eye } from "lucide-react";
import { ConfirmModal } from "../modal/ConfirmModal";
import { useModal } from "../providers/ModalProvider";
import { useDeleteArticle } from "@/features/articles/hooks";
import { toast } from "sonner";
import { InlineEditArticleForm } from "@/features/articles/components/InlineEditArticleForm";
import { LikeButton } from "../common/LikeButton";
import { useToggleLike } from "@/features/likes/hooks";
import { RESOURCE_TYPES } from "@/types/resource";
import { CollectionButton } from "../common/CollectionButton";

export function Article({
  data,
  isOwner,
  truncateContent = true,
  truncateTitle = true,
}: {
  data: ArticleType;
  isOwner: boolean;
  truncateContent?: boolean;
  truncateTitle?: boolean;
}) {
  const deleteArticle = useDeleteArticle();
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const like = useToggleLike();

  function modifyArticle(isOwner: boolean) {
    if (!isOwner) {
      return;
    } else {
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => router.push(`/article/edit/${data.id}`)}
            title="Edit article"
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          {/* edit inline button below me is for testing purposes, remove me after test */}
          <Button
            onClick={() => {
              openModal({
                title: "edit Article",
                content: <InlineEditArticleForm articleData={data} />,
              });
            }}
            title="edit article"
          >
            edit inline
          </Button>
          {/* EoF test */}
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => {
              openModal({
                title: "Delete Article",
                content: (
                  <ConfirmModal
                    message={`Are you sure you want to delete this article?`}
                    onConfirm={() =>
                      deleteArticle.mutate(data.id, {
                        onSuccess: () => {
                          closeModal();
                          router.push(`/article`);
                        },
                        onError: (error) => {
                          toast.error("Failed to delete article: " + error);
                        },
                      })
                    }
                    variant={"destructive"}
                  />
                ),
              });
            }}
            title="Delete article"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    }
  }

  const formattedDate = new Date(data.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function handleLike() {
    like.mutateAsync({
      resourceType: RESOURCE_TYPES.ARTICLE,
      resourceId: data.id,
    });
  }

  return (
    <Card className="p-3 md:p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2 pb-3 border-b border-border/50">
        <div className="flex-1">
          <h2
            className={`cursor-pointer text-sm md:text-base font-semibold hover:text-blue-500 transition-colors ${truncateTitle ? "line-clamp-2" : ""}`}
            style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
            onClick={() => router.push(`/article/${data.id}`)}
          >
            {data?.title}
          </h2>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">
              {data.status
                ? data.status.charAt(0).toUpperCase() +
                  data.status.slice(1).toLowerCase()
                : "Draft"}
            </span>
          </div>
        </div>
        {modifyArticle(isOwner)}
      </div>
      <p
        className={`text-xs md:text-sm text-foreground my-3 ${truncateContent ? "line-clamp-3" : ""}`}
        style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
      >
        {data?.content}
      </p>
      <div className="flex items-center justify-between gap-2 mt-3 min-w-0">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
          onClick={() => router.push("/user/" + data?.creator.username)}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage
              src={data?.creator.avatarPath}
              alt={data?.creator.username}
            />
            <AvatarFallback className="text-xs">
              {data?.creator.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
            {data?.creator.username}
          </p>
        </div>
        <div className="flex gap-2 items-center text-xs md:text-sm shrink-0">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{data.viewCount}</span>
          </div>
          <LikeButton
            isOwner={isOwner}
            likedByMe={data.likedByMe}
            likeCount={data.likeCount}
            onLike={handleLike}
          />
          <CollectionButton
            resourceId={data.id}
            resourceType={RESOURCE_TYPES.ARTICLE}
          />
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Card>
  );
}
```

### step 2 update CollectionItem.tsx to handle {{resource}} type

`web/src/components/ui/CollectionItem.tsx`

Add an import for the new resource's hook and UI component, then add a new `if` block for the resource type.

```tsx
import { use{{Resource}}ById } from "@/features/{{resource}}/hooks";
import { {{Resource}} } from "./{{Resource}}";
...

if (item.resourceType === "{{RESOURCE}}") {
  const { data: {{resource}} } = use{{Resource}}ById(item.resourceId);
  if (!{{resource}}) return <div>Loading {{resource}}...</div>;
  return <{{Resource}} data={{{resource}}} isOwner={isOwner} />;
}
```

example:
`web/src/components/ui/CollectionItem.tsx`

```tsx
import { usePostById } from "@/features/posts/hooks";
import { useArticleById } from "@/features/articles/hooks";
import { Post } from "./Post";
import { Article } from "./Article";
import { CollectionItem as CollectionItemType } from "@/features/collections/types/collection";

interface CollectionItemProps {
  item: CollectionItemType;
  isOwner: boolean;
}

export function CollectionItem({ item, isOwner }: CollectionItemProps) {
  if (item.resourceType === "POST") {
    const { data: post } = usePostById(item.resourceId);
    if (!post) return <div>Loading post...</div>;
    return <Post data={post} isOwner={isOwner} />;
  }

  if (item.resourceType === "ARTICLE") {
    const { data: article } = useArticleById(item.resourceId);
    if (!article) return <div>Loading article...</div>;
    return <Article data={article} isOwner={isOwner} />;
  }

  return <div>Unknown resource type: {item.resourceType}</div>;
}
```
