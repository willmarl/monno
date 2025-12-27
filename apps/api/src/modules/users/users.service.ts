import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileProcessingService } from '../../common/file-processing/file-processing.service';
import { uploadLocation } from '../../common/file-processing/upload-location';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private fileProcessing: FileProcessingService,
  ) {}
  //==============
  //   Admin
  //==============
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
        avatarPath: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isEmailVerified: true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isEmailVerified: true,
      },
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isEmailVerified: true,
      },
    });
  }

  async update(id: number, data: UpdateUserDto, file?: any) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        // Get the current user to retrieve old avatar path
        const currentUser = await this.prisma.user.findUnique({
          where: { id },
          select: { avatarPath: true },
        });

        // Delete old avatar if it exists
        if (currentUser?.avatarPath) {
          await this.fileProcessing.deleteFile(currentUser.avatarPath);
        }

        const fileType = uploadLocation('/avatars');
        const avatarPath = await this.fileProcessing.processFile(
          file,
          fileType,
          id,
        );
        data.avatarPath = avatarPath;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to process avatar file';
        throw new BadRequestException(errorMessage);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isEmailVerified: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isEmailVerified: true,
      },
    });
  }

  //==============
  //   Auth
  //==============

  findByUsernameAuth(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  //==============
  //   Public
  //==============

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarPath: true,
      },
    });
  }

  //==============
  //   Self
  //==============

  async updateProfile(userId: number, data: UpdateProfileDto, file?: any) {
    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        // Get the current user to retrieve old avatar path
        const currentUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { avatarPath: true },
        });

        // Delete old avatar if it exists
        if (currentUser?.avatarPath) {
          await this.fileProcessing.deleteFile(currentUser.avatarPath);
        }

        const fileType = uploadLocation('/avatars');
        const avatarPath = await this.fileProcessing.processFile(
          file,
          fileType,
          userId,
        );
        data.avatarPath = avatarPath;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to process avatar file';
        throw new BadRequestException(errorMessage);
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        createdAt: true,
        role: true,
        isEmailVerified: true,
      },
    });
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        createdAt: true,
        role: true,
        isEmailVerified: true,
      },
    });
  }
}
