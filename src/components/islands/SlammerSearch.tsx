import { useState } from 'react';
import type { SlammerListItem } from '../../sanity/lib/api';
import { filterSlammers } from './searchSlammers';
import { urlForImage } from '../../sanity/lib/image';
import { t } from '../../i18n/ui';
import type { Lang } from '../../i18n';

export default function SlammerSearch({ slammers, lang = 'hu' }: { slammers: SlammerListItem[]; lang?: Lang }) {
  const [q, setQ] = useState('');
  const filtered = filterSlammers(slammers, q);
  const hrefFor = (slug: string) => (lang === 'en' ? `/en/slammerek/${slug}` : `/slammerek/${slug}`);
  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t(lang, 'slammers.searchPlaceholder')}
        className="mb-8 w-full rounded-lg border border-ink/15 px-4 py-3 text-base outline-none focus:border-accent"
        aria-label={t(lang, 'slammers.searchAriaLabel')}
      />
      {filtered.length === 0 ? (
        <p className="text-muted">{t(lang, 'slammers.noResults')}</p>
      ) : (
        <div className="grid gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((s) => (
            <a key={s._id} href={hrefFor(s.slug)} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink/5">
                {s.photo && <img src={urlForImage(s.photo).width(400).height(533).url()} alt={s.name} loading="lazy" decoding="async" width={400} height={533} className="h-full w-full object-cover grayscale brightness-90 transition duration-500 group-hover:scale-105 group-hover:brightness-110" />}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-60" style={{ background: '#14b8a6', mixBlendMode: 'color' }} />
              </div>
              <h3 className="mt-2 font-display text-lg group-hover:text-accent">{s.name}</h3>
              {s.hometown && <p className="text-sm text-muted">{s.hometown}</p>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
