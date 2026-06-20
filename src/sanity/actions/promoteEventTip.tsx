import { useState } from 'react';
import { useClient } from 'sanity';
import { useToast } from '@sanity/ui';
import { slugify } from '../lib/slugify';

const key = () => Math.random().toString(36).slice(2, 10);

// Studio-művelet: egy beküldött esemény-tippből teljes értékű `event` dokumentumot
// hoz létre (a fő rendszerbe, naptárban is megjelenik), majd a tippet „feldolgozott"-ra
// állítja. Az időpont kezdőértéke „most" — a szerkesztő utána beállítja a valódi dátumot.
export function promoteEventTipAction(props: any) {
  const { type, published, draft, onComplete } = props;
  const client = useClient({ apiVersion: '2024-01-01' });
  const toast = useToast();
  const [running, setRunning] = useState(false);

  if (type !== 'eventTip') return null;
  const doc = published || draft;
  const alreadyPromoted = !!doc?.promoted;

  return {
    label: alreadyPromoted ? 'Már eseménnyé alakítva' : 'Eseménnyé alakítás (naptárba)',
    tone: 'positive' as const,
    disabled: running || !doc || alreadyPromoted,
    onHandle: async () => {
      setRunning(true);
      try {
        const title = String(doc.eventName || 'Esemény').trim();
        const base = slugify(title) || 'esemeny';
        let slug = base;
        const taken = await client.fetch('count(*[_type=="event" && slug.current==$s])', { s: slug });
        if (taken > 0) slug = `${base}-${key().slice(0, 4)}`;

        const event: any = {
          _type: 'event',
          title,
          slug: { _type: 'slug', current: slug },
          // Helykitöltő időpont — a szerkesztő állítsa be a valódi dátumot.
          startsAt: new Date().toISOString(),
        };
        if (doc.facebookUrl) event.facebookEventUrl = doc.facebookUrl;
        if (doc.description) {
          event.description = [{
            _type: 'block', _key: key(), style: 'normal', markDefs: [],
            children: [{ _type: 'span', _key: key(), text: String(doc.description), marks: [] }],
          }];
        }

        const created = await client.create(event);
        await client
          .patch(String(doc._id).replace(/^drafts\./, ''))
          .set({ promoted: true, promotedEventId: created._id })
          .commit();

        toast.push({
          status: 'success',
          title: 'Eseménnyé alakítva',
          description: 'Bekerült a naptárba. NE feledd beállítani a valódi időpontot!',
        });
        onComplete();
      } catch (e: any) {
        toast.push({ status: 'error', title: 'Hiba az eseménnyé alakításkor', description: e?.message || 'Ismeretlen hiba' });
      } finally {
        setRunning(false);
      }
    },
  };
}
