import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from "../application/common/guards/roles.guard";
import { Reflector } from "@nestjs/core";
import { GoogleStrategy } from "src/application/common/stategies/google.strategy";


@Module({
  imports: [  
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),],
  controllers: [AuthController],
  providers: [
    AuthService,
    RolesGuard,
    GoogleStrategy,
    Reflector
  ],
  exports: [RolesGuard]
})
export class AuthModule {}