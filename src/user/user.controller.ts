import { Controller, Get, Injectable, Logger, UseGuards } from '@nestjs/common';
import { Roles, Role } from 'src/application/common/decorator/roles.decorator';
import { JwtGuard } from '../application/common/guards/jwt.guard';
import { RolesGuard } from '../application/common/guards/roles.guard';
import { UserService } from './user.service';
import { GetUser } from 'src/application/common/decorator/get-user.decorator';
@Controller("api/user")

@UseGuards(JwtGuard, RolesGuard)
export class UserController {
    private readonly logger = new Logger(UserController.name);
    constructor(private readonly userService: UserService) {
    
        
    }
    @Get('me')
    @Roles(Role.USER, Role.ADMIN)
    async getUserMe(
        @GetUser('sub') userId: string,
    ) {
        this.logger.log(`User ${userId} requested profile information`);
        const data =  await this.userService.getUserMe(userId);
        return {
            status: 'success',
            data: data,
        };
    }
}
