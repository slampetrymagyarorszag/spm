import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { buildLlmsFull, DISCOVERY_QUERY } from '../lib/discovery';
export const prerender = false;
export const GET: APIRoute = async () => {
  try {
    return new Response(buildLlmsFull(await sanityClient.fetch(DISCOVERY_QUERY)), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300' } });
  } catch {
    return new Response('Public content index temporarily unavailable', { status: 503, headers: { 'Retry-After': '300' } });
  }
};
