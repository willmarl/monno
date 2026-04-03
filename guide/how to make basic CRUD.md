future me : make checklist of things human to clarify to ai

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
If human has not provided you context of the schema model. stop, dont proceed to do any steps. ask for model context.

Note anytime im using example, im referencing Article. Adapt appropriately for example instead of `createdAt` it may be `purchasedAt` but concept is the same. there could be more or less properties to have. if unsure check with human to make sure you can accurately see their vision. for instance most schemas will not have image/imagePath. I am providing image to cover what to do if schema has some sort of media upload.

The example 'Article' I use is suppose to cover a good amount of scenarios. I dont expect most new resource to have media or enum of status so in examples if new source doesnt have need for enum or media upload can ignore that part of code.

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

- [ ] Is the Prisma schema model provided?
- [ ] Should there be an **admin** variant? (admin service + controller)
- [ ] Is there **file/media upload**?
  - [ ] If yes: what kind? Generic image? Video? Something more complex? Any processing (resize, format conversion, file size limit)?
- [ ] **Pagination** — primitive `findAll` (no pagination), offset, cursor, or both offset + cursor?
  - [ ] Same question for `findByUserId` endpoint
- [ ] Should there be a **search** endpoint?
- [ ] Any **resource actions**? (likes, views, comments, collections, etc.)
  - [ ] If yes: which ones?

Once confirmed, summarise back to the human what you will implement before starting.

# Part 1 | adding basic backend files

## step 1 make files

in `apps/api/src` make these files if not already
`modules/{{resource}}/{{resource}}.service.ts`
`modules/{{resource}}/{{resource}}.controller.ts`
`modules/{{resource}}/{{resource}}.module.ts`
`modules/{{resource}}/dto/create-{{resource}}.dto.ts`
`modules/{{resource}}/dto/update-{{resource}}.dto.ts`
`modules/{{resource}}/dto/search-{{resource}}.dto.ts` — ⚠️ SKIP unless human requested search
`modules/admin/admin-{{resource}}.service.ts` — ⚠️ SKIP unless human requested admin
`modules/admin/admin-{{resource}}.controller.ts` — ⚠️ SKIP unless human requested admin

for example:
`modules/articles/articles.service.ts`
`modules/articles/articles.controller.ts`
`modules/articles/articles.module.ts`
`modules/articles/dto/create-article.dto.ts`
`modules/articles/dto/update-article.dto.ts`
`modules/articles/dto/search-article.dto.ts` — ⚠️ SKIP unless human requested search
`modules/admin/admin-article.service.ts` — ⚠️ SKIP unless human requested admin
`modules/admin/admin-article.controller.ts` — ⚠️ SKIP unless human requested admin

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
import { Admin{{resource}}sController } from './admin-{{resource}}.controller';
import { Admin{{resource}}Service } from './admin-{{resource}}.service';

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
import { AdminArticlesController } from './admin-article.controller';
import { AdminArticleService } from './admin-article.service';

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

> ⚠️ Remove `FileProcessingService` import and constructor injection if human did NOT request file upload. Remove `buildSearchWhere` import if human did NOT request search. Remove cursor imports if human did NOT request cursor pagination.

```ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Create{{resource}}Dto } from './dto/create-{{resource}}.dto';
import { Update{{resource}}Dto } from './dto/update-{{resource}}.dto';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { FileProcessingService } from '../../common/file-processing/file-processing.service'; // remove if no file upload
import { buildSearchWhere } from 'src/common/search/search.utils'; // remove if no search
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
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
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
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

> ⚠️ Remove `UseInterceptors`, `UploadedFile`, and `FileInterceptor` imports if human did NOT request file upload. Remove `CursorPaginationDto` import if human did NOT request cursor pagination.

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
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
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
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
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

> ⚠️ Within this file: remove `FileProcessingService` import and injection if human did NOT request file upload. Remove `buildSearchWhere` if human did NOT request search. Remove cursor imports if human did NOT request cursor pagination.

```ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AdminService } from './admin.service';
import { Update{{resource}}Dto } from '../{{resource}}/dto/update-{{resource}}.dto';
import { FileProcessingService } from '../../common/file-processing/file-processing.service'; // remove if no file upload
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { buildSearchWhere } from 'src/common/search/search.utils'; // remove if no search
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
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
import { PrismaService } from "../../prisma.service";
import { AdminService } from "./admin.service";
import { UpdateArticleDto } from "../articles/dto/update-article.dto";
import { FileProcessingService } from "../../common/file-processing/file-processing.service";
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
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Admin{{resource}}Service } from './admin-{{resource}}.service';
import { Update{{resource}}Dto } from '../{{resource}}/dto/update-{{resource}}.dto';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';

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
import { PaginationDto } from "../../common/pagination/dto/pagination.dto";
import { CursorPaginationDto } from "src/common/pagination/dto/cursor-pagination.dto";

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
@UseInterceptors(FileInterceptor({{appropriate media type}}))
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

## find all created/owner by user (rare/optional due to no pagination)

this one use your judgement to see if getting all of user's resource makes sense. for example a Public Marketplace / Catalog Items, having this `GET /products` makes sense but this `GET /users/:id/products` users don't own products in a shopping context. If unsure ask for clarification.

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

        const avatarPath = await this.fileProcessing.processFile(
          file,
          'postImage',
          userId,
        );
        data.imagePath = avatarPath;
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

        const avatarPath = await this.fileProcessing.processFile(
          file,
          'postImage',
          userId,
        );
        data.imagePath = avatarPath;
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
@UseInterceptors(FileInterceptor({{appropriate media type}})))
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

      const avatarPath = await this.fileProcessing.processFile(
        file,
        'postImage',
        userId,
      );
      data.imagePath = avatarPath;
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

      const avatarPath = await this.fileProcessing.processFile(
        file,
        'postImage',
        userId,
      );
      data.imagePath = avatarPath;
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

## step 4 admin soft delete logic for admin-{{resource}}.service.ts

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

## step 5 admin soft delete endpoint for admin-{{resource}}.controller.ts

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

## step 6 admin restore logic for admin-{{resource}}.service.ts

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

## step 7 admin restore endpoint for admin-{{resource}}.controller.ts

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

# part 7 | Test CRUD endpoints/summary

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

# part 8 | basic search engine

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

# part 9 | adding resource actions to backend

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

### step 4 Test collection endpoint for {{resource}}

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

# part 10 | add swagger docs to DTO and controller.ts

I won't add examples as you should know how to add swagger docs.
Just go to the .dto files and controller.ts file and add swagger docs inferencing based off current code.

# part 11 | adding basic frontend files

## step 1 make files

in `apps/web/src` make these folders if not already

`features/articles/`
`components/pages/article/`
`app/(default)/article/`
if admin
`features/admin/articles/`
`components/pages/admin/articles/`
`app/(admin)/admin/articles/`

- examples

# part 12 | frontend api

## step 1 make `features/articles/types/{{resource}}.ts`

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

- img upload variant

## step 2 make admin `features/admin/articles/types/{{resource}}.ts`

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

## step 3 converting endpoints to `features/articles/api.ts`

if not using cursor pagination, omit cursor code

- img upload variant

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

## step 4 converting endpoints to `features/admin/articles/api.ts`

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

# step 5 make `features/articles/hooks.ts`

if not using cursor pagination, omit cursor code

- img upload variant

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

# step 6 make `features/admin/articles/hooks.ts`

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

# part 13 files for creation

## step 1 make zod schema for create

look at the DTO files from backend to use guide on what zod validation should be
edit `features/articles/schemas/createArticle.schema.ts`

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

- img upload variant
- admin variant

## step 2 create form component

`features/articles/components/CreateArticleForm.tsx`

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

