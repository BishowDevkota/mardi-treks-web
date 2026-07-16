import { PageForm } from "../page-form";

export default function NewPagePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">New Page</h1>
      <p className="mt-1 text-sm text-slate-500">Create a new static page for your site.</p>
      <PageForm mode="create" />
    </div>
  );
}
