"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Mail, Trash2, Send, Loader2, X, CheckCircle } from "lucide-react";
import { updateUserRole, deleteUser, sendBulkEmail } from "./actions";
import { formatDate } from "@/lib/utils";

export function AdminUsersClient({ users }: { users: any[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleRoleChange(id: string, role: string) {
    await updateUserRole(id, role);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteUser(id);
    setShowDeleteConfirm(null);
    router.refresh();
  }

  const roleStyles: Record<string, string> = {
    admin: "bg-amber-50 text-amber-700 border-amber-200",
    customer: "bg-blue-50 text-blue-700 border-blue-200",
  };

  async function handleSendBulkEmail(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setEmailResult(null);
    const fd = new FormData();
    fd.set("subject", emailSubject);
    fd.set("html", emailHtml);
    fd.set("recipientIds", JSON.stringify(users.map((u) => u.id)));
    try {
      const result = await sendBulkEmail(fd);
      setEmailResult(result);
      if (result.failed === 0) {
        setEmailSubject("");
        setEmailHtml("");
      }
    } catch (err: any) {
      setEmailResult({ sent: 0, failed: 1, errors: [err?.message || "Failed to send email"] });
    }
    setSending(false);
  }

  const userCount = filtered.length;

  return (
    <>
      {/* Search + Bulk Email */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <button
          onClick={() => { setShowBulkEmail(true); setEmailResult(null); }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-md"
        >
          <Send className="h-4 w-4" />
          Bulk Email
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <Users className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-600">No users found</p>
            <p className="mt-1 text-xs text-slate-400">Try a different search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">User</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Contact</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bookings</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-bold text-white">
                          {(user.name || user.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.name || "Unnamed"}</p>
                          <p className="text-xs text-slate-400">{user.nationality || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="text-xs">{user.email}</span>
                      </div>
                      {user.phone && (
                        <p className="mt-0.5 text-xs text-slate-400">{user.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-900">{user._count?.bookings || 0}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-teal-200 ${roleStyles[user.role] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete User?</h3>
            <p className="mt-2 text-sm text-slate-500">
              This will permanently remove this user and all their associated data including bookings.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Email Modal */}
      {showBulkEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Send Bulk Email</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Sending to <strong>{userCount}</strong> user{userCount !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => { setShowBulkEmail(false); setEmailResult(null); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendBulkEmail} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Subject *</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  required
                  placeholder="e.g. Special Offer: Trekking Discounts"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Message (HTML) *</label>
                <p className="text-xs text-slate-400 mb-2">
                  Write your email content using HTML. Basic tags like &lt;p&gt;, &lt;h2&gt;, &lt;a&gt;, &lt;strong&gt; are supported.
                </p>
                <textarea
                  value={emailHtml}
                  onChange={(e) => setEmailHtml(e.target.value)}
                  required
                  rows={10}
                  placeholder={`<h2>Hello!</h2>\n<p>We have an exciting announcement...</p>`}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100 resize-y"
                />
              </div>

              {/* Result */}
              {emailResult && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${
                  emailResult.failed === 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : emailResult.sent > 0
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}>
                  <div className="flex items-center gap-2 font-medium">
                    {emailResult.failed === 0 ? (
                      <><CheckCircle className="h-4 w-4" /> Email sent to {emailResult.sent} user{emailResult.sent !== 1 ? "s" : ""} successfully!</>
                    ) : (
                      <><X className="h-4 w-4" /> Sent: {emailResult.sent}, Failed: {emailResult.failed}</>
                    )}
                  </div>
                  {emailResult.errors.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-xs space-y-0.5">
                      {emailResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowBulkEmail(false); setEmailResult(null); }}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Send to {userCount} User{userCount !== 1 ? "s" : ""}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Users(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