## step 3 inline create form

`features/articles/components/InlineCreateArticleForm.tsx`

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
        Change CreateArticle
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

## step 4 modal for create

`features/articles/components/modal/CreateArticleModal.tsx`

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
        toast.error("Error trying to make article");
      }}
      isAlwaysOpen={true}
    />
  );
}
```

# part 14 files for update/edit

for the admin variants, despite forms being identical, its more so for future proof. for instance a new field like shadowbanned, only want admin able to CRUD it.

## step 1 make zod schema for update

look at the DTO files from backend to use as guide on what zod validation should be

`features/articles/schemas/updateArticle.schema.ts`

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

- img upload variant

## step 2 make admin zod schema for update

`features/admin/articles/schemas/adminUpdateArticle.schema.ts`

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

`features/articles/components/EditArticleForm.tsx`

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

## step 4 admin edit form component

`features/admin/articles/components/AdminEditArticleForm.tsx`

```ts
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

## step 5 inline edit form

`features/articles/components/InlineEditArticleForm.tsx`

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
        Change UpdateArticle
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

## step 6 admin inline edit form

`features/admin/articles/components/AdminInlineEditArticleForm.tsx`

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
        Change UpdateArticle
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

## step 7 modal for edit

`features/articles/components/modal/EditArticleModal.tsx`

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
        toast.error("Error trying to edit article");
      }}
      isAlwaysOpen={true}
    />
  );
}
```

## step 8 admin modal for edit

`features/admin/articles/components/modal/AdminEditArticleModal.tsx`

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
        toast.error("Error trying to edit article");
      }}
      isAlwaysOpen={true}
    />
  );
}
```

# part 15 | make generic component for {{resource}}

Instructions for AI, roughly guess UI component based off schema model and type.ts, this is more so just to quickly check if api/hooks work. doesn't matter if its ugly
`components/ui/Article.tsx`

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
        <div className="flex gap-2 items-center text-xs md:text-sm flex-shrink-0">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Card>
  );
}
```

- import my generic skeleton
- like button
- view
- collection button
- comment

# part 16 | make pagination component

## step 1 make pagination list component using UI component made in previous part

`src/components/pages/article/PaginatedArticles.tsx`

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

`src/components/pages/article/CursorArticles.tsx`

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

`src/components/pages/article/CursorInfiniteArticles.tsx`

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

# part 17 | make pages

## basic/home

### step 1 make component for its upcoming page.tsx

omit cursor code if not using cursor

`src/components/pages/article/ArticlePage.tsx`

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

`src/app/(default)/article/page.tsx`

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

`src/components/pages/article/CreateArticlePage.tsx`

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

`src/app/(default)/article/create/page.tsx`

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

`src/components/pages/article/EditArticlePage.tsx`

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

`src/app/(default)/article/edit/[id]/page.tsx`

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

`src/components/pages/article/ArticleDetail.tsx`

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

`src/app/(default)/article/[id]/page.tsx`

```tsx
import { getServerUser } from "@/features/auth/server";
import { ArticleDetail } from "@/components/pages/article/ArticleDetail";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles",
};
export default async function page() {
  const user = await getServerUser();

  return <ArticleDetail user={user} />;
}
```

## (optional) append to profile page list of user's articles

if `components/pages/userProfile/UserProfileContent.tsx` doesn't exist, skip this section. skip step 1 and step 2

### step 1 make component for Users articles list

`components/pages/userProfile/UsersArticlesList.tsx`

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

add import of newly made UsersArticlesList.tsx
`components/pages/userProfile/UserProfileContent.tsx`

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

## part 18 | extending admin dashboard

## step 1 make columns.tsx for upcoming data table component

`components/pages/admin/articles/columns.tsx`

```tsx
"use client";

import { MoreHorizontal } from "lucide-react";
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

## step 2 make ArticleDataTable.tsx

`components/pages/admin/articles/ArticleDataTable.tsx`

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

