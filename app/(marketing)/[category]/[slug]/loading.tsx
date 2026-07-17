import { Mountain } from "lucide-react";

export default function TrekLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background">
      {/* Logo with spinning ring */}
      <div className="relative flex flex-col items-center">
        <div className="absolute -inset-4 rounded-full border-2 border-border" />
        <div className="absolute -inset-4 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary" style={{ animationDuration: "1s" }} />
        <div className="absolute -inset-6 animate-spin rounded-full border-2 border-transparent border-b-secondary border-l-secondary" style={{ animationDuration: "1.5s" }} />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Mountain className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Loading dots */}
      <div className="mt-10 flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
