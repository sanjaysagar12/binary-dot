import { Controller, Get, Post, Body, UseGuards, Logger, Param } from '@nestjs/common';
import { Roles, Role } from 'src/application/common/decorator/roles.decorator';
import { JwtGuard } from '../application/common/guards/jwt.guard';
import { RolesGuard } from '../application/common/guards/roles.guard';
import { EventService } from './event.service';
import { GetUser } from 'src/application/common/decorator/get-user.decorator';
import { CreateEventDto, CreateCommentDto, CreateCommentReplyDto } from './dto';

@Controller("api/event")
export class EventController {
    private readonly logger = new Logger(EventController.name);
    constructor(private readonly eventService: EventService) { }

    @Post('create')
    @UseGuards(JwtGuard, RolesGuard)

    @Roles(Role.MODERATOR) // Allow both ADMIN and MODERATOR once MODERATOR role is added
    async createEvent(
        @GetUser('sub') userId: string,
        @Body() eventData: CreateEventDto
    ) {
        this.logger.log(`Moderator ${userId} creating new event: ${eventData.title}`);
        const data = await this.eventService.createEvent(userId, eventData);
        return {
            status: 'success',
            message: 'Event created successfully',
            data: data,
        };
    }

    @Get('all')
    async getAllEvents() {
        this.logger.log('Fetching all active events');
        const data = await this.eventService.getAllEvents();
        return {
            status: 'success',
            data: data,
        };
    }

    @Post('join/:eventId')
    @UseGuards(JwtGuard, RolesGuard)

    @Roles(Role.USER, Role.ADMIN)
    async joinEvent(
        @GetUser('sub') userId: string,
        @Param('eventId') eventId: string
    ) {
        this.logger.log(`User ${userId} joining event: ${eventId}`);
        const data = await this.eventService.joinEvent(userId, eventId);
        return {
            status: 'success',
            message: 'Successfully joined event',
            data: data,
        };
    }

    @Post('comment')
    @UseGuards(JwtGuard, RolesGuard)

    @Roles(Role.USER, Role.MODERATOR)
    async createComment(
        @GetUser('sub') userId: string,
        @Body() commentData: CreateCommentDto
    ) {
        this.logger.log(`User ${userId} commenting on event: ${commentData.eventId}`);
        const data = await this.eventService.createComment(userId, commentData);
        return {
            status: 'success',
            message: 'Comment created successfully',
            data: data,
        };
    }

    @Post('comment/reply')
    @UseGuards(JwtGuard, RolesGuard)

    @Roles(Role.USER, Role.MODERATOR)
    async createCommentReply(
        @GetUser('sub') userId: string,
        @Body() replyData: CreateCommentReplyDto
    ) {
        this.logger.log(`User ${userId} replying to comment: ${replyData.commentId}`);
        const data = await this.eventService.createCommentReply(userId, replyData);
        return {
            status: 'success',
            message: 'Reply created successfully',
            data: data,
        };
    }

    @Get('tag/:tag')
    async getEventsByTag(
        @Param('tag') tag: string
    ) {
        this.logger.log(`Fetching events with tag: ${tag}`);
        const data = await this.eventService.getEventsByTag(tag);
        return {
            status: 'success',
            data: data,
        };
    }

    @Get('comments/all')
    @UseGuards(JwtGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.MODERATOR, Role.USER)
    async getAllComments() {
        this.logger.log('Fetching all comments from all events');
        const data = await this.eventService.getAllComments();
        return {
            status: 'success',
            data: data,
        };
    }

    @Get(':eventId')
    async getEventById(
        @Param('eventId') eventId: string
    ) {
        this.logger.log(`Fetching detailed event data for: ${eventId}`);
        const data = await this.eventService.getEventById(eventId);
        return {
            status: 'success',
            data: data,
        };
    }

    @Get(':eventId/comments')
    @Roles(Role.USER, Role.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)

    async getEventComments(
        @Param('eventId') eventId: string
    ) {
        this.logger.log(`Fetching comments for event: ${eventId}`);
        const data = await this.eventService.getEventComments(eventId);
        return {
            status: 'success',
            data: data,
        };
    }
}