`components/pages/admin/articles/AdminArticlePage.tsx`

```tsx
import { ArticleDataTable } from "./ArticleDataTable";

export function AdminArticlePage() {
  return (
    <div>
      <p>admin article page here</p>
      <ArticleDataTable />
    </div>
  );
}
```

## step 4 make app admin page

`app/(admin)/admin/articles/page.tsx`

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

Inside `components/layout/admin/Sidebar.tsx` append to Menu items list a new object for resource. Feel free to pick lucide icon to represent resource.

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

# part 19 | search feature

## update api related files to have search

### step 1 update api.ts to query search endpoint (offset)

`features/articles/api.ts`

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
// GET /articles/search/suggest?q=hello&limit=5
export const fetchArticleSuggestions = (q: string, limit: number = 5) => {
  if (!q) return Promise.resolve([]);

  return fetcher<Article[]>("/articles/search/suggest", {
    searchParams: { q, limit },
  });
};
```

### step 4 import search to hooks.ts

`features/articles/hooks.ts`

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

### step 6 search hook (cursor) (optional)

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
export function useArticleSuggestions(q: string, limit: number = 5) {
  return useQuery({
    queryKey: ["article-suggestions", q],
    queryFn: () => fetchArticleSuggestions(q, limit),
    enabled: !!q,
  });
}
```

### step 8 update admin api.ts to query search endpoint (offset)

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

`features/articles/types/search-config.ts`

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

### step 2 add search params type to `search-params.ts`

update `src/types/search-params.ts` to have new resource search param variant

```ts
export interface PublicArticleSearchParams extends SearchParams {
  statuses?: string;
}
```

if you dont have advance searches like toggle or enum, then it can simply just be

```ts
export interface PublicArticleSearchParams extends SearchParams {}
```

### step 3 make admin variant of search config

`features/admin/articles/types/search-config.ts`

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

`src/types/search-params.ts`

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

`features/articles/components/ArticleSearchBar.tsx`

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

`features/articles/components/ArticleSearchBar.tsx`

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

`src/app/(default)/article/page.tsx`

```tsx
import { getServerUser } from "@/features/auth/server";
import { PublicArticleSearchParams } from "@/types/search-params";
...
export default async function page({
  searchParams,
}: {
  searchParams: Promise<PublicArticleSearchParams>;
}) {
  const user = await getServerUser();
  const params = await searchParams;
...
<ArticlePage user={user} searchParams={params} />
```

complete example:

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

### step 2 update Article page to take in search params

`components/pages/article/ArticlePage.tsx`

```tsx
import { User } from "@/features/users/types/user";
import { ArticleSearchBar } from "@/features/articles/components/ArticleSearchBar";
import { PublicArticleSearchParams } from "@/types/search-params";

interface ArticlePageProps {
  user: User | null;
  searchParams?: PublicArticleSearchParams;
}

export function ArticlePage({ user, searchParams }: ArticlePageProps) {
  ...
  return (
    <div>
      <ArticleSearchBar />
      ...
      <PaginatedArticles searchParams={searchParams} />
      {/* <CursorArticles searchParams={searchParams} /> */}
      {/* <CursorInfiniteArticles searchParams={searchParams} /> */}
    </div>
  )
}
```

complete example

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

`components/pages/article/PaginatedArticles.tsx`

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

`components/pages/article/CursorArticles.tsx`

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

`components/pages/article/CursorInfiniteArticles.tsx`

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

`components/pages/admin/articles/ArticleDataTable.tsx`

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

`components/pages/admin/articles/AdminArticlePage.tsx`

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

`src/app/(admin)/articles/page.tsx`

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

# part 20 | adding resource actions to frontend

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

### step 1 add to article type like

`features/articles/types/article.ts`

```ts
export interface Article {
  ...
  likeCount: number;
  likedByMe: boolean;
}
```

### step 2 add to api the endpoint article liked by user

