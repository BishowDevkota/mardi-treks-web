"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download, Upload, Shield, Database,
  CheckCircle, AlertCircle, RefreshCw, Mail
} from "lucide-react";
import { importContacts, exportContacts } from "../actions";

export function CrmSettingsClient({
  emailConfig,
}: {
  emailConfig: {
    smtpConfigured: boolean;
    imapConfigured: boolean;
    account: string;
    fetchDays: number;
  };
}) {
  const router = useRouter();
  const [importData, setImportData] = useState("");
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [emailTest, setEmailTest] = useState<{ loading?: boolean; success?: boolean; message?: string }>({});

  async function testEmailConnection() {
    setEmailTest({ loading: true });
    try {
      const response = await fetch("/api/crm/email-health", { method: "POST" });
      const result = await response.json();
      setEmailTest({
        success: response.ok && result.success,
        message: response.ok ? "Gmail SMTP connection is working." : result.error || "Connection failed.",
      });
    } catch {
      setEmailTest({ success: false, message: "Could not reach the email connection check." });
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.set("data", importData);
      const result = await importContacts(fd);
      setImportResult(result);
      if (result.imported > 0) router.refresh();
    } catch (err: any) {
      setImportResult({ imported: 0, skipped: 0, total: 0, error: err.message });
    }
    setImporting(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportContacts();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm-contacts-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    }
    setExporting(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Business email</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {emailConfig.account} · inbox sync looks back {emailConfig.fetchDays} days
            </p>
          </div>
          <button
            type="button"
            onClick={testEmailConnection}
            disabled={!emailConfig.smtpConfigured || emailTest.loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${emailTest.loading ? "animate-spin" : ""}`} />
            {emailTest.loading ? "Checking..." : "Test email connection"}
          </button>
        </div>
        <div className="mt-4">
          {[
            ["Sending (SMTP)", emailConfig.smtpConfigured],
            ["Inbox sync (IMAP)", emailConfig.imapConfigured],
          ].map(([label, ready]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-xs font-medium text-slate-600">{label}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${ready ? "text-emerald-600" : "text-amber-600"}`}>
                {ready ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {ready ? "Configured" : "Missing setup"}
              </span>
            </div>
          ))}
        </div>
        {emailTest.message && (
          <p className={`mt-3 rounded-xl px-3 py-2 text-xs ${emailTest.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {emailTest.message}
          </p>
        )}
      </div>

      {/* Data Import */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Data Import</h2>
            <p className="text-xs text-slate-400 mt-0.5">Import contacts from JSON format</p>
          </div>
        </div>

        {!showImport ? (
          <button onClick={() => setShowImport(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600">
            <Upload className="h-4 w-4" /> Import Contacts
          </button>
        ) : (
          <form onSubmit={handleImport} className="mt-4 space-y-3">
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              placeholder='[{"name":"John Doe","email":"john@example.com","phone":"+977-...","type":"lead"}]'
            />
            <div className="flex gap-2">
              <button type="submit" disabled={importing || !importData} className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50">
                {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? "Importing..." : "Import"}
              </button>
              <button type="button" onClick={() => setShowImport(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
            {importResult && (
              <div className={`flex items-start gap-2 rounded-xl p-3 ${importResult.error ? "bg-red-50 text-red-700" : importResult.imported > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {importResult.error ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                <div className="text-xs">
                  {importResult.error ? importResult.error : `Imported ${importResult.imported} of ${importResult.total} contacts (${importResult.skipped} skipped)`}
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Data Export */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Data Export</h2>
            <p className="text-xs text-slate-400 mt-0.5">Export contacts to CSV format</p>
          </div>
        </div>
        <button onClick={handleExport} disabled={exporting} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
          {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? "Exporting..." : "Export Contacts (CSV)"}
        </button>
      </div>

      {/* GDPR & Compliance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Data & Compliance</h2>
            <p className="text-xs text-slate-400 mt-0.5">GDPR compliance and data management</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Contact Deletion</p>
              <p className="text-xs text-slate-400">Permanently removes contact and all related data</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <Shield className="h-3 w-3" /> GDPR Ready
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Data Backup</p>
              <p className="text-xs text-slate-400">Export your CRM data regularly for backup</p>
            </div>
            <button onClick={handleExport} className="text-xs font-medium text-teal-600 hover:text-teal-700">
              Export Now →
            </button>
          </div>
        </div>
      </div>

      {/* Integration Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Integrations</h2>
            <p className="text-xs text-slate-400 mt-0.5">Connect external services</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-700">Email (Gmail/Outlook)</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Log sent/received emails and track opens</p>
          </div>
        </div>
      </div>
    </div>
  );
}
