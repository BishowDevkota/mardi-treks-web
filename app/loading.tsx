import { Mountain } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center">
        <div className="absolute -inset-4 rounded-full border-2 border-border" />
        <div
          className="absolute -inset-4 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary"
          style={{ animationDuration: "1s" }}
        />
        <div
          className="absolute -inset-6 animate-spin rounded-full border-2 border-transparent border-b-secondary border-l-secondary"
          style={{ animationDuration: "1.5s" }}
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Mountain className="h-7 w-7 text-white" />
        </div>
        <div className="mt-4 flex flex-col items-center">
          <span className="text-lg font-bold tracking-tight text-foreground">Mardi Treks</span>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-1.5">
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-primary"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-primary"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-primary"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
