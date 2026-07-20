"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Eye, Trash2, ArrowUpRight, Filter, X,
  CheckCircle2, Clock, Ban, AlertCircle
} from "lucide-react";
import { updateBookingStatus, deleteBooking } from "./actions";
import { formatDate } from "@/lib/utils";

const STATUS_TABS = [
  { key: "all", label: "All", color: "bg-slate-100 text-slate-700" },
  { key: "PENDING_REVIEW", label: "Pending", color: "bg-amber-100 text-amber-700" },
  { key: "AWAITING_PAYMENT", label: "Awaiting Payment", color: "bg-blue-100 text-blue-700" },
  { key: "CONFIRMED", label: "Confirmed", color: "bg-emerald-100 text-emerald-700" },
  { key: "COMPLETED", label: "Completed", color: "bg-slate-100 text-slate-600" },
  { key: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-700" },
];

export function AdminBookingsClient({
  bookings,
  statusCounts,
  currentStatus,
  searchQuery,
  statusStyles,
  statusIcons,
}: {
  bookings: any[];
  statusCounts: Record<string, number>;
  currentStatus: string;
  searchQuery: string;
  statusStyles: Record<string, string>;
  statusIcons: Record<string, any>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: string) {
    await updateBookingStatus(id, status);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteBooking(id);
    setShowDeleteConfirm(null);
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (currentStatus !== "all") params.set("status", currentStatus);
    router.push(`/admin/bookings?${params.toString()}`);
  }

  function filterByStatus(status: string) {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (status !== "all") params.set("status", status);
    router.push(`/admin/bookings?${params.toString()}`);
  }

  return (
    <>
      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => filterByStatus(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentStatus === tab.key
                ? `${tab.color} ring-1 ring-slate-300 shadow-sm`
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {tab.label}
            <span className="ml-0.5 text-[10px] opacity-60">({statusCounts[tab.key] || 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by trek, customer name or email..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); router.push("/admin/bookings"); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-600">No bookings found</p>
            <p className="mt-1 text-xs text-slate-400">
              {currentStatus !== "all" ? "Try a different filter." : "Bookings will appear here once customers start booking."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Trek</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Details</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Payment</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => {
                  const iconMap: Record<string, any> = { AlertCircle, Clock, CheckCircle2, Ban };
                  const StatusIcon = iconMap[statusIcons[booking.status]] || AlertCircle;
                  return (
                    <tr key={booking.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-bold text-white">
                            {(booking.user?.name || booking.user?.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{booking.user?.name || "Unknown"}</p>
                            <p className="text-xs text-slate-400">{booking.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-900">{booking.trekTitle}</p>
                        <p className="text-xs text-slate-400">{booking.trekDuration} days</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                        {formatDate(booking.startDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-slate-600">{booking.groupSize} traveler{booking.groupSize > 1 ? "s" : ""}</p>
                        <p className="text-xs text-slate-400">Created {formatDate(booking.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">${booking.totalPrice.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {booking.payment ? (
                          <div>
                            <p className="text-xs font-medium text-slate-700 capitalize">{booking.payment.method}</p>
                            <p className="text-xs text-slate-400">${booking.payment.amount?.toLocaleString()} — {booking.payment.status}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                        {booking.paymentStatus && (
                          <p className={`mt-1 text-[10px] font-medium ${
                            booking.paymentStatus === "FULLY_PAID" ? "text-emerald-600" :
                            booking.paymentStatus === "PARTIALLY_PAID" ? "text-blue-600" :
                            "text-amber-600"
                          }`}>{booking.paymentStatus.replace(/_/g, " ")}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium focus:outline-none focus:ring-2 ${statusStyles[booking.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                        >
                          <option value="PENDING_REVIEW">Pending Review</option>
                          <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(booking.id)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Booking?</h3>
            <p className="mt-2 text-sm text-slate-500">This action cannot be undone. All traveler details will be permanently removed.</p>
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

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Customer & Trek Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Customer</p>
                  <p className="mt-1 font-medium text-slate-900">{selectedBooking.user?.name || "Unknown"}</p>
                  <p className="text-sm text-slate-500">{selectedBooking.user?.email}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Trek Package</p>
                  <p className="mt-1 font-medium text-slate-900">{selectedBooking.trekTitle}</p>
                  <p className="text-sm text-slate-500">{selectedBooking.trekDuration} days</p>
                </div>
              </div>

              {/* Date, Travelers, Price */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Start Date</p>
                  <p className="mt-1 font-medium text-slate-900">{formatDate(selectedBooking.startDate)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Travelers</p>
                  <p className="mt-1 font-medium text-slate-900">{selectedBooking.groupSize}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Price</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">${selectedBooking.totalPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Payment</p>
                {selectedBooking.payment ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-slate-700">
                      Method: <span className="font-medium capitalize">{selectedBooking.payment.method || "N/A"}</span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Amount: <span className="font-medium">${selectedBooking.payment.amount?.toLocaleString() || "0"}</span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Status: <span className="font-medium">{selectedBooking.payment.status || "N/A"}</span>
                    </p>
                    {selectedBooking.paymentStatus && (
                      <p className={`text-sm font-medium ${
                        selectedBooking.paymentStatus === "FULLY_PAID" ? "text-emerald-600" :
                        selectedBooking.paymentStatus === "PARTIALLY_PAID" ? "text-blue-600" : "text-amber-600"
                      }`}>
                        {selectedBooking.paymentStatus.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">No payment recorded</p>
                )}
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-amber-600">Special Requests</p>
                  <p className="mt-1 text-sm text-amber-800">{selectedBooking.specialRequests}</p>
                </div>
              )}

              {/* Add-ons */}
              {selectedBooking.addons && (() => {
                let parsedAddons;
                try { parsedAddons = JSON.parse(selectedBooking.addons); } catch { parsedAddons = null; }
                return parsedAddons && parsedAddons.length > 0 ? (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Add-ons</p>
                    <div className="mt-2 space-y-1">
                      {parsedAddons.map((addon: any, i: number) => (
                        <p key={i} className="text-sm text-slate-700">
                          {addon.title} &times; {addon.qty} — <span className="font-medium">+${(addon.qty * addon.pricePerUnit).toLocaleString()}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Traveler Details - Full Info */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Traveler Details ({selectedBooking.travelerDetails?.length || 0})
                </p>
                {selectedBooking.travelerDetails?.length > 0 ? (
                  <div className="mt-2 space-y-3">
                    {selectedBooking.travelerDetails.map((t: any, i: number) => (
                      <div key={t.id || i} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                        <p className="font-semibold text-slate-900">{t.fullName}</p>
                        <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span>Email: {t.email}</span>
                          <span>Phone: {t.phone}</span>
                          <span>Nationality: {t.nationality}</span>
                          <span>Passport: {t.passportNumber || "N/A"}</span>
                          <span>Age: {t.age || "N/A"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">No traveler details recorded.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedBooking(null)}
              className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ShoppingCart(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75a3 3 0 00-3 3m-6.75-15l1.5 8.25h9l1.5-8.25m-10.5 0H21m-12 0H5.346m0 0L3.72 5.272M7.5 14.25H5.346m0 0a3 3 0 01-3.152-2.528l-.534-3.123" />
    </svg>
  );
}
