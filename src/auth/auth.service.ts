import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService,
        private jwtService: JwtService
    ) { }
    async googleSignin(id: string, role: string) {
        const payload = { sub: id, role: role };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };  
    }
}
