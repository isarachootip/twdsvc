import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginRequest,
  Role,
  DEFAULT_ROLE_MENUS,
  MenuKey,
} from '@svcm/shared';
import * as bcrypt from 'bcryptjs';
import {
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
} from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(loginDto: LoginRequest): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
      include: {
        site: true,
        vendorCenter: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        },
      });
    }

    if (!user.active) {
      throw new UnauthorizedException({
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'บัญชีผู้ใช้นี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
        },
      });
    }

    // Check account lockout (15 minutes lockout after 5 failures)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      throw new UnauthorizedException({
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `บัญชีถูกระงับชั่วคราวเนื่องจากใส่รหัสผ่านผิดเกิน 5 ครั้ง กรุณารอสักครู่ (เหลืออีกประมาณ ${remainingMinutes} นาที)`,
        },
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isMatch) {
      const newAttempts = user.failedLoginAttempts + 1;
      let lockDate: Date | null = null;

      if (newAttempts >= 5) {
        lockDate = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: lockDate,
        },
      });

      if (newAttempts >= 5) {
        throw new UnauthorizedException({
          error: {
            code: 'ACCOUNT_LOCKED',
            message:
              'คุณใส่รหัสผ่านผิดเกิน 5 ครั้ง บัญชีจึงถูกระงับการเข้าสู่ระบบชั่วคราวเป็นเวลา 15 นาที',
          },
        });
      }

      throw new UnauthorizedException({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ใส่ผิดครั้งที่ ${newAttempts}/5)`,
        },
      });
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    return user;
  }

  async login(loginDto: LoginRequest) {
    const user = await this.validateUser(loginDto);

    const accessSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'svcm_super_secret_jwt_key_for_dev_only_change_in_prod';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'svcm_super_secret_refresh_jwt_key_for_dev_only';

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: JWT_ACCESS_EXPIRY,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: refreshSecret,
        expiresIn: JWT_REFRESH_EXPIRY,
      }
    );

    // Store hashed refresh token in database
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        siteId: user.siteId,
        siteName: user.site?.name || null,
        siteType: user.site?.type || null,
        vendorCenterId: user.vendorCenterId,
        vendorCenterName:
          user.vendorCenter?.vendor?.name || user.vendorCenter?.code || null,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'svcm_super_secret_refresh_jwt_key_for_dev_only';

      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.active || !user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const isMatch = await bcrypt.compare(
        refreshToken,
        user.refreshTokenHash
      );
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessSecret =
        this.configService.get<string>('JWT_SECRET') ||
        'svcm_super_secret_jwt_key_for_dev_only_change_in_prod';

      const newAccessToken = this.jwtService.sign(
        {
          sub: user.id,
          username: user.username,
          role: user.role,
        },
        {
          secret: accessSecret,
          expiresIn: JWT_ACCESS_EXPIRY,
        }
      );

      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, type: 'refresh' },
        {
          secret: refreshSecret,
          expiresIn: JWT_REFRESH_EXPIRY,
        }
      );

      const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: newRefreshHash },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        site: true,
        vendorCenter: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Resolve menus
    const customPerms = await this.prisma.roleMenuPermission.findMany({
      where: { role: user.role },
    });

    let allowedMenus: MenuKey[];
    if (customPerms.length > 0) {
      allowedMenus = customPerms
        .filter((p) => p.allowed)
        .map((p) => p.menuKey as MenuKey);
    } else {
      allowedMenus = DEFAULT_ROLE_MENUS[user.role as Role] || [];
    }

    // Resolve canViewCost
    const dataPerm = await this.prisma.roleDataPermission.findUnique({
      where: { role: user.role },
    });
    const canViewCost =
      dataPerm?.canViewCost ??
      (user.role === 'ADMIN' || user.role === 'EXECUTIVE');

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      siteId: user.siteId,
      site: user.site
        ? {
            id: user.site.id,
            code: user.site.code,
            name: user.site.name,
            type: user.site.type,
          }
        : null,
      vendorCenterId: user.vendorCenterId,
      vendorCenter: user.vendorCenter
        ? {
            id: user.vendorCenter.id,
            code: user.vendorCenter.code,
            name:
              user.vendorCenter.vendor?.name || user.vendorCenter.code,
          }
        : null,
      menus: allowedMenus,
      canViewCost,
    };
  }
}
