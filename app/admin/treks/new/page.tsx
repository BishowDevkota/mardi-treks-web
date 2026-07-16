import { TrekForm } from "../trek-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewTrekPage() {
  return (
    <div>
      <Link href="/admin/treks" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Treks
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">New Trek</h1>
      <p className="mt-1 text-sm text-slate-500">Create a new trekking package with rich text, pricing, itinerary, and more.</p>
      <TrekForm mode="create" />
    </div>
  );
}
