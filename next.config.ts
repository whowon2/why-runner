/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: [
      "picsum.photos",
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
    ],
  },
};

export default withNextIntl(config);
