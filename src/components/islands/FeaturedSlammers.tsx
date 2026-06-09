import { useState } from 'react';

export type FeaturedItem = {
  name: string;
  slug: string;
  hometown?: string;
  photoUrl?: string;
};

// Interaktív, vízszintesen kitáruló slammer-galéria (hoverre/fókuszra kinyílik a panel,
// kattintásra a profilra navigál). A InteractiveSelector ötlet alapján, a brandhez igazítva.
export default function FeaturedSlammers({ slammers }: { slammers: FeaturedItem[] }) {
  const [active, setActive] = useState(0);
  if (!slammers.length) return null;

  return (
    <div className="flex h-[360px] w-full gap-2 overflow-hidden md:h-[440px]">
      {slammers.map((s, i) => {
        const isActive = active === i;
        return (
          <a
            key={s.slug}
            href={`/slammerek/${s.slug}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            aria-label={s.name}
            className="group relative block overflow-hidden rounded-xl outline-none ring-accent transition-[flex-grow] duration-700 ease-out focus-visible:ring-2"
            style={{ flex: isActive ? '7 1 0%' : '1 1 0%', minWidth: 56 }}
          >
            {s.photoUrl && (
              <img
                src={s.photoUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out"
                style={{
                  // Alapból fekete-fehér, hoverre/fókuszra teljes szín.
                  filter: isActive ? 'grayscale(0%) brightness(1)' : 'grayscale(100%) brightness(0.7)',
                  transform: isActive ? 'scale(1)' : 'scale(1.05)',
                }}
              />
            )}
            {/* sötét gradiens overlay az olvashatóságért */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-[#111114]/30 to-transparent"></div>

            {/* aktív panel: név + város alul */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p
                className="font-display text-xl leading-tight text-white transition-all duration-500 ease-out md:text-2xl"
                style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(14px)' }}
              >
                {s.name}
              </p>
              {s.hometown && (
                <p
                  className="text-sm text-white/70 transition-all delay-75 duration-500 ease-out"
                  style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(14px)' }}
                >
                  {s.hometown}
                </p>
              )}
            </div>

            {/* összecsukott panel: függőleges név-címke */}
            <span
              className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-xs uppercase tracking-wide text-white/70 transition-opacity duration-300 [writing-mode:vertical-rl]"
              style={{ opacity: isActive ? 0 : 1 }}
            >
              {s.name}
            </span>
          </a>
        );
      })}
    </div>
  );
}
