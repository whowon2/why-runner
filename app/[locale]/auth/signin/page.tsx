"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export default function Page() {
  async function signinWithGithub() {
    const res = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
      errorCallbackURL: "/error",
      // newUserCallbackURL: "/welcome",
    });

    console.log(res);
  }

  return (
    <div className="m-auto flex items-center justify-center">
      <Button onClick={signinWithGithub}>Github</Button>
    </div>
  );
}
