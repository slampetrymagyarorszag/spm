import { createClient } from '@sanity/client';

// Szerver-oldali írókliens a látogatói űrlap-beküldésekhez (pl. esemény-tipp).
// Külön, MINIMÁLIS jogú token: SANITY_FORM_TOKEN — elkülönítve a migrációs
// SANITY_WRITE_TOKEN-től. Ez kerülhet a Vercelre (a migrációs token nem).
const projectId =
  (import.meta as any).env?.PUBLIC_SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset =
  (import.meta as any).env?.PUBLIC_SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET;
const token =
  (import.meta as any).env?.SANITY_FORM_TOKEN ?? process.env.SANITY_FORM_TOKEN;

export const hasWriteToken = Boolean(token);

export const writeClient = token
  ? createClient({ projectId, dataset, token, useCdn: false, apiVersion: '2024-01-01' })
  : null;
