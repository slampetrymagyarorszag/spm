import { useEffect, useState } from 'react';

export type FeaturedItem = {
  name: string;
  slug: string;
  hometown?: string;
  photoUrl?: string;
};

// Interaktív, vízszintesen kitáruló slammer-galéria. Desktopon hoverre nyílik és
// kattintásra a profilra navigál. Érintőképernyőn KÉT lépés: az első koppintás
// kibontja a panelt (megmutatja az arcot + nevet), a második megnyitja a profilt.
export default function FeaturedSlammers({ slammers, lang = 'hu' }: { slammers: FeaturedItem[]; lang?: 'hu' | 'en' }) {
  const [active, setActive] = useState(0);
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches);
  }, []);
  if (!slammers.length) return null;

  // Mobilon az akkordeon zsúfolt: 11 csempéből az aktív panel alig kap helyet, és a
  // „Megnyitom" levágódik. Érintőn ezért csak az első néhányat mutatjuk — a többi az
  // „Összes slammer" oldalon érhető el. Desktopon marad a teljes sor.
  const list = isTouch ? slammers.slice(0, 4) : slammers;

  return (
    <div className="flex h-[360px] w-full gap-2 overflow-hidden md:h-[440px]">
      {list.map((s, i) => {
        const isActive = active === i;
        return (
          <a
            key={s.slug}
            href={lang === 'en' ? `/en/slammerek/${s.slug}` : `/slammerek/${s.slug}`}
            onMouseEnter={() => { if (!isTouch) setActive(i); }}
            onFocus={() => setActive(i)}
            onClick={(e) => { if (isTouch && !isActive) { e.preventDefault(); setActive(i); } }}
            aria-label={s.name}
            className="group relative block overflow-hidden rounded-xl outline-none ring-accent transition-[flex-grow] duration-700 ease-out focus-visible:ring-2"
            style={{
              // Érintőn az aktív panel domináns (hogy a teljes arc + név + „Megnyitom" elférjen),
              // a többi vékony sliver. Desktopon a finomabb 7:1 arány marad.
              flex: isActive ? (isTouch ? '22 1 0%' : '7 1 0%') : '1 1 0%',
              minWidth: isActive ? undefined : (isTouch ? 38 : 56),
            }}
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
                  // A fotókat egységesen fekete-fehérré tesszük (a beküldött színes is illeszkedjen),
                  // a fényerő a működő eszköz: a nem-aktív tompább, az aktív felragyog.
                  filter: isActive ? 'grayscale(1) brightness(1.15) contrast(1.05)' : 'grayscale(1) brightness(0.5)',
                  transform: isActive ? 'scale(1)' : 'scale(1.05)',
                }}
              />
            )}
            {/* brand-színű duotone festés hoverre (mix-blend: color) — türkiz, könnyen átírható */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-500"
              style={{ background: '#14b8a6', mixBlendMode: 'color', opacity: isActive ? 0.6 : 0 }}
            />
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
              {isTouch && isActive && (
                <span className="mt-2 inline-block whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-semibold text-ink">
                  {lang === 'en' ? 'Open profile →' : 'Megnyitom →'}
                </span>
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
