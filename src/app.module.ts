import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { S3Module } from './s3/s3.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [AuthModule, PrismaModule, UserModule, EventModule, S3Module, WalletModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
