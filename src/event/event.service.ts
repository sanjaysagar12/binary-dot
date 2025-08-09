import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto, CreateCommentDto, CreateCommentReplyDto } from './dto';

@Injectable()
export class EventService {
    constructor(private prisma: PrismaService) {}

    async createEvent(userId: string, eventData: CreateEventDto) {
        return await this.prisma.event.create({
            data: {
                title: eventData.title,
                description: eventData.description,
                image: eventData.image,
                location: eventData.location,
                startDate: new Date(eventData.startDate),
                endDate: new Date(eventData.endDate),
                maxParticipants: eventData.maxParticipants,
                prizePool: eventData.prizePool,
                numberOfPrizes: eventData.numberOfPrizes,
                creatorId: userId,
                prizes: eventData.prizes ? {
                    create: eventData.prizes.map(prize => ({
                        position: prize.position,
                        amount: prize.amount,
                        title: prize.title,
                    }))
                } : undefined,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                prizes: true,
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        }).then(event => {
            return event;
        }).catch(error => {
            console.error('Error creating event:', error);
            throw new Error('Failed to create event');
        });
    }

    async getAllEvents() {
        return await this.prisma.event.findMany({
            where: {
                isActive: true,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                prizes: true,
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        }).catch(error => {
            console.error('Error fetching events:', error);
            throw new Error('Failed to fetch events');
        });
    }

    async joinEvent(userId: string, eventId: string) {
        // Check if event exists and is active
        const event = await this.prisma.event.findFirst({
            where: {
                id: eventId,
                isActive: true,
            },
            include: {
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });

        if (!event) {
            throw new Error('Event not found or inactive');
        }

        // Check if event has reached max participants
        if (event.maxParticipants && event._count.participants >= event.maxParticipants) {
            throw new Error('Event has reached maximum participants');
        }

        // Check if user is already a participant
        const existingParticipant = await this.prisma.eventParticipant.findUnique({
            where: {
                userId_eventId: {
                    userId: userId,
                    eventId: eventId,
                },
            },
        });

        if (existingParticipant) {
            throw new Error('User is already registered for this event');
        }

        // Add user as participant
        return await this.prisma.eventParticipant.create({
            data: {
                userId: userId,
                eventId: eventId,
                status: 'JOINED',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                event: {
                    select: {
                        id: true,
                        title: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
        }).catch(error => {
            console.error('Error joining event:', error);
            throw new Error('Failed to join event');
        });
    }

    async createComment(userId: string, commentData: CreateCommentDto) {
        // Check if event exists
        const event = await this.prisma.event.findFirst({
            where: {
                id: commentData.eventId,
                isActive: true,
            },
        });

        if (!event) {
            throw new Error('Event not found or inactive');
        }

        return await this.prisma.comment.create({
            data: {
                content: commentData.content,
                userId: userId,
                eventId: commentData.eventId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        replies: true,
                    },
                },
            },
        }).catch(error => {
            console.error('Error creating comment:', error);
            throw new Error('Failed to create comment');
        });
    }

    async createCommentReply(userId: string, replyData: CreateCommentReplyDto) {
        // Check if comment exists
        const comment = await this.prisma.comment.findUnique({
            where: {
                id: replyData.commentId,
            },
        });

        if (!comment) {
            throw new Error('Comment not found');
        }

        // If replying to another reply, check if parent reply exists
        if (replyData.parentReplyId) {
            const parentReply = await this.prisma.commentReply.findUnique({
                where: {
                    id: replyData.parentReplyId,
                },
            });

            if (!parentReply) {
                throw new Error('Parent reply not found');
            }
        }

        return await this.prisma.commentReply.create({
            data: {
                content: replyData.content,
                userId: userId,
                commentId: replyData.commentId,
                parentReplyId: replyData.parentReplyId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                parentReply: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        childReplies: true,
                    },
                },
            },
        }).catch(error => {
            console.error('Error creating comment reply:', error);
            throw new Error('Failed to create comment reply');
        });
    }

    async getEventComments(eventId: string) {
        // Check if event exists
        const event = await this.prisma.event.findUnique({
            where: {
                id: eventId,
            },
        });

        if (!event) {
            throw new Error('Event not found');
        }

        return await this.prisma.comment.findMany({
            where: {
                eventId: eventId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                        parentReply: {
                            select: {
                                id: true,
                                content: true,
                                user: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                        childReplies: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatar: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                _count: {
                    select: {
                        replies: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        }).catch(error => {
            console.error('Error fetching event comments:', error);
            throw new Error('Failed to fetch event comments');
        });
    }
}
