# preamble

note everything here assumes the human or AI has prisma schema model ready (resource is in schema.prisma and the migrations has been set), for example:

```prisma
model User {
  {{resource}} Article[]
...
}
model Article {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  imagePath     String?
  creatorId Int
  creator User @relation(fields: [creatorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deleted   Boolean   @default(false)
  deletedAt DateTime?
}
```

> also note anytime im using example, im referencing Article. Adapt appropriately for example instead of `createdAt` it may be `purchasedAt` but concept is the same. there could be more or less properties to have. if unsure check with human to make sure you can accurately see their vision. for instance most schemas will not have image/imagePath. I am providing image to cover what to do if schema has some sort of media upload.

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

@Module({
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

@Module({
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
import { IsString, MaxLength, MinLength } from 'class-validator';

export class Create{{resource}}Dto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;
}
```

example:

```ts
import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateArticleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;
}
```

`update-{{resource}}.dto.ts`

```ts
import { IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class Create{{resource}}Dto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content?: string;
}
```

example:

```ts
import { IsString, MaxLength, MinLength, IsOptional } from "class-validator";

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content?: string;
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

@Injectable()
export class {{resource}}Service {
  constructor(private prisma: PrismaService) {}

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

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

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
  image: true,
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
  image: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};
```

## controller.ts

### step 1 prepare service.ts using template

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
} from '@nestjs/common';

import { {{resource}}Service } from './{{resource}}.service';
import { Create{{resource}}Dto } from './dto/create-{{resource}}.dto';
import { Update{{resource}}Dto } from './dto/update-{{resource}}.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Query } from '@nestjs/common';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { CreatorGuard } from 'src/common/guards/creator.guard';
import { ProtectedResource } from 'src/decorators/protected-resource.decorator';

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

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
  ...
  // insert CRUD here. future steps will instruct how. please wait.
}
```

# part 3 | Create of CRUD

## step 1 'create' logic for service.ts

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

## step 2 'create' endpoint for controller.ts

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
findOne(@Param('id') id: number) {
  return this.{{resource}}Service.findOne(id);
}
```

example :

```ts
@Get(':id')
findOne(@Param('id') id: number) {
  return this.articlesService.findOne(id);
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
findByUserIdRaw(@Param('userId') userId: number) {
  return this.{{resource}}Service.findByUserIdRaw(userId);
}
```

example :

```ts
@Get('users/:userId')
findByUserIdRaw(@Param('userId') userId: number) {
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
findByUserId(@Param('userId') userId: number, @Query() pag: PaginationDto) {
  return this.{{resource}}Service.findByUserId(userId, pag);
}
```

example:

```ts
@Get('users/:userId')
findByUserId(@Param('userId') userId: number, @Query() pag: PaginationDto) {
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
  @Param('userId') userId: number,
  @Query() pag: CursorPaginationDto,
) {
  return this.{{resource}}Service.findByUserIdCursor(userId, pag);
}
```

example:

```ts
@Get('users/:userId/cursor')
findByUserIdCursor(
  @Param('userId') userId: number,
  @Query() pag: CursorPaginationDto,
) {
  return this.articlesService.findByUserIdCursor(userId, pag);
}
```

# part 5| update of CRUD

## step 1 'update' logic for service.ts

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

## step 2 'update' endpoint for controller.ts

```ts
@UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('{{resource}}')
  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: Update{{resource}}Dto) {
    return this.{{resource}}Service.update(id, dto);
  }
```

example :

```ts
@UseGuards(JwtAccessGuard, CreatorGuard)
  @ProtectedResource('article')
  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateArticleDto) {
    return this.articlesService.update(id, dto);
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
@Delete(':id')
@HttpCode(204)
remove(@Param('id') id: number) {
  return this.{{resource}}Service.remove(id);
}
```

example:

```ts
@Delete(':id')
@HttpCode(204)
remove(@Param('id') id: number) {
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

```json
{
  "title": "First Post",
  "content": "Hello world!"
}
```

**Read all**
GET `http://localhost:3000/{{resource}}`
cursor: `http://localhost:3000/{{resource}}/cursor`

**Get all user's {{resource}}**
GET `http://localhost:3000/{{resource}}/users/<userId>`
cursor: `http://localhost:3000/{{resource}}/users/<userId>/cursor`

**Read single**
GET `http://localhost:3000/{{resource}}/<id>`

**Update**
PATCH `http://localhost:3000/{{resource}}/<id>`

```json
{
  "title": "Updated title"
}
```

**Delete**
DELETE `http://localhost:3000/{{resource}}/<id>`

# part 8 | add swagger docs to DTO and controller.ts

To clarify, you should not do part 8 nor beyond until human has given you permission to continue.
I won't add examples as you should know how to add swagger docs.
Just go to the .dto files and controller.ts file and add swagger docs inferencing whats already in those files.

# part 9 |
