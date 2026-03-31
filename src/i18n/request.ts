import { getRequestConfig } from 'next-intl/server';
import { routing } from '../routing';

const messageImports: Record<string, () => Promise<any>> = {
  uz: () => import('../../messages/uz.json'),
  'uz-cyrl': () => import('../../messages/uz-cyrl.json'),
  ru: () => import('../../messages/ru.json'),
  en: () => import('../../messages/en.json'),
};

export default getRequestConfig(async (context) => {
  // Handle both string and Promise locale (Next.js 14 vs 15 compatibility)
  const locale = context.locale;
  const resolvedLocale = (typeof locale === 'string' ? locale : await locale) || routing.defaultLocale;
  
  const targetLocale = routing.locales.includes(resolvedLocale as any) 
    ? resolvedLocale 
    : routing.defaultLocale;

  // IMPORTANT: Enhanced logging for debugging locale loading issues
  console.info(`[i18n-debug] Resolved Locale: "${resolvedLocale}" -> Target: "${targetLocale}"`);

  let messages;
  try {
    const importFn = messageImports[targetLocale] || messageImports[routing.defaultLocale];
    const module = await importFn();
    messages = module.default || module;
    
    if (!messages) throw new Error("No messages found in module");
    
  } catch (error) {
    console.error(`[i18n-error] Failed to load messages for "${targetLocale}":`, error);
    // Absolute fallback to default locale (uz)
    const fallbackModule = await messageImports[routing.defaultLocale]();
    messages = fallbackModule.default || fallbackModule;
  }

  return {
    locale: targetLocale,
    messages
  };
});
