import { useFormValue, type StringInputProps } from 'sanity';
import { IntentLink } from 'sanity/router';
import { Card, Stack, Text } from '@sanity/ui';
export function EventTipStatusInput(_props: StringInputProps) {
  const doc = useFormValue([]) as any;
  return <Card padding={3} border tone={doc.promoted ? 'positive':'primary'}><Stack space={3}>
    <Text size={1}>{doc.promoted ? 'A naptári esemény piszkozata elkészült. A tipp átvétele önmagában nem teszi közzé az eseményt.' : 'Válassz: közösségi tippként hagyod jóvá a kapcsolóval és közzéteszed, vagy a lenti „Naptári esemény…” gombbal teljes esemény piszkozatát készíted el.'}</Text>
    {doc.promotedEventId && <IntentLink intent="edit" params={{id:doc.promotedEventId,type:'event'}}>Elkészült esemény megnyitása és befejezése</IntentLink>}
  </Stack></Card>;
}
