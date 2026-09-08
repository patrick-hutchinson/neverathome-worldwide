const internalPageRoutes = {
  aboutPage: "/about",
  destination: "/destinations",
  destinationsPage: "/destinations",
  homePage: "/",
  imprint: "/imprint",
  juryPage: "/jury",
  infoPage: "/info",
};

export function getMailtoHref(email) {
  if (!email) return null;
  if (/^mailto:/i.test(email)) return email;

  return `mailto:${email}`;
}

export function getInternalHref(internalLink) {
  const type = internalLink?._type;
  if (type && internalPageRoutes[type]) return internalPageRoutes[type];

  return null;
}

export function getLinkHref(link) {
  if (!link) return null;

  if (link.type === "email") return getMailtoHref(link.email);
  if (link.type === "external") return link.url || null;
  if (link.type === "internal") return getInternalHref(link.internalLink);

  return null;
}
