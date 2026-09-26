import { useState } from 'react';
import { useClient } from 'sanity';
import { useToast } from '@sanity/ui';
import { slugify } from '../lib/slugify';

const key = () => Math.random().toString(36).slice(2, 10);

// Studio-művelet: egy beküldött esemény-tippből teljes értékű `event` dokumentumot
// hoz létre piszkozatként. Csak a dátum és borító ellenőrzése utáni publikáláskor jelenik meg.
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

        const sourceId = String(doc._id).replace(/^drafts\./, '');
        const targetId = `event-from-${sourceId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
        const event: any = {
          _id: `drafts.${targetId}`,
          _type: 'event',
          title,
          slug: { _type: 'slug', current: slug },
        };
        if (doc.facebookUrl) event.facebookEventUrl = doc.facebookUrl;
        if (doc.ticketUrl) event.ticketUrl = doc.ticketUrl;
        if (doc.description) {
          event.description = [{
            _type: 'block', _key: key(), style: 'normal', markDefs: [],
            children: [{ _type: 'span', _key: key(), text: String(doc.description), marks: [] }],
          }];
        }

        await client.transaction()
          .createIfNotExists(event)
          .patch(sourceId, (p) => p.set({ promoted: true, promotedEventId: targetId }))
          .commit();

        toast.push({
          status: 'success',
          title: 'Eseménypiszkozat elkészült',
          description: 'Az Események között állítsd be a valódi dátumot és a borítót, majd publikáld.',
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
