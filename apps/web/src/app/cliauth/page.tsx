"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePrivy } from "@privy-io/react-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

export default function VerifyCode() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { authenticated, user } = usePrivy();

  useEffect(() => {
    console.log("Authentication state:", authenticated)
    console.log("Full user object:", user)
   
    const timer = setTimeout(() => {
      if (!authenticated) {
        console.log("Not authenticated, redirecting to signin...");
        router.push("/signin");
      } else {
        console.log("User is authenticated, staying on page");
      }
      
      setIsLoading(false);
    }, 2500); // 2.5 second delay

    return () => clearTimeout(timer);
    
  }, [authenticated, router, user]);

  if (isLoading) {
    return <div role="status" className="flex items-center justify-center min-h-screen">
    <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
    <span className="sr-only">Loading...</span>
    </div>;
  }

  // Verify the 6-digit code
  const verifyCode = async () => {
    setError("");
    setSuccess(false);
  
    if (!user?.id) {
      setError("User ID not found. Please try again.");
      return;
    }
  
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
  
    try {
      console.log("Verification attempt details:", {
        userId: user.id,
        userIdType: typeof user.id,
        code: fullCode
      });
  
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: user.id, 
          code: fullCode 
        }),
      });
  
      const result = await response.json();
  
      console.log("Verification response:", {
        status: response.status,
        ok: response.ok,
        result: result
      });
  
      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }
  
      if (result.status === "verified") {
        setSuccess(true);
        window.close();
        // setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        throw new Error("Verification failed");
      }
    } catch (err: any) {
      console.error("Full verification error:", err);
      setError(err.message || "An unexpected error occurred");
    }
  };

  // Handle input changes
  const handleChange = (index: number, value: string) => {
    if (value.match(/^\d?$/)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value !== "" && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key events (e.g., backspace navigation)
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && index > 0 && !code[index]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-900">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Verify Your Code</CardTitle>
          <CardDescription>
            Enter the 6-digit verification code sent to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            {code.map((digit, index) => (
              <Input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                // @ts-ignore
                ref={(el) => (inputRefs.current[index] = el)}
                className="w-12 h-12 text-center text-lg"
              />
            ))}
          </div>
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
        <Button
          onClick={verifyCode}
          className={`w-full ${
            success
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-primary hover:bg-primary/90"
          }`}
          disabled={success}
        >
          {success ? "Success" : "Verify"}
        </Button>

        </CardFooter>
      </Card>
    </div>
  );
}
