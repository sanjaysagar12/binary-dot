import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtGuard } from '../application/common/guards/jwt.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      // TODO: Verify JWT token and extract userId
      // For now, assuming userId is passed directly in auth
      const userId = client.handshake.auth.userId;
      
      if (!userId) {
        this.logger.warn('Client connected without userId');
        client.disconnect();
        return;
      }

      client.userId = userId;
      this.connectedUsers.set(userId, client.id);
      
      this.logger.log(`User ${userId} connected with socket ${client.id}`);
      
      // Join user to their personal room
      client.join(`user_${userId}`);
      
      // Emit user online status
      client.broadcast.emit('userOnline', { userId });
      
    } catch (error) {
      this.logger.error('Error during connection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected`);
      
      // Emit user offline status
      client.broadcast.emit('userOffline', { userId: client.userId });
    }
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string }
  ) {
    try {
      const { chatId } = data;
      
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      // TODO: Verify user is participant in this chat
      // For now, just join the room
      await client.join(`chat_${chatId}`);
      
      this.logger.log(`User ${client.userId} joined chat ${chatId}`);
      
      client.emit('joinedChat', { chatId });
      
    } catch (error) {
      this.logger.error('Error joining chat:', error);
      client.emit('error', { message: 'Failed to join chat' });
    }
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string }
  ) {
    try {
      const { chatId } = data;
      
      await client.leave(`chat_${chatId}`);
      
      this.logger.log(`User ${client.userId} left chat ${chatId}`);
      
      client.emit('leftChat', { chatId });
      
    } catch (error) {
      this.logger.error('Error leaving chat:', error);
      client.emit('error', { message: 'Failed to leave chat' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      chatId: string;
      receiverId: string;
      content: string;
      image?: string;
    }
  ) {
    try {
      const { chatId, receiverId, content, image } = data;
      
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Save message to database
      const message = await this.chatService.sendMessage(
        chatId,
        client.userId,
        receiverId,
        content,
        image
      );

      // Emit message to chat room
      this.server.to(`chat_${chatId}`).emit('newMessage', {
        id: message.id,
        chatId: chatId,
        content: message.content,
        image: message.image,
        senderId: message.senderId,
        receiverId: message.receiverId,
        sender: message.sender,
        receiver: message.receiver,
        isRead: message.isRead,
        createdAt: message.createdAt,
      });

      // Send notification to receiver if they're online
      const receiverSocketId = this.connectedUsers.get(receiverId);
      if (receiverSocketId) {
        this.server.to(`user_${receiverId}`).emit('messageNotification', {
          chatId: chatId,
          senderId: client.userId,
          senderName: message.sender.name,
          content: content.length > 50 ? content.substring(0, 50) + '...' : content,
        });
      }

      this.logger.log(`Message sent in chat ${chatId} from ${client.userId} to ${receiverId}`);
      
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string }
  ) {
    try {
      const { messageId } = data;
      
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      await this.chatService.markMessageAsRead(messageId, client.userId);
      
      client.emit('messageRead', { messageId });
      
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
      client.emit('error', { message: 'Failed to mark message as read' });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; receiverId: string }
  ) {
    try {
      const { chatId, receiverId } = data;
      
      if (!client.userId) {
        return;
      }

      // Notify receiver that user is typing
      const receiverSocketId = this.connectedUsers.get(receiverId);
      if (receiverSocketId) {
        this.server.to(`user_${receiverId}`).emit('userTyping', {
          chatId: chatId,
          userId: client.userId,
        });
      }
      
    } catch (error) {
      this.logger.error('Error handling typing:', error);
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; receiverId: string }
  ) {
    try {
      const { chatId, receiverId } = data;
      
      if (!client.userId) {
        return;
      }

      // Notify receiver that user stopped typing
      const receiverSocketId = this.connectedUsers.get(receiverId);
      if (receiverSocketId) {
        this.server.to(`user_${receiverId}`).emit('userStoppedTyping', {
          chatId: chatId,
          userId: client.userId,
        });
      }
      
    } catch (error) {
      this.logger.error('Error handling stop typing:', error);
    }
  }

  // Helper method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Helper method to get online users
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}