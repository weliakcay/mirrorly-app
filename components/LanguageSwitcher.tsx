import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { LANGS } from '../i18n';

const LanguageSwitcher = ({ className = '' }: { className?: string }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => i18n.language?.startsWith(l.code)) || LANGS[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Dil / Language"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-mirrorly-gold/40 bg-mirrorly-cream/70 px-3 py-1.5 text-sm font-medium text-mirrorly-black hover:border-mirrorly-gold hover:bg-mirrorly-cream transition-colors"
      >
        <Globe className="w-4 h-4 text-mirrorly-gold" />
        {current.short}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-40 rounded-2xl border border-mirrorly-paper bg-white shadow-xl py-1.5 z-[60] overflow-hidden"
        >
          {LANGS.map((l) => {
            const active = l.code === current.code;
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => pick(l.code)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left transition-colors ${
                    active ? 'text-mirrorly-gold font-semibold' : 'text-mirrorly-stone hover:bg-mirrorly-cream'
                  }`}
                >
                  {l.label}
                  {active && <Check className="w-4 h-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
