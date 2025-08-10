import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) {}

    async getChatList(userId: string) {
        // Get all chats where user is a participant
        const chatParticipants = await this.prisma.chatParticipant.findMany({
            where: {
                userId: userId,
                isActive: true,
            },
            include: {
                chat: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                title: true,
                                image: true,
                                creator: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatar: true,
                                    },
                                },
                            },
                        },
                        participants: {
                            where: {
                                userId: { not: userId },
                                isActive: true,
                            },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatar: true,
                                    },
                                },
                            },
                        },
                        messages: {
                            orderBy: {
                                createdAt: 'desc',
                            },
                            take: 1,
                            include: {
                                sender: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: {
                                messages: {
                                    where: {
                                        receiverId: userId,
                                        isRead: false,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                chat: {
                    updatedAt: 'desc',
                },
            },
        });

        return chatParticipants.map(cp => ({
            chatId: cp.chat.id,
            event: cp.chat.event,
            participants: cp.chat.participants,
            lastMessage: cp.chat.messages[0] || null,
            unreadCount: cp.chat._count.messages,
            joinedAt: cp.joinedAt,
        }));
    }

    async getOrCreateChat(eventId: string, participantId: string, hostId: string) {
        // Check if event exists
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                creator: true,
            },
        });

        if (!event) {
            throw new Error('Event not found');
        }

        // Check if user is participant or host
        const isHost = event.creatorId === participantId || event.creatorId === hostId;
        const isParticipant = await this.prisma.eventParticipant.findFirst({
            where: {
                eventId: eventId,
                userId: { in: [participantId, hostId] },
            },
        });

        if (!isHost && !isParticipant) {
            throw new Error('User not authorized for this event');
        }

        // Try to find existing chat between these users for this event
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                eventId: eventId,
                participants: {
                    every: {
                        userId: { in: [participantId, hostId] },
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });

        if (existingChat && existingChat.participants.length === 2) {
            return existingChat;
        }

        // Create new chat
        const newChat = await this.prisma.chat.create({
            data: {
                eventId: eventId,
                participants: {
                    create: [
                        { userId: participantId },
                        { userId: hostId },
                    ],
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                },
                event: {
                    select: {
                        id: true,
                        title: true,
                        creator: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return newChat;
    }

    async getChatMessages(chatId: string, userId: string, page = 1, limit = 50) {
        // Verify user is participant in this chat
        const participant = await this.prisma.chatParticipant.findFirst({
            where: {
                chatId: chatId,
                userId: userId,
                isActive: true,
            },
        });

        if (!participant) {
            throw new Error('User not authorized for this chat');
        }

        const skip = (page - 1) * limit;

        const messages = await this.prisma.chatMessage.findMany({
            where: { chatId: chatId },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip: skip,
            take: limit,
        });

        // Mark messages as read for the current user
        await this.prisma.chatMessage.updateMany({
            where: {
                chatId: chatId,
                receiverId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return {
            messages: messages.reverse(), // Return in chronological order
            hasMore: messages.length === limit,
            page: page,
        };
    }

    async sendMessage(chatId: string, senderId: string, receiverId: string, content: string, image?: string) {
        // Verify sender is participant in this chat
        const senderParticipant = await this.prisma.chatParticipant.findFirst({
            where: {
                chatId: chatId,
                userId: senderId,
                isActive: true,
            },
        });

        if (!senderParticipant) {
            throw new Error('Sender not authorized for this chat');
        }

        // Verify receiver is participant in this chat
        const receiverParticipant = await this.prisma.chatParticipant.findFirst({
            where: {
                chatId: chatId,
                userId: receiverId,
                isActive: true,
            },
        });

        if (!receiverParticipant) {
            throw new Error('Receiver not found in this chat');
        }

        // Create message and update chat timestamp
        const message = await this.prisma.$transaction(async (tx) => {
            const newMessage = await tx.chatMessage.create({
                data: {
                    chatId: chatId,
                    senderId: senderId,
                    receiverId: receiverId,
                    content: content,
                    image: image,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                    receiver: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            });

            // Update chat timestamp
            await tx.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() },
            });

            return newMessage;
        });

        return message;
    }

    async markMessageAsRead(messageId: string, userId: string) {
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new Error('Message not found');
        }

        if (message.receiverId !== userId) {
            throw new Error('Not authorized to mark this message as read');
        }

        return await this.prisma.chatMessage.update({
            where: { id: messageId },
            data: { isRead: true },
        });
    }
}
