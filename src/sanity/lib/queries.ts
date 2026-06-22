export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  title, accentColor, contactEmail,
  "logoUrl": logo.asset->url,
  nav[]{ label, href },
  social,
  impressum{ orgName, address, email, taxNumber, annualReportsUrl, annualReports[]{ label, "fileUrl": file.asset->url } },
  home, monthlyContest, emails,
  championshipCtaEnabled, championshipCtaLabel, championshipCtaUrl, championshipCtaFrom, championshipCtaTo
}`;

// Csak a már megjelent (nem jövőbeli dátumú) hírek — időzített megjelenés.
export const POSTS_QUERY = `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc){
  _id, title, "slug": slug.current, publishedAt, author, excerpt, cover,
  titleEn, excerptEn
}`;
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, publishedAt, author, excerpt, cover, tags, body,
  titleEn, excerptEn, bodyEn,
  seo{ metaTitle, metaDescription, shareImage }
}`;

export const SLAMMERS_QUERY = `*[_type == "slammer" && defined(slug.current)] | order(name asc){
  _id, name, "slug": slug.current, hometown, photo
}`;
export const SLAMMER_BY_SLUG_QUERY = `*[_type == "slammer" && slug.current == $slug][0]{
  _id, name, "slug": slug.current, hometown, photo, bio, achievements, videos, social,
  bioEn
}`;
export const SLAMMERS_FEATURED_QUERY = `*[_type == "slammer" && featured == true && defined(slug.current)] | order(featuredOrder asc, name asc){
  _id, name, "slug": slug.current, hometown, photo
}`;

export const EVENTS_QUERY = `*[_type == "event" && defined(slug.current)]{
  _id, title, "slug": slug.current, startsAt, cover, accentColor, location,
  titleEn
}`;
export const EVENT_BY_SLUG_QUERY = `*[_type == "event" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, startsAt, cover, accentColor, location, description,
  ticketUrl, facebookEventUrl, registrationEnabled, championshipRegistration, registrationDeadline,
  performers[]->{ _id, name, "slug": slug.current, photo },
  titleEn, descriptionEn
}`;

export const MEDIA_QUERY = `*[_type == "mediaItem"] | order(year desc, _createdAt desc){
  _id, title, kind, youtubeUrl, playlistUrl, image, albumUrl, albumCover, year
}`;

// Médiatár-konfiguráció: lejátszási listák + letölthető dokumentumok.
export const MEDIA_CONFIG_QUERY = `*[_type == "siteSettings"][0]{
  youtubePlaylists[]{ title, playlistId },
  "downloads": downloads[]{ title, description, url, "fileUrl": file.asset->url }
}`;

// Csak a szerkesztő által jóváhagyott, beküldött esemény-tippek.
export const EVENT_TIPS_QUERY = `*[_type == "eventTip" && approved == true] | order(submittedAt desc){
  _id, eventName, description, facebookUrl
}`;

// Csak a jóváhagyott, beküldött slammer-jelentkezések.
export const SLAMMER_APPLICATIONS_QUERY = `*[_type == "slammerApplication" && approved == true] | order(submittedAt desc){
  _id, realName, stageName, description, youtubeUrl, photo
}`;

// Jóváhagyott slam klubok (Slammerek → Slam klubok fül).
export const SLAM_CLUBS_QUERY = `*[_type == "slamClub" && approved == true] | order(city asc){
  _id, city, name, facebookUrl
}`;

export const PAGE_BY_SLUG_QUERY = `*[_type == "page" && slug.current == $slug][0]{
  title, lead, body, titleEn, leadEn, bodyEn, seo{ metaTitle, metaDescription, shareImage }
}`;
