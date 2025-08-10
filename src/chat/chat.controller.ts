import { Controller, Get, Post, Body, UseGuards, Logger, Param, Query, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtGuard } from '../application/common/guards/jwt.guard';
import { GetUser } from 'src/application/common/decorator/get-user.decorator';

@Controller('api/chat')
export class ChatController {
    private readonly logger = new Logger(ChatController.name);
    
    constructor(private readonly chatService: ChatService) {}

    @Get('list')
    @UseGuards(JwtGuard)
    async getChatList(@GetUser('sub') userId: string) {
        this.logger.log(`Fetching chat list for user: ${userId}`);
        try {
            const chats = await this.chatService.getChatList(userId);
            return {
                status: 'success',
                data: chats,
            };
        } catch (error) {
            this.logger.error(`Error fetching chat list: ${error.message}`);
            throw new BadRequestException(error.message);
        }
    }

    @Post('create/:eventId')
    @UseGuards(JwtGuard)
    async createOrGetChat(
        @Param('eventId') eventId: string,
        @GetUser('sub') userId: string,
        @Body() body: { participantId: string }
    ) {
        this.logger.log(`Creating/getting chat for event: ${eventId}`);
        
        if (!body.participantId) {
            throw new BadRequestException('Participant ID is required');
        }

        try {
            const chat = await this.chatService.getOrCreateChat(
                eventId, 
                userId, 
                body.participantId
            );
            return {
                status: 'success',
                message: 'Chat created/retrieved successfully',
                data: chat,
            };
        } catch (error) {
            this.logger.error(`Error creating chat: ${error.message}`);
            throw new BadRequestException(error.message);
        }
    }

    @Get(':chatId/messages')
    @UseGuards(JwtGuard)
    async getChatMessages(
        @Param('chatId') chatId: string,
        @GetUser('sub') userId: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50'
    ) {
        this.logger.log(`Fetching messages for chat: ${chatId}`);
        
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;

        try {
            const result = await this.chatService.getChatMessages(chatId, userId, pageNum, limitNum);
            return {
                status: 'success',
                data: result,
            };
        } catch (error) {
            this.logger.error(`Error fetching messages: ${error.message}`);
            throw new BadRequestException(error.message);
        }
    }

    @Post(':chatId/send')
    @UseGuards(JwtGuard)
    async sendMessage(
        @Param('chatId') chatId: string,
        @GetUser('sub') userId: string,
        @Body() body: { receiverId: string; content: string; image?: string }
    ) {
        this.logger.log(`Sending message in chat: ${chatId}`);
        
        if (!body.receiverId || !body.content) {
            throw new BadRequestException('Receiver ID and content are required');
        }

        try {
            const message = await this.chatService.sendMessage(
                chatId, 
                userId, 
                body.receiverId, 
                body.content, 
                body.image
            );
            return {
                status: 'success',
                message: 'Message sent successfully',
                data: message,
            };
        } catch (error) {
            this.logger.error(`Error sending message: ${error.message}`);
            throw new BadRequestException(error.message);
        }
    }

    @Post('message/:messageId/read')
    @UseGuards(JwtGuard)
    async markAsRead(
        @Param('messageId') messageId: string,
        @GetUser('sub') userId: string
    ) {
        this.logger.log(`Marking message as read: ${messageId}`);
        try {
            const message = await this.chatService.markMessageAsRead(messageId, userId);
            return {
                status: 'success',
                message: 'Message marked as read',
                data: message,
            };
        } catch (error) {
            this.logger.error(`Error marking message as read: ${error.message}`);
            throw new BadRequestException(error.message);
        }
    }
}
