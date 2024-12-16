import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // Adjust this based on your project
import { VerificationCodes } from '@/db/schema'; // Adjust this based on your schema

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

    const userId = 1; // Example user ID, replace as necessary
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save to the database
    await db.insert(VerificationCodes).values({
      userId:null,
      code,
      isVerified: false,
      expiresAt,
    });

    return NextResponse.json(
      { message: 'Verification code saved successfully!', status: 'success' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving verification code:', error);

    let errorMessage = 'Unknown error'; // Default message
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { message: 'Failed to save verification code', error: errorMessage },
      { status: 500 }
    );

  }
}
