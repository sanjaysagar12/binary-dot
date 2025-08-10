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
                tag: eventData.tag,
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
                image: commentData.image,
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

    async getEventById(eventId: string) {
        // Check if event exists
        const event = await this.prisma.event.findUnique({
            where: {
                id: eventId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                prizes: {
                    orderBy: {
                        position: 'asc',
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                                walletAddress: true,
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
                comments: {
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
                },
                _count: {
                    select: {
                        participants: true,
                        comments: true,
                    },
                },
            },
        });

        if (!event) {
            throw new Error('Event not found');
        }

        return event;
    }

    async getEventsByTag(tag: string) {
        return await this.prisma.event.findMany({
            where: {
                isActive: true,
                tag: {
                    equals: tag,
                    mode: 'insensitive', // Case-insensitive search
                },
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
            console.error('Error fetching events by tag:', error);
            throw new Error('Failed to fetch events by tag');
        });
    }

    async getMyEvents(userId: string) {
        // Get events created by the user
        const createdEvents = await this.prisma.event.findMany({
            where: {
                creatorId: userId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                prizes: {
                    orderBy: {
                        position: 'asc',
                    },
                },
                _count: {
                    select: {
                        participants: true,
                        comments: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Get events the user is participating in
        const participatingEvents = await this.prisma.eventParticipant.findMany({
            where: {
                userId: userId,
            },
            include: {
                event: {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                            },
                        },
                        prizes: {
                            orderBy: {
                                position: 'asc',
                            },
                        },
                        _count: {
                            select: {
                                participants: true,
                                comments: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                joinedAt: 'desc',
            },
        });

        return {
            createdEvents: createdEvents,
            participatingEvents: participatingEvents.map(p => ({
                ...p.event,
                participantStatus: p.status,
                joinedAt: p.joinedAt,
            })),
        };
    }

    async selectEventWinners(eventId: string, winnersData: any[]) {
        // Check if event exists and is active
        const event = await this.prisma.event.findFirst({
            where: {
                id: eventId,
                isActive: true,
            },
        });

        if (!event) {
            throw new Error('Event not found or inactive');
        }

        if (event.isCompleted) {
            throw new Error('Event is already completed');
        }

        // Validate that all winners are participants
        for (const winner of winnersData) {
            const participant = await this.prisma.eventParticipant.findUnique({
                where: {
                    userId_eventId: {
                        userId: winner.userId,
                        eventId: eventId,
                    },
                },
            });

            if (!participant) {
                throw new Error(`User ${winner.userId} is not a participant in this event`);
            }
        }

        // Create winners and mark event as completed
        const winners = await this.prisma.$transaction(async (tx) => {
            // Delete existing winners if any
            await tx.eventWinner.deleteMany({
                where: { eventId: eventId },
            });

            // Create new winners
            const createdWinners = await Promise.all(
                winnersData.map(winner =>
                    tx.eventWinner.create({
                        data: {
                            userId: winner.userId,
                            eventId: eventId,
                            position: winner.position,
                            prizeAmount: winner.prizeAmount,
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    avatar: true,
                                    walletAddress: true,
                                },
                            },
                        },
                    })
                )
            );

            // Mark event as completed
            await tx.event.update({
                where: { id: eventId },
                data: {
                    isCompleted: true,
                    completedAt: new Date(),
                },
            });

            return createdWinners;
        });

        return winners;
    }

    async updateEventStatus(eventId: string, statusData: { isActive?: boolean; isCompleted?: boolean }) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            throw new Error('Event not found');
        }

        const updateData: any = {};
        
        if (statusData.isActive !== undefined) {
            updateData.isActive = statusData.isActive;
        }
        
        if (statusData.isCompleted !== undefined) {
            updateData.isCompleted = statusData.isCompleted;
            if (statusData.isCompleted && !event.completedAt) {
                updateData.completedAt = new Date();
            } else if (!statusData.isCompleted) {
                updateData.completedAt = null;
            }
        }

        return await this.prisma.event.update({
            where: { id: eventId },
            data: updateData,
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                prizes: {
                    orderBy: {
                        position: 'asc',
                    },
                },
                winners: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                                walletAddress: true,
                            },
                        },
                    },
                    orderBy: {
                        position: 'asc',
                    },
                },
                _count: {
                    select: {
                        participants: true,
                        comments: true,
                    },
                },
            },
        });
    }

    async getEventWinners(eventId: string) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            throw new Error('Event not found');
        }

        return await this.prisma.eventWinner.findMany({
            where: { eventId: eventId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        walletAddress: true,
                    },
                },
            },
            orderBy: {
                position: 'asc',
            },
        });
    }

    async getEventParticipants(eventId: string) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            throw new Error('Event not found');
        }

        return await this.prisma.eventParticipant.findMany({
            where: { eventId: eventId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        walletAddress: true,
                    },
                },
            },
            orderBy: {
                joinedAt: 'asc',
            },
        });
    }

    async getAllComments() {
        return await this.prisma.comment.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                event: {
                    select: {
                        id: true,
                        title: true,
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
            console.error('Error fetching all comments:', error);
            throw new Error('Failed to fetch all comments');
        });
    }
}
