import { useState } from 'react';
import { useClient } from 'sanity';
import { useToast } from '@sanity/ui';
import { promoteEventTipDocument } from '../lib/promoteEventTip';
export function promoteEventTipAction(props: any) {
  const client = useClient({apiVersion:'2024-01-01'});
  const toast = useToast();
  const [running,setRunning] = useState(false);
  const doc = props.draft || props.published;
  if (props.type !== 'eventTip') return null;
  return {label: doc?.promoted || props.published?.promoted ? 'Eseménypiszkozat már elkészült' : 'Naptári esemény piszkozatának létrehozása', tone:'positive' as const, disabled:running || !doc || !!doc.promoted || !!props.published?.promoted,
    onHandle:async () => {
      setRunning(true);
      try {await promoteEventTipDocument(client,doc);toast.push({status:'success',title:'Elkészült az eseménypiszkozat',description:'Nyisd meg az eseményt, add meg a kezdést és a borítót, majd tedd közzé.'});props.onComplete();}
      catch(e:any) {toast.push({status:'error',title:'Nem sikerült az átvétel',description:e.message});}
      finally {setRunning(false);}
    }};
}
