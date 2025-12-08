"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth/client";
import { SignInTab } from "./_components/sign-in-tab";
import { SignUpTab } from "./_components/sign-up-tab";
import { SocialAuthButtons } from "./_components/social-auth-buttons";
import { EmailVerification } from "@/components/auth/email-verification";

type Tab = "signin" | "signup" | "email-verification" | "forgot-password";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [selectedTab, setSelectedTab] = useState<Tab>("signin");

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session.data != null) router.push("/");
    });
  }, [router]);

  function openEmailVerificationTab(email: string) {
    setEmail(email);
    setSelectedTab("email-verification");
  }

  return (
    <div className="flex w-full flex-col flex-1 items-center justify-center gap-4 p-4">
      <Tabs
        value={selectedTab}
        onValueChange={(t) => setSelectedTab(t as Tab)}
        className=""
      >
        {(selectedTab === "signin" || selectedTab === "signup") && (
          <TabsList>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="signin">
          <Card>
            <CardHeader className="text-2xl font-bold">
              <CardTitle>Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <SignInTab
                openEmailVerificationTab={openEmailVerificationTab}
                openForgotPassword={() => setSelectedTab("forgot-password")}
              />
            </CardContent>

            <Separator />

            <CardFooter className="grid grid-cols-2 gap-3">
              <SocialAuthButtons />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card>
            <CardHeader className="text-2xl font-bold">
              <CardTitle>Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
              <SignUpTab openEmailVerificationTab={openEmailVerificationTab} />
            </CardContent>

            <Separator />

            <CardFooter className="grid grid-cols-2 gap-3">
              <SocialAuthButtons />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="email-verification">
          <Card>
            <CardHeader className="text-2xl font-bold">
              <CardTitle>Verify Your Email</CardTitle>
            </CardHeader>
            <CardContent>
              <EmailVerification email={email} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forgot-password">
          <Card>
            <CardHeader className="text-2xl font-bold">
              <CardTitle>Forgot Password</CardTitle>
            </CardHeader>
            <CardContent>
              {/*<ForgotPassword openSignInTab={() => setSelectedTab("signin")} />*/}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
