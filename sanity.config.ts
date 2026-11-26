import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { huHULocale } from '@sanity/locale-hu-hu';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';
import { promoteEventTipAction } from './src/sanity/actions/promoteEventTip';
import { EditorialDashboardTool } from './src/sanity/tools/EditorialDashboardTool';
import { HelpTool } from './src/sanity/tools/HelpTool';

const projectId =
  (import.meta as any).env?.PUBLIC_SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID!;
const dataset =
  (import.meta as any).env?.PUBLIC_SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET!;

export default defineConfig({
  name: 'spm',
  title: 'SPM szerkesztőség',
  projectId,
  dataset,
  plugins: [huHULocale(), structureTool({ structure, title: 'Tartalom' })],
  tools: (prev) => [
    { name: 'attekintes', title: 'Kezdőlap', component: EditorialDashboardTool },
    ...prev.filter(tool => tool.name === 'structure'),
    { name: 'sugo', title: 'Súgó', component: HelpTool },
  ],
  schema: { types: schemaTypes },
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'slammerEditRequest') return prev.filter(action => !['publish', 'unpublish', 'duplicate'].includes(action.action || ''));
      if (context.schemaType === 'slammerApplication') return prev.filter(action => action.action !== 'duplicate');
      if (context.schemaType === 'eventTip') return [promoteEventTipAction, ...prev.filter(action => action.action !== 'duplicate')];
      return prev;
    },
  },
});
