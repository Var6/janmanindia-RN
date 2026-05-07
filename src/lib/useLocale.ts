import { useEffect, useState } from 'react';
import { getLocale, onLocaleChange, t as tFn, Locale } from './i18n';

/** React hook so screens re-render when the user picks a new language
 *  in Profile. The hook itself doesn't return `t` — that stays a plain
 *  import — but reading `locale` makes the component re-render after
 *  setLocale() fires. */
export function useLocale(): Locale {
  const [locale, setLoc] = useState<Locale>(getLocale());
  useEffect(() => onLocaleChange(() => setLoc(getLocale())), []);
  return locale;
}

export const t = tFn;
