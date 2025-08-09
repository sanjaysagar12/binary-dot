import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) {}

    async getUserWallet(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                walletAddress: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return {
            userId: user.id,
            name: user.name,
            email: user.email,
            walletAddress: user.walletAddress,
            hasWallet: !!user.walletAddress,
        };
    }

    async createUserWallet(userId: string, walletAddress: string) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.walletAddress) {
            throw new Error('User already has a wallet address');
        }

        // Check if wallet address is already used
        const existingWallet = await this.prisma.user.findUnique({
            where: { walletAddress: walletAddress },
        });

        if (existingWallet) {
            throw new Error('Wallet address is already in use');
        }

        // Update user with wallet address
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { walletAddress: walletAddress },
            select: {
                id: true,
                name: true,
                email: true,
                walletAddress: true,
            },
        });

        return {
            userId: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            walletAddress: updatedUser.walletAddress,
            message: 'Wallet address added successfully',
        };
    }

    async updateUserWallet(userId: string, walletAddress: string) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Check if wallet address is already used by another user
        const existingWallet = await this.prisma.user.findFirst({
            where: { 
                walletAddress: walletAddress,
                id: { not: userId }, // Exclude current user
            },
        });

        if (existingWallet) {
            throw new Error('Wallet address is already in use by another user');
        }

        // Update user wallet address
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { walletAddress: walletAddress },
            select: {
                id: true,
                name: true,
                email: true,
                walletAddress: true,
            },
        });

        return {
            userId: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            walletAddress: updatedUser.walletAddress,
            message: 'Wallet address updated successfully',
        };
    }

    async getUserWinnings(userId: string) {
        const winnings = await this.prisma.eventWinner.findMany({
            where: { userId: userId },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        tag: true,
                        completedAt: true,
                    },
                },
            },
            orderBy: {
                winnedAt: 'desc',
            },
        });

        const totalWinnings = winnings.reduce((sum, win) => {
            return sum + (parseFloat(win.prizeAmount?.toString() || '0'));
        }, 0);

        return {
            totalWinnings: totalWinnings,
            totalEvents: winnings.length,
            winnings: winnings.map(win => ({
                id: win.id,
                position: win.position,
                prizeAmount: win.prizeAmount,
                winnedAt: win.winnedAt,
                event: win.event,
            })),
        };
    }
}
