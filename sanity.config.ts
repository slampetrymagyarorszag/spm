import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';
import { promoteSlammerAction } from './src/sanity/actions/promoteSlammer';
import { promoteEventTipAction } from './src/sanity/actions/promoteEventTip';
import { SubmissionsExportTool } from './src/sanity/tools/SubmissionsExportTool';

const projectId =
  (import.meta as any).env?.PUBLIC_SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID!;
const dataset =
  (import.meta as any).env?.PUBLIC_SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET!;

export default defineConfig({
  projectId,
  dataset,
  plugins: [structureTool({ structure })],
  tools: (prev) => [
    ...prev,
    { name: 'jelentkezesek-export', title: 'Jelentkezések export', component: SubmissionsExportTool },
  ],
  schema: { types: schemaTypes },
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'slammerApplication') return [...prev, promoteSlammerAction];
      if (context.schemaType === 'eventTip') return [...prev, promoteEventTipAction];
      return prev;
    },
  },
});
