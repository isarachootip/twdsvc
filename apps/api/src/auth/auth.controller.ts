import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  LoginRequestSchema,
  LoginRequest,
  AuthUser,
} from '@svcm/shared';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE,
} from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const parseResult = LoginRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง',
        },
      });
    }

    const result = await this.authService.login(parseResult.data);

    // Set refresh token as httpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: '/',
    });

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    const result = await this.authService.refresh(refreshToken);

    // Set rotated refresh cookie
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: '/',
    });

    return {
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      // Invalidate if decoded sub exists
      try {
        const decoded: any = (req as any).user;
        if (decoded?.id) {
          await this.authService.logout(decoded.id);
        }
      } catch {
        // ignore
      }
    }

    // Clear refresh cookie
    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: '/',
    });
  }
}

@Controller('me')
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.id);
  }
}
