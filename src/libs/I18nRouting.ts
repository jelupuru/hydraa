import { defineRouting } from 'next-intl/routing';
import { AppConfig } from '@/utils/AppConfig';

export const routing = defineRouting({
  locales: AppConfig.locales,
  defaultLocale: AppConfig.defaultLocale,
});