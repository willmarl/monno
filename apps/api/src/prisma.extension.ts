import { Prisma } from './generated/prisma/client';

export const softDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      post: {
        async findUnique({ args, query }) {
          args.where = { ...args.where, deleted: false };
          const result = await query(args);
          return result;
        },
        async findUniqueOrThrow({ args, query }) {
          args.where = { ...args.where, deleted: false };
          return query(args);
        },
        async findMany({ args, query }) {
          args.where = { ...args.where, deleted: false };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, deleted: false };
          return query(args);
        },
        async findFirstOrThrow({ args, query }) {
          args.where = { ...args.where, deleted: false };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, deleted: false };
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, deleted: false };
          return query(args);
        },
        async delete({ args, query }) {
          // Soft delete instead of hard delete
          return client.post.update({
            where: args.where,
            data: { deleted: true, deletedAt: new Date() },
          });
        },
        async deleteMany({ args, query }) {
          // Soft delete instead of hard delete
          return client.post.updateMany({
            where: args.where,
            data: { deleted: true, deletedAt: new Date() },
          });
        },
      },
    },
  });
});
