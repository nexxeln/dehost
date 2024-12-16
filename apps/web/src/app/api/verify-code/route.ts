import { db } from "@/db";
import { VerificationCodes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json();

    console.log("Received verification request:", {
      userId,
      userIdType: typeof userId,
      code,
    });

    // Input validation
    if (!userId || !code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Query for the code that matches and is not yet verified
    const [verificationCode] = await db
      .select()
      .from(VerificationCodes)
      .where(
        and(
          eq(VerificationCodes.code, code),
          eq(VerificationCodes.isVerified, false)
        )
      )
      .execute();

    console.log("Verification code query result:", verificationCode);

    // If no valid code is found, return an error
    if (!verificationCode) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Check if the code has expired
    if (new Date() > new Date(verificationCode.expiresAt)) {
      return NextResponse.json(
        { error: "Verification code has expired" },
        { status: 400 }
      );
    }

    // Update the code to set isVerified to true and update authId
    await db
      .update(VerificationCodes)
      .set({
        isVerified: true,
        authId: userId, // Set the provided authId
      })
      .where(eq(VerificationCodes.id, verificationCode.id))
      .execute();

    console.log("Verification successful. Code updated.");

    return NextResponse.json({ status: "verified" });
  } catch (error) {
    console.error("Unexpected error verifying code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
