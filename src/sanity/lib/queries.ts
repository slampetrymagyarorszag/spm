export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  title, accentColor, contactEmail,
  "logoUrl": logo.asset->url,
  nav[]{ label, href },
  social
}`;
