import { CategoryForm } from "../category-form";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">New Category</h1>
      <p className="mt-1 text-sm text-slate-500">Create a product category like Treks, Tours, or Climbing.</p>
      <CategoryForm mode="create" />
    </div>
  );
}
