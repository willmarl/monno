import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { NotificationsService } from './notifications.service';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';
import { MarkNotificationsReadDto } from './dto/mark-notifications-read.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'List current user notifications' })
  @ApiResponse({ status: 200, description: 'Paginated notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  list(@Req() req: any, @Query() query: NotificationListQueryDto) {
    return this.notificationsService.findForUser(req.user.sub, query);
  }

  @ApiOperation({ summary: 'Unread notification count' })
  @ApiResponse({ status: 200, description: '{ count }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.notificationsService.unreadCount(req.user.sub);
  }

  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiBody({ type: MarkNotificationsReadDto })
  @ApiResponse({ status: 200, description: '{ updated }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('read')
  markRead(@Req() req: any, @Body() body: MarkNotificationsReadDto) {
    return this.notificationsService.markRead(req.user.sub, body);
  }
}
