"use client";

import Link from "next/link";
import { ArrowRight, Brain, Shield } from "lucide-react";
import DashboardLayout from "./components/DashboardLayout";

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8 text-white">
        <section className="rounded-3xl border border-white/20 bg-black p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Organization Workspace</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Agentic Notes System
            <span className="block text-zinc-400">Black and White. Role-Aware. AI-Driven.</span>
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-zinc-300">
            Manage notes, comments, and permissions in a role-aware workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/notes"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-black px-5 py-2 text-sm font-semibold text-white transition hover:border-white"
            >
              Open Notes
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <Brain className="mb-3 h-5 w-5 text-white" />
            <h2 className="text-lg font-semibold">Agentic CRUD</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Natural-language instructions are converted into executable plans with optional dry-run previews.
            </p>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <Shield className="mb-3 h-5 w-5 text-white" />
            <h2 className="text-lg font-semibold">Role Boundaries</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Owner, manager, operator, and viewer roles are enforced across user management and note permissions.
            </p>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
}
