// Site-wide settings. Values in [brackets] must be replaced before launch.
export const site = {
  name: 'Kanak',
  legalName: '[Company legal name]',
  // Search engines are told not to index the site until this is true.
  // Turn it on (SITE_INDEX=true) only when real rates and legal details are in place.
  index: process.env.SITE_INDEX === 'true',
  // Where the alert and grievance forms POST their data (e.g. a Formspree or own API URL).
  // Empty = preview mode: forms validate but nothing is sent.
  formEndpoint: process.env.FORM_ENDPOINT || ''
};
