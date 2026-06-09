import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../../packages/shared/locales/${locale}.json`)).default,
}));
