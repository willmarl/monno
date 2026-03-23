future me : make checklist of things human to clarify to ai

# preamble

note everything here assumes the human or AI has prisma schema model ready (resource is in schema.prisma and the migrations has been set), for example:

```prisma
model User {
  {{resource}} Article[]
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
}
```

If human has not provided you context of the schema model. stop, dont proceed to do any steps. ask for model context.

Note anytime im using example, im referencing Article. Adapt appropriately for example instead of `createdAt` it may be `purchasedAt` but concept is the same. there could be more or less properties to have. if unsure check with human to make sure you can accurately see their vision. for instance most schemas will not have image/imagePath. I am providing image to cover what to do if schema has some sort of media upload.

The example 'Article' I use is suppose to cover a good amount of scenarios. I dont expect most new resource to have media or enum of status so in examples if new source doesnt have need for enum or media upload can ignore that part of code.

if media upload is not simple like image refer to how-to-do-file-upload.md

## example of what human should ask you

```
Here is my blog schema model in schema.prisma can you make CRUD for it?
I want it to have:

- offset pagination
- search
- file upload for picture
```

**clarify on human's requests**:

- if they ask for offset and cursor pagination or dont mention what pagination to use then ask for clarification. it may be simple CRUD with no pagination needed.
- if they dont mention search, clarify if they dont want any search as it may just be simple CRUD.
- ask if they want any image processing done like convert uploaded file to format, resolution, file size restriction ,etc

# Part 1 | adding files

## step 1 make files

in `apps/api/src` make these files if not already
`modules/{{resource}}/{{resource}}.service.ts`
`modules/{{resource}}/{{resource}}.controller.ts`
`modules/{{resource}}/{{resource}}.module.ts`
`modules/{{resource}}/dto/create-article.dto.ts`
`modules/{{resource}}/dto/update-article.dto.ts`

for example:
`modules/articles/articles.service.ts`
`modules/articles/articles.controller.ts`
`modules/articles/articles.module.ts`
`modules/articles/dto/create-article.dto.ts`
`modules/articles/dto/update-article.dto.ts`

> Note most of the time its plural, they're might be edge cases like "support" as in "support tickets" so having "supports" wouldn't make sense.

## Step 2 Add PrismaService to the {{resource}}Module

```ts
import { Module } from '@nestjs/common';
import { {{resource}}Service } from './{{resource}}.service';
import { {{resource}}Controller } from './{{resource}}.controller';
import { PrismaService } from '../../prisma.service';
import { FileProcessingModule } from '../../common/file-processing/file-processing.module';

@Module({
  imports: [FileProcessingModule],
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
import { FileProcessingModule } from "../../common/file-processing/file-processing.module";

@Module({
  imports: [FileProcessingModule],
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

# part 2 templates for service and controller

## service.ts

### step 1 prepare service.ts using template

here is the general template you'd want to use whenever init creating service.ts, even if you don't think you'll be using all the imported data, leave import lines in anyways.

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Create{{resource}}Dto } from './dto/create-{{resource}}.dto';
import { Update{{resource}}Dto } from './dto/update-{{resource}}.dto';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { BadRequestException } from '@nestjs/common';
import { FileProcessingService } from '../../common/file-processing/file-processing.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';

@Injectable()
export class {{resource}}Service {
  constructor(
    private prisma: PrismaService,
    private fileProcessing: FileProcessingService,
  ) {}

  ...
  // insert CRUD here
}
```

example:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { BadRequestException } from '@nestjs/common';
import { FileProcessingService } from '../../common/file-processing/file-processing.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';

@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private fileProcessing: FileProcessingService,
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
} from '@nestjs/common';

import { {{resource}}Service } from './{{resource}}.service';
import { Create{{resource}}Dto } from './dto/create-{{resource}}.dto';
import { Update{{resource}}Dto } from './dto/update-{{resource}}.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Query } from '@nestjs/common';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { CreatorGuard } from 'src/common/guards/creator.guard';
import { ProtectedResource } from 'src/decorators/protected-resource.decorator';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

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
} from '@nestjs/common';

