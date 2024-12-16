"use client";

import { Button } from "@/components/ui/button";
import { createOrUpdateUser } from "@/lib/actions";
import { usePrivy } from "@privy-io/react-auth";
import { LogIn } from "lucide-react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Navbar() {
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
    <nav className="flex justify-between items-center mb-1 py-2 pt-4 px-4 md:px-8 lg:px-16">
      <div className="flex items-center">
        <Link href="/" className="text-xl font-bold hover:text-primary">DeHost</Link>
      </div>

      <div className="hidden md:flex items-center space-x-4">
        <Link href="/dashboard" className="text-foreground hover:text-primary">
          Dashboard
        </Link>
        <Link href="/search" className="text-foreground hover:text-primary">
          Search
        </Link>
        <Link href="/docs" className="text-foreground hover:text-primary">
          Docs
        </Link>
        <Button onClick={handleAuth} variant="outline">
          {authenticated ? (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </>
          )}
        </Button>
      </div>
    </nav>
  );
}
