import { useState } from 'react';
import { useClient } from 'sanity';
import { useToast } from '@sanity/ui';
import { slugify } from '../lib/slugify';

const key = () => Math.random().toString(36).slice(2, 10);

// Studio-művelet: egy beküldött slammer-jelentkezésből teljes értékű `slammer`
// dokumentumot hoz létre (a fő bázisba), majd a jelentkezést „feldolgozott"-ra állítja.
// Így a jóváhagyott slammer azonnal a normál Slammerek közé kerül, teljes szerkesztéssel.
export function promoteSlammerAction(props: any) {
  const { type, published, draft, onComplete } = props;
  const client = useClient({ apiVersion: '2024-01-01' });
  const toast = useToast();
  const [running, setRunning] = useState(false);

  if (type !== 'slammerApplication') return null;
  const doc = published || draft;
  const alreadyPromoted = !!doc?.promoted;

  return {
    label: alreadyPromoted ? 'Már slammerré alakítva' : 'Slammerré alakítás',
    tone: 'positive' as const,
    disabled: running || !doc || alreadyPromoted,
    onHandle: async () => {
      setRunning(true);
      try {
        const name = String(doc.stageName || doc.realName || 'Névtelen slammer').trim();
        const base = slugify(name) || 'slammer';
        let slug = base;
        const taken = await client.fetch('count(*[_type=="slammer" && slug.current==$s])', { s: slug });
        if (taken > 0) slug = `${base}-${key().slice(0, 4)}`;

        const slammer: any = {
          _type: 'slammer',
          name,
          slug: { _type: 'slug', current: slug },
          featured: false,
        };
        if (doc.photo?.asset) {
          slammer.photo = {
            _type: 'image',
            asset: doc.photo.asset,
            ...(doc.photo.hotspot ? { hotspot: doc.photo.hotspot } : {}),
            ...(doc.photo.crop ? { crop: doc.photo.crop } : {}),
            alt: name,
          };
        }
        if (doc.description) {
          slammer.bio = [{
            _type: 'block', _key: key(), style: 'normal', markDefs: [],
            children: [{ _type: 'span', _key: key(), text: String(doc.description), marks: [] }],
          }];
        }
        if (doc.youtubeUrl) slammer.videos = [doc.youtubeUrl];

        const created = await client.create(slammer);
        await client
          .patch(String(doc._id).replace(/^drafts\./, ''))
          .set({ promoted: true, approved: true, promotedSlammerId: created._id })
          .commit();

        toast.push({ status: 'success', title: 'Slammerré alakítva', description: `${name} bekerült a Slammerek közé.` });
        onComplete();
      } catch (e: any) {
        toast.push({ status: 'error', title: 'Hiba a slammerré alakításkor', description: e?.message || 'Ismeretlen hiba' });
      } finally {
        setRunning(false);
      }
    },
  };
}
