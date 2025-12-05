"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface EmailSummary {
  from: string;
  subject: string;
  summary: string;
  date: string;
}

function GmailSummarizerContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<
    "idle" | "connected" | "fetching" | "done" | "error"
  >("idle");
  const [summaries, setSummaries] = useState<EmailSummary[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const connected = searchParams.get("connected");
    const errorParam = searchParams.get("error");

    if (connected === "true") {
      setStatus("connected");
    } else if (errorParam) {
      setError(getErrorMessage(errorParam));
      setStatus("error");
    }
  }, [searchParams]);

  function getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case "access_denied":
        return "You denied access to Gmail. Please try again and allow access.";
      case "no_code":
        return "No authorization code received. Please try again.";
      case "token_exchange_failed":
        return "Failed to authenticate with Gmail. Please try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  const handleConnect = async () => {
    setError("");

    try {
      const response = await fetch("/api/gmail/auth");
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("Failed to get auth URL");
      }
    } catch {
      setError("Failed to connect to Gmail. Please try again.");
      setStatus("error");
    }
  };

  const handleRun = async () => {
    setStatus("fetching");
    setError("");

    try {
      const response = await fetch("/api/gmail/summarize", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to summarize emails");
      }

      const data = await response.json();
      setStatus("done");
      setSummaries(data.summaries);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
      setStatus("error");
    }
  };

  return (
    <>
      {/* Workflow Header */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-3xl font-bold mb-2">Gmail AI Summarizer</h1>
        <p className="text-zinc-400">
          Connect your Gmail and get AI-powered summaries of your last 10
          emails in seconds.
        </p>
      </div>

      {/* Step 1: Connect Gmail */}
      {status === "idle" && (
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Step 1: Connect Gmail</h2>
          <p className="text-zinc-400 mb-6">
            We&apos;ll securely connect to your Gmail to read your recent emails.
            We only read — we never send, delete, or modify anything.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center justify-center py-3 px-8 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
          >
            Connect Gmail Account
          </button>
        </div>
      )}

      {/* Step 2: Run Workflow */}
      {status === "connected" && (
        <div className="bg-zinc-800/50 rounded-xl border border-green-700 p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold mb-4">Gmail Connected!</h2>
          <p className="text-zinc-400 mb-6">
            Your Gmail is connected. Click below to fetch your last 10 emails
            and generate AI summaries.
          </p>
          <button
            onClick={handleRun}
            className="inline-flex items-center justify-center py-3 px-8 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
          >
            Run Summarizer →
          </button>
        </div>
      )}

      {/* Loading State */}
      {status === "fetching" && (
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-8 text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold">Processing your emails...</h2>
          <p className="text-zinc-400 mt-2">
            Fetching your last 10 emails and generating AI summaries. This may
            take a moment.
          </p>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="bg-red-900/20 rounded-xl border border-red-700 p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-red-400">
            Something went wrong
          </h2>
          <p className="text-zinc-400 mt-2 mb-6">{error}</p>
          <button
            onClick={() => {
              setStatus("idle");
              setError("");
            }}
            className="inline-flex items-center justify-center py-3 px-8 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {status === "done" && summaries.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Your Email Summaries ({summaries.length})
            </h2>
            <button
              onClick={() => {
                setStatus("connected");
                setSummaries([]);
              }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Run Again
            </button>
          </div>

          {summaries.map((email, index) => (
            <div
              key={index}
              className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-6"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium text-blue-400">{email.from}</span>
                <span className="text-xs text-zinc-500">{email.date}</span>
              </div>
              <h3 className="font-semibold mb-2">{email.subject}</h3>
              <p className="text-zinc-300">{email.summary}</p>
            </div>
          ))}

          <div className="text-center pt-6">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to all workflows
            </Link>
          </div>
        </div>
      )}

      {status === "done" && summaries.length === 0 && (
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-8 text-center">
          <div className="text-4xl mb-4">📭</div>
          <h2 className="text-xl font-semibold">No emails found</h2>
          <p className="text-zinc-400 mt-2">
            Your inbox appears to be empty or we couldn&apos;t access your emails.
          </p>
        </div>
      )}
    </>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin text-4xl mb-4">⏳</div>
      <p className="text-zinc-400">Loading...</p>
    </div>
  );
}

export default function GmailSummarizerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold hover:text-blue-400">
            ← Skyfall Workflows
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <Suspense fallback={<LoadingState />}>
          <GmailSummarizerContent />
        </Suspense>
      </main>
    </div>
  );
}
