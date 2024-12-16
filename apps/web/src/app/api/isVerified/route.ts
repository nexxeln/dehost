import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { VerificationCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json(
        { message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Query the database to check if the code exists and is verified
    const verificationCode = await db
      .select()
      .from(VerificationCodes)
      .where(eq(VerificationCodes.code, code))
      .execute();

    // If no code found or code is not verified
    if (!verificationCode.length || !verificationCode[0].isVerified) {
      return NextResponse.json(
        { message: 'Code not verified', status: 'error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Code verified successfully!', status: 'success' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking verification code:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { message: 'Failed to check verification code', error: errorMessage },
      { status: 500 }
    );
  }
}
