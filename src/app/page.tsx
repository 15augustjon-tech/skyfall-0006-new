"use client";

import { useState } from "react";
import Link from "next/link";

interface Workflow {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  status: "available" | "coming_soon";
}

const workflows: Workflow[] = [
  {
    id: "gmail-summarizer",
    title: "Gmail AI Summarizer",
    description:
      "Connect your Gmail and get AI-powered summaries of your last 10 emails in seconds.",
    icon: "📧",
    href: "/workflows/gmail-summarizer",
    status: "available",
  },
  {
    id: "coming-soon-1",
    title: "More Workflows Coming",
    description: "We're adding new powerful automations every week. Stay tuned!",
    icon: "🚀",
    href: "#",
    status: "coming_soon",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Skyfall Workflows</h1>
          <span className="text-sm text-zinc-400">MVP</span>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Powerful Automations.
          <br />
          <span className="text-blue-500">One Click.</span>
        </h2>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Complex workflows that used to require coding and setup — now just
          press a button and let it run.
        </p>
      </section>

      {/* Workflow Cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h3 className="text-2xl font-semibold mb-8">Available Workflows</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-zinc-500 text-sm">
          Skyfall Workflows — Making automation accessible to everyone.
        </div>
      </footer>
    </div>
  );
}

function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const isAvailable = workflow.status === "available";

  return (
    <div
      className={`rounded-xl border p-6 transition-all ${
        isAvailable
          ? "border-zinc-700 bg-zinc-800/50 hover:border-blue-500 hover:bg-zinc-800"
          : "border-zinc-800 bg-zinc-900/50 opacity-60"
      }`}
    >
      <div className="text-4xl mb-4">{workflow.icon}</div>
      <h4 className="text-xl font-semibold mb-2">{workflow.title}</h4>
      <p className="text-zinc-400 text-sm mb-6">{workflow.description}</p>

      {isAvailable ? (
        <Link
          href={workflow.href}
          className="inline-flex items-center justify-center w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
        >
          Run Workflow →
        </Link>
      ) : (
        <button
          disabled
          className="w-full py-3 px-4 bg-zinc-700 rounded-lg font-medium cursor-not-allowed"
        >
          Coming Soon
        </button>
      )}
    </div>
  );
}
