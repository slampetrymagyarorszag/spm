// Facebook poszt-azonosító kinyerése a különféle URL-formákból. A Graph API a
// Page-posztoknál általában a `{oldal-id}_{poszt-id}` objektum-ID-t várja; a numerikus
// részt innen vesszük, az opaque (pfbid/share) tokeneket pedig nyersen próbáljuk.
export function parseFbPostId(url?: string): string | null {
  if (!url) return null;
  const s = url.trim();
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  // permalink.php?story_fbid=...&id=...
  const story = u.searchParams.get('story_fbid');
  if (story) return story;
  // photo?fbid=...
  const fbid = u.searchParams.get('fbid');
  if (fbid) return fbid;
  // /{oldal}/posts/{id}  (numerikus vagy pfbid...)
  const posts = u.pathname.match(/\/posts\/([A-Za-z0-9]+)/);
  if (posts) return posts[1];
  // /{oldal}/videos/{id}
  const vid = u.pathname.match(/\/videos\/(\d+)/);
  if (vid) return vid[1];
  // /share/p/{token}/  (átirányítós megosztó-link)
  const share = u.pathname.match(/\/share\/(?:p|v)\/([A-Za-z0-9]+)/);
  if (share) return share[1];
  // /story.php?story_fbid=...  (a query ágat fent kezeltük)
  return null;
}

// A Graph API-nak átadandó objektum-ID jelöltek (sorrendben próbáljuk).
export function fbObjectIdCandidates(postId: string, pageId?: string): string[] {
  const out: string[] = [];
  if (pageId && /^\d+$/.test(postId)) out.push(`${pageId}_${postId}`);
  out.push(postId);
  return out;
}

// A poszt szövegéből cím + bekezdések. Az első sor (vagy első mondat) lesz a cím.
export function deriveTitleAndBody(message: string): { title: string; paragraphs: string[] } {
  const text = (message || '').trim();
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);
  let title = (text.split('\n')[0] || '').trim();
  if (title.length > 90) {
    const dot = title.slice(0, 90).lastIndexOf('. ');
    title = dot > 30 ? title.slice(0, dot + 1) : title.slice(0, 90).trim() + '…';
  }
  return { title, paragraphs };
}
