import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(
        "/workflows/gmail-summarizer?error=access_denied",
        request.nextUrl.origin
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/workflows/gmail-summarizer?error=no_code",
        request.nextUrl.origin
      )
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in a secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("gmail_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    return NextResponse.redirect(
      new URL(
        "/workflows/gmail-summarizer?connected=true",
        request.nextUrl.origin
      )
    );
  } catch (err) {
    console.error("Error exchanging code for tokens:", err);
    return NextResponse.redirect(
      new URL(
        "/workflows/gmail-summarizer?error=token_exchange_failed",
        request.nextUrl.origin
      )
    );
  }
}
