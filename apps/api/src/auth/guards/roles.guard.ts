import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@svcm/shared';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN_ROLE',
          message: 'ไม่มีสิทธิ์เข้าถึงส่วนนี้',
        },
      });
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `สิทธิ์ของคุณ (${user.role}) ไม่สามารถเข้าถึงส่วนนี้ได้`,
        },
      });
    }

    return true;
  }
}
