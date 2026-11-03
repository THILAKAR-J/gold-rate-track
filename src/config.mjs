// Site-wide settings. Values in [brackets] must be replaced before launch.
export const site = {
  name: 'Daily Gold Rate India',
  shortName: 'Gold Rate',
  domain: 'dailygoldrateindia.com',
  // The real address. Search indexing turns on only when the site is built for this URL with real (non-sample) rates.
  url: 'https://dailygoldrateindia.com',
  legalName: '[Company or owner legal name]',
  email: 'thilakarseto@gmail.com',
  tamil: false, // Tamil pages (/ta/) and the language switch; set true to bring them back
  // Indexing: automatic on the real domain once rates are real. SITE_INDEX=false forces noindex; SITE_INDEX=true forces it on.
  indexSetting: process.env.SITE_INDEX || 'auto',
  // Ads stay off at launch (plan: switch on after AdSense approval, week 3 to 4).
  // ADSENSE_CLIENT=ca-pub-... turns on the reserved slots.
  adsenseClient: process.env.ADSENSE_CLIENT || ''
};
