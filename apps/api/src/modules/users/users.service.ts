import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const hashed = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashed,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async update(id: number, data: UpdateUserDto) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
  }

  remove(id: number) {
    // not recommended in MVP, but included for completeness
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
