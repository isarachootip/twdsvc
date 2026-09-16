import { SetMetadata } from '@nestjs/common';
import { MenuKey } from '@svcm/shared';

export const REQUIRE_MENU_KEY = 'require_menu';
export const RequireMenu = (menuKey: MenuKey) =>
  SetMetadata(REQUIRE_MENU_KEY, menuKey);
