import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MENU_KEY } from '../decorators/require-menu.decorator';
import { MenuKey, canAccessMenu } from '@svcm/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredMenu = this.reflector.getAllAndOverride<MenuKey>(
      REQUIRE_MENU_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredMenu) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN_ROLE',
          message: 'ไม่มีสิทธิ์เข้าถึงเมนูนี้',
        },
      });
    }

    // Check custom database permission first
    const customPerm = await this.prisma.roleMenuPermission.findUnique({
      where: {
        role_menuKey: {
          role: user.role,
          menuKey: requiredMenu,
        },
      },
    });

    if (customPerm) {
      if (!customPerm.allowed) {
        throw new ForbiddenException({
          error: {
            code: 'FORBIDDEN_ROLE',
            message: `สิทธิ์ของคุณ (${user.role}) ไม่สามารถเข้าถึงเมนูนี้ได้`,
          },
        });
      }
      return true;
    }

    // Fallback to default matrix rule
    const allowed = canAccessMenu(user.role, requiredMenu);
    if (!allowed) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `สิทธิ์ของคุณ (${user.role}) ไม่สามารถเข้าถึงเมนูนี้ได้`,
        },
      });
    }

    return true;
  }
}
