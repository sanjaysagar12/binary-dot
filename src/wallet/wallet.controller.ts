import { Controller, Get, Post, Put, Body, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtGuard } from '../application/common/guards/jwt.guard';
import { GetUser } from 'src/application/common/decorator/get-user.decorator';

@Controller('api/wallet')
export class WalletController {
    private readonly logger = new Logger(WalletController.name);
    
    constructor(private readonly walletService: WalletService) {}

    @Get('info')
    @UseGuards(JwtGuard)
    async getUserWallet(@GetUser('sub') userId: string) {
        this.logger.log(`Fetching wallet info for user: ${userId}`);
        try {
            const data = await this.walletService.getUserWallet(userId);
            return {
                status: 'success',
                data: data,
            };
        } catch (error) {
            this.logger.error(`Error fetching wallet info: ${error.message}`);
            throw new BadRequestException(error.message);
        }
    }

    @Post('create')
    @UseGuards(JwtGuard)
    async createUserWallet(
        @GetUser('sub') userId: string,
        @Body() body: { walletAddress: string }
    ) {
        this.logger.log(`Creating wallet for user: ${userId}`);
        
        if (!body.walletAddress) {
            throw new BadRequestException('Wallet address is required');
        }

        try {
            const data = await this.walletService.createUserWallet(userId, body.walletAddress);
            return {
                status: 'success',
                message: 'Wallet created successfully',
                data: data,
            };
        } catch (error) {
            this.logger.error(`Error creating wallet: ${error.message}`);
            throw new BadRequestException(error.message);
        }
    }

    @Put('update')
    @UseGuards(JwtGuard)
    async updateUserWallet(
        @GetUser('sub') userId: string,
        @Body() body: { walletAddress: string }
    ) {
        this.logger.log(`Updating wallet for user: ${userId}`);
        
        if (!body.walletAddress) {
            throw new BadRequestException('Wallet address is required');
        }

        try {
            const data = await this.walletService.updateUserWallet(userId, body.walletAddress);
            return {
                status: 'success',
                message: 'Wallet updated successfully',
                data: data,
            };
        } catch (error) {
            this.logger.error(`Error updating wallet: ${error.message}`);
            throw new BadRequestException(error.message);
        }
    }

    @Get('winnings')
    @UseGuards(JwtGuard)
    async getUserWinnings(@GetUser('sub') userId: string) {
        this.logger.log(`Fetching winnings for user: ${userId}`);
        try {
            const data = await this.walletService.getUserWinnings(userId);
            return {
                status: 'success',
                data: data,
            };
        } catch (error) {
            this.logger.error(`Error fetching winnings: ${error.message}`);
            throw new BadRequestException(error.message);
        }
    }
}
