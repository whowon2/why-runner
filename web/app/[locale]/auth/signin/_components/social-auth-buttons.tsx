"use client";

import { BetterAuthActionButton } from "@/components/auth/auth-action-button";
import { authClient } from "@/lib/auth/client";
import { withRedirectTo } from "@/lib/auth/redirect-path";
import {
  SUPPORTED_OAUTH_PROVIDER_DETAILS,
  SUPPORTED_OAUTH_PROVIDERS,
} from "@/lib/auth/o-auth-providers";

export function SocialAuthButtons({ redirectTo }: { redirectTo: string }) {
  return SUPPORTED_OAUTH_PROVIDERS.map((provider) => {
    const Icon = SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].Icon;

    return (
      <BetterAuthActionButton
        variant="outline"
        key={provider}
        action={() => {
          return authClient.signIn.social({
            provider,
            callbackURL: redirectTo,
            newUserCallbackURL: withRedirectTo("/onboarding", redirectTo),
          });
        }}
      >
        <Icon />
        {SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].name}
      </BetterAuthActionButton>
    );
  });
}
