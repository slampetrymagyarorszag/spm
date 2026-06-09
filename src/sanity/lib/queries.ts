export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  title, accentColor, contactEmail,
  "logoUrl": logo.asset->url,
  nav[]{ label, href },
  social, impressum, home, monthlyContest,
  championshipCtaEnabled, championshipCtaLabel, championshipCtaUrl, championshipCtaFrom, championshipCtaTo
}`;

// Csak a már megjelent (nem jövőbeli dátumú) hírek — időzített megjelenés.
export const POSTS_QUERY = `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc){
  _id, title, "slug": slug.current, publishedAt, author, excerpt, cover
}`;
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, publishedAt, author, excerpt, cover, tags, body,
  seo{ metaTitle, metaDescription, shareImage }
}`;

export const SLAMMERS_QUERY = `*[_type == "slammer" && defined(slug.current)] | order(name asc){
  _id, name, "slug": slug.current, hometown, photo
}`;
export const SLAMMER_BY_SLUG_QUERY = `*[_type == "slammer" && slug.current == $slug][0]{
  _id, name, "slug": slug.current, hometown, photo, bio, achievements, videos, social
}`;
export const SLAMMERS_FEATURED_QUERY = `*[_type == "slammer" && featured == true && defined(slug.current)] | order(featuredOrder asc, name asc){
  _id, name, "slug": slug.current, hometown, photo
}`;

export const EVENTS_QUERY = `*[_type == "event" && defined(slug.current)]{
  _id, title, "slug": slug.current, startsAt, cover, accentColor, location
}`;
export const EVENT_BY_SLUG_QUERY = `*[_type == "event" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, startsAt, cover, accentColor, location, description,
  ticketUrl, facebookEventUrl, registrationEnabled, championshipRegistration, registrationDeadline,
  performers[]->{ _id, name, "slug": slug.current, photo }
}`;

export const MEDIA_QUERY = `*[_type == "mediaItem"] | order(year desc, _createdAt desc){
  _id, title, kind, youtubeUrl, image, albumUrl, albumCover, year
}`;

// Csak a szerkesztő által jóváhagyott, beküldött esemény-tippek.
export const EVENT_TIPS_QUERY = `*[_type == "eventTip" && approved == true] | order(submittedAt desc){
  _id, eventName, description, facebookUrl
}`;

// Csak a jóváhagyott, beküldött slammer-jelentkezések.
export const SLAMMER_APPLICATIONS_QUERY = `*[_type == "slammerApplication" && approved == true] | order(submittedAt desc){
  _id, realName, stageName, description, youtubeUrl, photo
}`;

export const PAGE_BY_SLUG_QUERY = `*[_type == "page" && slug.current == $slug][0]{
  title, lead, body, seo{ metaTitle, metaDescription, shareImage }
}`;
