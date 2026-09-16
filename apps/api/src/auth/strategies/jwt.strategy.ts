import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.svcm_access_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'svcm_super_secret_jwt_key_for_dev_only_change_in_prod',
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        site: true,
        vendorCenter: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'ผู้ใช้งานไม่มีอยู่ในระบบหรือถูกระงับการใช้งาน',
      });
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      siteId: user.siteId,
      site: user.site,
      vendorCenterId: user.vendorCenterId,
      vendorCenter: user.vendorCenter,
      active: user.active,
    };
  }
}
