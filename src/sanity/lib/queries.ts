export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  title, accentColor, contactEmail,
  "logoUrl": logo.asset->url,
  nav[]{ label, href },
  social
}`;

export const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc){
  _id, title, "slug": slug.current, publishedAt, author, excerpt, cover
}`;
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, publishedAt, author, excerpt, cover, tags, body
}`;
