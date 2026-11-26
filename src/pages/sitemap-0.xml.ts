import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { buildSitemap, DISCOVERY_QUERY } from '../lib/discovery';
export const prerender = false;
export const GET: APIRoute = async () => {
  try {
    const docs = await sanityClient.fetch(DISCOVERY_QUERY);
    return new Response(buildSitemap(docs), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300' } });
  } catch {
    return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Retry-After': '300' } });
  }
};
