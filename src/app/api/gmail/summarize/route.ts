import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";
import OpenAI from "openai";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EmailSummary {
  from: string;
  subject: string;
  summary: string;
  date: string;
}

function decodeBase64(data: string): string {
  // Gmail uses URL-safe base64
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractTextFromParts(parts: any[]): string {
  let text = "";

  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      text += decodeBase64(part.body.data);
    } else if (part.parts) {
      text += extractTextFromParts(part.parts);
    }
  }

  return text;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    // Get tokens from cookie
    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get("gmail_tokens");

    if (!tokensCookie) {
      return NextResponse.json(
        { error: "Not authenticated. Please connect Gmail first." },
        { status: 401 }
      );
    }

    const tokens = JSON.parse(tokensCookie.value);
    oauth2Client.setCredentials(tokens);

    // Initialize Gmail API
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch last 10 messages
    const messagesResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    const messages = messagesResponse.data.messages || [];

    if (messages.length === 0) {
      return NextResponse.json({ summaries: [] });
    }

    // Fetch full message details
    const emailDetails = await Promise.all(
      messages.map(async (msg) => {
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "full",
        });

        const headers = fullMessage.data.payload?.headers || [];
        const from =
          headers.find((h) => h.name === "From")?.value || "Unknown";
        const subject =
          headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const date =
          headers.find((h) => h.name === "Date")?.value || "Unknown Date";

        // Extract body
        let body = "";
        const payload = fullMessage.data.payload;

        if (payload?.body?.data) {
          body = decodeBase64(payload.body.data);
        } else if (payload?.parts) {
          body = extractTextFromParts(payload.parts);
        }

        // Clean up HTML if present
        body = stripHtml(body);

        // Truncate long emails
        if (body.length > 2000) {
          body = body.substring(0, 2000) + "...";
        }

        return { from, subject, date, body };
      })
    );

    // Summarize each email with OpenAI
    const summaries: EmailSummary[] = await Promise.all(
      emailDetails.map(async (email) => {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that summarizes emails concisely. Provide a 1-2 sentence summary that captures the key point or action item of the email.",
            },
            {
              role: "user",
              content: `Please summarize this email:\n\nFrom: ${email.from}\nSubject: ${email.subject}\n\nBody:\n${email.body}`,
            },
          ],
          max_tokens: 100,
          temperature: 0.3,
        });

        const summary =
          completion.choices[0]?.message?.content || "Unable to summarize.";

        // Format the date nicely
        const formattedDate = new Date(email.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        return {
          from: email.from.split("<")[0].trim(), // Just the name part
          subject: email.subject,
          summary,
          date: formattedDate,
        };
      })
    );

    return NextResponse.json({ summaries });
  } catch (error: any) {
    console.error("Error summarizing emails:", error);

    if (error.code === 401 || error.message?.includes("invalid_grant")) {
      // Clear the invalid token
      const cookieStore = await cookies();
      cookieStore.delete("gmail_tokens");

      return NextResponse.json(
        { error: "Gmail session expired. Please reconnect." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to summarize emails. Please try again." },
      { status: 500 }
    );
  }
}
