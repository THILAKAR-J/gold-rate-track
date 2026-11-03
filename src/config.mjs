// Site-wide settings. Values in [brackets] must be replaced before launch.
export const site = {
  name: 'Gold Rate Track',
  shortName: 'GoldRateTrack',
  domain: 'goldratetrack.com',
  legalName: '[Company or owner legal name]',
  email: 'contact@goldratetrack.com',
  // Search engines are told not to index the site until this is true.
  // Turn it on (SITE_INDEX=true) only on the real domain, with real rates and legal details in place.
  index: process.env.SITE_INDEX === 'true',
  // Ads stay off at launch (plan: switch on after AdSense approval, week 3 to 4).
  // ADSENSE_CLIENT=ca-pub-... turns on the reserved slots.
  adsenseClient: process.env.ADSENSE_CLIENT || ''
};
