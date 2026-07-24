"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, Loader2, Mail, Search, Send, Users, X } from "lucide-react";

type Recipient = {
  key: string;
  name: string;
  email: string;
  source: "Customer" | "CRM contact";
};

export function CrmCommunicationClient({ recipients }: { recipients: Recipient[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; errors?: string[] } | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recipients;
    return recipients.filter(
      (recipient) =>
        recipient.name.toLowerCase().includes(query) ||
        recipient.email.toLowerCase().includes(query)
    );
  }, [recipients, search]);

  const allSelected = recipients.length > 0 && selected.length === recipients.length;

  function toggleRecipient(key: string) {
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : recipients.map((recipient) => recipient.key));
  }

  async function sendEmails(event: React.FormEvent) {
    event.preventDefault();
    if (selected.length === 0) return;
    setSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/crm/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientKeys: selected, subject, body: message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send email");
      setResult(data);
      if (data.failed === 0) {
        setSubject("");
        setMessage("");
        setSelected([]);
      }
    } catch (error) {
      setResult({
        sent: 0,
        failed: selected.length,
        errors: [error instanceof Error ? error.message : "Unable to send email"],
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={sendEmails} className="grid gap-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(420px,1.15fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Choose recipients</h2>
              <p className="mt-1 text-xs text-slate-500">
                {selected.length} of {recipients.length} selected
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        <div className="max-h-[540px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-14 text-center">
              <Users className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">No customers found.</p>
            </div>
          ) : (
            filtered.map((recipient) => {
              const isSelected = selected.includes(recipient.key);
              return (
                <button
                  key={recipient.key}
                  type="button"
                  onClick={() => toggleRecipient(recipient.key)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    isSelected ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50"
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    isSelected ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white"
                  }`}>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{recipient.name}</span>
                    <span className="block truncate text-xs text-slate-500">{recipient.email}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                    {recipient.source}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Mail className="h-5 w-5" /></div>
          <div>
            <h2 className="font-semibold text-slate-900">Write email</h2>
            <p className="text-xs text-slate-500">Use {"{{name}}"} to personalize each email.</p>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {selected.slice(0, 6).map((key) => {
              const recipient = recipients.find((item) => item.key === key);
              if (!recipient) return null;
              return (
                <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs text-teal-700">
                  {recipient.name}
                  <button type="button" onClick={() => toggleRecipient(key)} aria-label={`Remove ${recipient.name}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            {selected.length > 6 && <span className="px-2 py-1 text-xs text-slate-500">+{selected.length - 6} more</span>}
          </div>
        )}

        <label className="mt-5 block text-xs font-semibold text-slate-600">Subject</label>
        <input
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Example: A special update for {{name}}"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />

        <label className="mt-4 block text-xs font-semibold text-slate-600">Message</label>
        <textarea
          required
          rows={12}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={"Hello {{name}},\n\nWrite your message here..."}
          className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-6 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />

        {result && (
          <div className={`mt-4 rounded-xl p-3 text-sm ${result.failed === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Sent {result.sent}; failed {result.failed}.
            </div>
            {result.errors?.length ? <p className="mt-1 text-xs">{result.errors.slice(0, 3).join(" ")}</p> : null}
          </div>
        )}

        <button
          type="submit"
          disabled={sending || selected.length === 0 || !subject.trim() || !message.trim()}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? "Sending..." : `Send to ${selected.length || 0} recipient${selected.length === 1 ? "" : "s"}`}
        </button>
      </section>
    </form>
  );
}
