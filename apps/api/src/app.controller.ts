import { Controller, Get, Post, Body } from '@nestjs/common'; //remove me when done testing
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get() //remove me when done testing
  getHello(): string {
    return 'Hello World!';
  }

  @Post('foo') //remove me when done testing
  async createFoo(@Body() body: { name: string }) {
    return this.prisma.foo.create({
      data: { name: body.name },
    });
  }

  @Get('foo') //remove me when done testing
  async getAllFoos() {
    return this.prisma.foo.findMany();
  }
}
