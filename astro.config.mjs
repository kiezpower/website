// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';

const integrations = [sitemap()];

const sentryDsn = import.meta.env.SENTRY_DSN;
if (sentryDsn) {
  integrations.push(sentry({
    dsn: sentryDsn,
    org: import.meta.env.SENTRY_ORG,
    project: import.meta.env.SENTRY_PROJECT,
    authToken: import.meta.env.SENTRY_AUTH_TOKEN,
    sourceMapsUploadOptions: {
      org: import.meta.env.SENTRY_ORG,
      project: import.meta.env.SENTRY_PROJECT,
      authToken: import.meta.env.SENTRY_AUTH_TOKEN,
    },
    bundleSizeOptimizations: {
      excludeReplayIframe: true,
      excludeReplayCanvas: true,
      excludeProfiling: true,
    },
  }));
}

export default defineConfig({
  output: "static",
  site: "https://kiez-power.de",
  base: "/",
  integrations,
});
