import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';
import { promoteSlammerAction } from './src/sanity/actions/promoteSlammer';
import { promoteEventTipAction } from './src/sanity/actions/promoteEventTip';

const projectId =
  (import.meta as any).env?.PUBLIC_SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID!;
const dataset =
  (import.meta as any).env?.PUBLIC_SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET!;

export default defineConfig({
  projectId,
  dataset,
  plugins: [structureTool({ structure })],
  schema: { types: schemaTypes },
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'slammerApplication') return [...prev, promoteSlammerAction];
      if (context.schemaType === 'eventTip') return [...prev, promoteEventTipAction];
      return prev;
    },
  },
});