import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Query } from '@nestjs/common';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { CreatorGuard } from 'src/common/guards/creator.guard';
import { ProtectedResource } from 'src/decorators/protected-resource.decorator';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
  ...
  // insert CRUD here. future steps will instruct how. please wait.
}
```

# part 3 | Create of CRUD

## Basic create

### step 1 'create' logic for service.ts

```ts
create(data: Create{{resource}}Dto, userId: number) {
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
create(data: CreateArticleDto, userId: number) {
    return this.prisma.article.create({
      data: {
        ...data,
        creatorId: userId,
      },
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

### step 1 add file logic service.ts

for basic image im going to reuse the `postImage` preset thats in `file-upload-presets.ts`. if appropriate may need to make new preset how-to-do-file-upload.md

```ts
async create(data: Create{{resource}}Dto, userId: number, file?: any) {
    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        const imagePath = await this.fileProcessing.processFile(
          file,
          'postImage',
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
          'postImage',
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

### step 2 add file argument and interceptor controller.ts

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

## (rare/optional) primitive find all (no pagination)

There might be rare scenario in which you want to fetch all, maybe for something you know will have low amount, but i'd say most of the time don't do this and skip this. Most of time should have at least simple offset pagination.

### step 1 'findAll' logic for service.ts

```ts
findAll() {
    return this.prisma.{{resource}}.findMany({
      orderBy: { createdAt: 'desc' },
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

## cursor pagination find all (optional, only add if human requests it)

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

## find all created/owner by user cursor pagination (optional, only add if human requests it)

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

# part 5| update of CRUD

## Basic update

### step 1 'update' logic for service.ts

```ts
update(id: number, data: Update{{resource}}Dto) {
    return this.prisma.{{resource}}.update({
      where: { id },
      data,
    });
  }
```

example:

```ts
update(id: number, data: UpdateArticleDto) {
    return this.prisma.article.update({
      where: { id },
      data,
    });
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

## Adding file upload to update

### step 1 add file logic service.ts

```ts
async update(id: number, userId: number, data: Update{{resource}}Dto, file?: any) {
    // Get current {{resource}} to check if email is being changed and if it's verified
    const current{{resource}} = await this.prisma.{{resource}}.findUnique({
      where: { id: id },
    });

    if (!current{{resource}}) {
      throw new NotFoundException('{{resource}} not found');
    }

    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        // Get the current {{resource}} to retrieve old image path
        const current{{resource}} = await this.prisma.{{resource}}.findUnique({
          where: { id: id },
          select: { imagePath: true },
        });

        // Delete old image if it exists
        if (current{{resource}}?.imagePath) {
          await this.fileProcessing.deleteFile(current{{resource}}.imagePath);
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
    });
  }
```

example:

```ts
async update(id: number, userId: number, data: UpdateArticleDto, file?: any) {
    // Get current article to check if email is being changed and if it's verified
    const currentArticle = await this.prisma.article.findUnique({
      where: { id: id },
    });

    if (!currentArticle) {
      throw new NotFoundException('Article not found');
    }

    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        // Get the current article to retrieve old image path
        const currentArticle = await this.prisma.article.findUnique({
          where: { id: id },
          select: { imagePath: true },
        });

        // Delete old image if it exists
        if (currentArticle?.imagePath) {
          await this.fileProcessing.deleteFile(currentArticle.imagePath);
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
  const userId = req.user.sub;
  return this.{{resource}}sService.update(id, userId, dto, file);
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
  const userId = req.user.sub;
  return this.articlesService.update(id, userId, dto, file);
}
```

# part 6 | delete of CRUD

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
      return { message: '{{resource}} was already deleted' };
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
      return { message: 'Article was already deleted' };
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
@Delete(':id')
@HttpCode(204)
remove(@Param('id', ParseIntPipe) id: number) {
  return this.{{resource}}Service.remove(id);
}
```

example:

```ts
@UseGuards(JwtAccessGuard, CreatorGuard)
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

# part 7 | Test CRUD endpoints/summary

Tell human to tests these endpoints and wait for human's confirmation to continue on to next parts.

**Create**
POST `http://localhost:3000/{{resource}}`

```multipart/form-data
{
  "title": "First Post",
  "content": "Hello world!"
  "image": "exampleImage.png"
  "status": "DRAFT"
}
```

**Read all**
GET `http://localhost:3000/{{resource}}`
cursor: `http://localhost:3000/{{resource}}/cursor`
queries: `offset/cursor`, `limit`

**Get all user's {{resource}}**
GET `http://localhost:3000/{{resource}}/users/<userId>`
cursor: `http://localhost:3000/{{resource}}/users/<userId>/cursor`

**Read single**
GET `http://localhost:3000/{{resource}}/<id>`

**Update**
PATCH `http://localhost:3000/{{resource}}/<id>`

```multipart/form-data
{
  "title": "Updated title"
}
```

**Delete**
DELETE `http://localhost:3000/{{resource}}/<id>`

# part 8 | basic search engine (Prolly want to make this its own md file)

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
import { buildSearchWhere } from 'src/common/search/search.utils';


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
import { buildSearchWhere } from 'src/common/search/search.utils';


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

## step 4 (optional) add search to service file (cursor)

```ts
import { {{resource}}SearchCursorDto } from './dto/search-{{resource}}.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';

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
import { buildSearchWhere } from 'src/common/search/search.utils';

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

## step 5 update controller.ts to have search (offset)

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

## step 6 (optional) update controller.ts to have search (cursor)

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

## step 7 new queries for updated endpoint to for human to test

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

# part 9 | adding likes, views, comments, collection (THIS NEEDS TO BE SEPARATE MD FILE | "Resource actions" / CRUD extensions)

by the time i am writing this, there is only likes, views, comments, and collection. there might be more or less when you currently read this. prompt human the available resource actions found (likes, views, comments, collections, etc), ask which ones to apply/add.

# part 10 | admin CRUD

WIP

# part 11 | add swagger docs to DTO and controller.ts

I won't add examples as you should know how to add swagger docs.
Just go to the .dto files and controller.ts file and add swagger docs inferencing whats already in those files.
