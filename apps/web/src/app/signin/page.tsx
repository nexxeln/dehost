"use client";

import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { LogIn } from "lucide-react";
import { useEffect } from "react";
import { createOrUpdateUser } from "@/lib/actions";

export default function SignIn() {
  const { login, logout, authenticated, user } = usePrivy();

  useEffect(() => {
    if (authenticated && user) {
      handleUserAuthenticated();
    }
  }, [authenticated, user]);

  const handleUserAuthenticated = async () => {
    if (user && user.wallet?.address) {
      try {
        await createOrUpdateUser(
          user.wallet.address,
          user.email?.address ?? ""
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleAuth = () => (authenticated ? logout() : login());

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={handleAuth} className="gap-2">
        <LogIn className="h-4 w-4" />
        Sign in with Wallet
      </Button>
    </div>
  );
}