omit cursor code if not doing cursor
`features/articles/api.ts`

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
`features/articles/hooks.ts`

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

`features/likes/hooks.ts`

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

### step 4 update article UI component to have like button

`components/ui/Article.tsx`

```tsx
import { LikeButton } from "../common/LikeButton";
import { useToggleLike } from "@/features/likes/hooks";
import { RESOURCE_TYPES } from "@/types/resource";
...
const like = useToggleLike();
function handleLike() {
  like.mutate({ resourceType: RESOURCE_TYPES.ARTICLE, resourceId: data.id });
}
...
<LikeButton
  isOwner={isOwner}
  likedByMe={data.likedByMe}
  likeCount={data.likeCount}
  onLike={handleLike}
/>
```

complete example:

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
    like.mutate({ resourceType: RESOURCE_TYPES.ARTICLE, resourceId: data.id });
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
        <div className="flex gap-2 items-center text-xs md:text-sm flex-shrink-0">
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

### step 5 make component for paginated list of user's liked articles (optional)

`components/pages/userProfile/LikedArticlesList.tsx`

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

### step 6 add to user profile (optional)

this file may not even exist as all examples assume default boilerplate repo. if missing just skip step
`components/pages/userProfile/UserProfileContent.tsx`

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

### step 7 add to admin article type like count

`features/admin/articles/types/article.ts`

```ts
export interface Article {
  ...
  likeCount: number;
}
```

### step 8 add to the admin article column like count

`components/pages/admin/articles/columns.tsx`

```tsx
export const columns: ColumnDef<Article>[] = [
  ...{
    accessorKey: "likeCount",
    header: ({ column }) => <SortableHeader column={column} label="Likes" />,
  },
];
```

## adding views

### step 1 add to article type view count

`features/articles/types/article.ts`

```ts
export interface Article {
  ...
  viewCount: number;
}
```

### step 2 add record view hook to ArticleDetail.tsx

`components/pages/article/ArticleDetail.tsx`

```tsx
import { useRecordView } from "@/features/views/hook";
...
// Record view when article loads
useEffect(() => {
  if (data?.id) {
    recordView({
      resourceType: "ARTICLE",
      resourceId: data.id,
    });
  }
}, [data?.id, recordView]);
```

complete example:

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

`components/ui/Article.tsx`

```tsx
import { Eye } from "lucide-react";
...
<div className="flex items-center gap-1 text-muted-foreground">
  <Eye className="h-4 w-4" />
  <span>{data.viewCount}</span>
</div>
```

complete example:

```tsx
<div className="flex gap-2 items-center text-xs md:text-sm flex-shrink-0">
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

### step 4 add to admin article type view count

`features/admin/articles/types/article.ts`

```ts
export interface Article {
  ...
  viewCount: number;
}
```

### step 5 add to the admin article column like count

`components/pages/admin/articles/columns.tsx`

```tsx
export const columns: ColumnDef<Article>[] = [
  ...{
    accessorKey: "viewCount",
    header: ({ column }) => <SortableHeader column={column} label="Views" />,
  },
];
```

## adding comment

### step 1 add comments component to ArticleDetail.tsx

```tsx
import { Suspense } from "react";
import { InlineNewCommentForm } from "@/features/comments/components/InlineNewCommentForm";
import { CommentPagInline } from "@/features/comments/components/CommnetPagInline";
import { toast } from "sonner";
...
<div className="bg-card rounded-lg p-4">
  <h3 className="font-semibold mb-4">Comments</h3>
  <InlineNewCommentForm
    resourceType="ARTICLE"
    resourceId={data.id}
    onSuccess={() => {
      toast.success("Comment articleed!");
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
```

complete example:

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
import { CommentPagInline } from "@/features/comments/components/CommnetPagInline";
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
            toast.success("Comment articleed!");
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

### step 2 update admin comments dashboard to include article comments

`features/admin/comments/types/search-config.ts`

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
