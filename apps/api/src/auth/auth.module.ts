import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController, MeController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from './guards/roles.guard';
import { MenuGuard } from './guards/menu.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'svcm_super_secret_jwt_key_for_dev_only_change_in_prod',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    MenuGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    MenuGuard,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
