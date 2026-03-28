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

- WIP

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
  role?: {{resource}}Status;
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
  role?: ArticleStatus;
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
import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
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
import { IsOptional, IsString, IsBoolean, IsIn } from "class-validator";
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

5. for enum fields like "status", "role", "type"

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
      'Filter by deleted status. If not provided, shows both deleted and active posts.',
    example: false,
  })
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  deleted?: boolean;

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
      "Filter by deleted status. If not provided, shows both deleted and active posts.",
    example: false,
  })
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  deleted?: boolean;

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

async searchAll(searchDto: {{resource}}SearchDto) {
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

  return {
    items,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

example:

```ts
import { ArticleSearchDto } from './dto/search-article.dto';

async searchAll(searchDto: ArticleSearchDto) {
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

  return {
    items,
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
import { {{resource}}SearchDto } from '../{{resource}}/dto/search-{{resource}}.dto';

async searchAll(searchDto: {{resource}}SearchDto) {
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

  return {
    items,
    pageInfo,
    ...(isRedirected && { isRedirected: true }),
  };
}
```

example:

```ts
import { ArticleSearchDto } from '../articles/dto/search-article.dto';

async searchAll(searchDto: ArticleSearchDto) {
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

async searchAllCursor(searchDto: {{resource}}SearchCursorDto) {
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

  return {
    items,
    nextCursor,
  };
}
```

example :

```ts
import { ArticleSearchCursorDto } from './dto/search-article.dto';

async searchAllCursor(searchDto: ArticleSearchCursorDto) {
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

  return {
    items,
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
import { {{resource}}SearchCursorDto } from '../{{resource}}/dto/search-{{resource}}.dto';

async searchAllCursor(searchDto: {{resource}}SearchCursorDto) {
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
      where: { ...where },
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
import { ArticleSearchCursorDto } from '../articles/dto/search-article.dto';

async searchAllCursor(searchDto: ArticleSearchCursorDto) {
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
      where: { ...where },
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

- `statuses:DRAFT`

**deleted** : boolean
toggle on to only filter comments that are deleted

- `deleted=true`

**sort**: string
enum of createdAt, updatedAt

- `sort=createdAt|desc` (or `asc`)
- `sort=updatedAt|desc` (or `asc`)

"Resource actions" / CRUD extensions

# part 9 | resource actions

by the time i am writing this, there is only likes, views, comments, and collection. there might be more or less when you currently read this. prompt human the available resource actions found (likes, views, comments, collections, etc), ask which ones to apply/add.

# part 10 | adding likes

> ⚠️ SKIP THIS PART unless human explicitly requested likes.

> ⚠️ Before proceeding: verify the schema model has `likeCount Int @default(0)`. If it is missing, **stop** — tell the human to add it to the schema and run a migration, then wait for confirmation before continuing.

## step 1 add/check {{Resource}} in resource.types.ts

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

## step 2 add {{resource}} to LIKEABLE_RESOURCES in resource.types.ts

```ts
export const LIKEABLE_RESOURCES = ["POST", "COMMENT", "{{resource}}"] as const;
```

example :

```ts
export const LIKEABLE_RESOURCES = ["POST", "COMMENT", "ARTICLE"] as const;
```

## step 3 add {{resource}} LIKEABLE_RESOURCE_CONFIG in likes.service.ts

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

## step 4 add to `likeCount` to shared return in {{resource}}.service.ts

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

## step 5 add to `likeCount` to shared return in admin-{{resource}}.service.ts

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

## step 6 import `enhanceWithLikes` to {{resource}}.service.ts

```ts
import { enhanceWithLikes } from "src/common/likes/enhance-with-likes";
```

## step 7 add like and its count to findById

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

## step 8 update findById endpoint to have Jwt optional guard

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

## step 9 add like and its count to findAll (offset pagination)

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

## step 10 update findAll (offset pagination) endpoint to have Jwt optional guard

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

## step 11 add like and its count to find All (cursor)

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

## step 12 update findAll (cursor pagination) endpoint to have Jwt optional guard

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

## step 13 add like and its count to findByUserId (offset pagination)

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

## step 14 update findByUserId (offset pagination) endpoint to have Jwt optional guard

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

## step 15 add like and its count to findByUserId (cursor pagination)

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

## step 16 update findByUserId (cursor pagination) endpoint to have Jwt optional guard

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

## step 17 add like and its count to searchAll (offset pagination)

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

## step 18 update searchAll (offset pagination) endpoint to have Jwt optional guard

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

## step 19 add like and its count to searchAll (cursor pagination)

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

## step 20 update searchAll (cursor pagination) endpoint to have Jwt optional guard

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

## step 21 new function findLikedByUser to get all of user's liked {{resource}} (offset pagination)

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

## step 22 endpoint for findLikedByUser (offset pagination)

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

## step 23 new function findLikedByUser to get all of user's liked {{resource}} (cursor pagination)

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

## step 24 endpoint for findLikedByUser (cursor pagination)

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

## step 25 Test like endpoints/summary

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

# part 11 | adding views

> ⚠️ SKIP THIS PART unless human explicitly requested view count.

> ⚠️ Before proceeding: verify the schema model has `viewCount Int @default(0)`. If it is missing, **stop** — tell the human to add it to the schema and run a migration, then wait for confirmation before continuing.

## step 1 add/check {{Resource}} in resource.types.ts

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

## step 2 add {{resource}} to VIEWABLE_RESOURCES in resource.types.ts

```ts
export const VIEWABLE_RESOURCES = ["POST", "{{resource}}"] as const;
```

example :

```ts
export const VIEWABLE_RESOURCES = ["POST", "ARTICLE"] as const;
```

## step 3 add {{resource}} VIEWABLE_RESOURCE_CONFIG in view-handler.service.ts

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

## step 4 add to `viewCount` to shared return in {{resource}}.service.ts

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

## step 5 add to `viewCount` to shared return in admin-{{resource}}.service.ts

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

## step 6 Test view endpoint for {{resource}}

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

# part 12 | adding comments

> ⚠️ SKIP THIS PART unless human explicitly requested comments.

## step 1 add/check {{Resource}} in resource.types.ts

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

## step 2 add {{resource}} to COMMENTABLE_RESOURCES in resource.types.ts

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

## step 3 add {{resource}} COMMENTABLE_RESOURCE_CONFIG in comments.service.ts

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

## step 4 Test comment endpoint for {{resource}}

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

# part 13 | adding collection

> ⚠️ SKIP THIS PART unless human explicitly requested collections.

## step 1 add/check {{Resource}} in resource.types.ts

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

## step 2 add {{resource}} to COLLECTABLE_RESOURCES in resource.types.ts

```ts
export const COLLECTABLE_RESOURCES = ["POST", "{{resource}}"] as const;
```

example :

```ts
export const COLLECTABLE_RESOURCES = ["POST", "ARTICLE"] as const;
```

## step 3 add {{resource}} COLLECTABLE_RESOURCE_CONFIG in collections.service.ts

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

## step 4 Test collection endpoint for {{resource}}

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

# part 14 | add swagger docs to DTO and controller.ts

I won't add examples as you should know how to add swagger docs.
Just go to the .dto files and controller.ts file and add swagger docs inferencing based off current code.
