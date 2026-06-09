import { useState } from 'react';
import type { SlammerListItem } from '../../sanity/lib/api';
import { filterSlammers } from './searchSlammers';
import { urlForImage } from '../../sanity/lib/image';

export default function SlammerSearch({ slammers }: { slammers: SlammerListItem[] }) {
  const [q, setQ] = useState('');
  const filtered = filterSlammers(slammers, q);
  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Keresés név vagy város szerint…"
        className="mb-8 w-full rounded-lg border border-ink/15 px-4 py-3 text-base outline-none focus:border-accent"
        aria-label="Slammer keresése"
      />
      {filtered.length === 0 ? (
        <p className="text-muted">Nincs találat.</p>
      ) : (
        <div className="grid gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((s) => (
            <a key={s._id} href={`/slammerek/${s.slug}`} className="group block">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-ink/5">
                {s.photo && <img src={urlForImage(s.photo).width(400).height(533).url()} alt={s.name} loading="lazy" decoding="async" width={400} height={533} className="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" />}
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
