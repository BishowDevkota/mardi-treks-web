import { LoadingLogo } from "@/components/LoadingLogo";
import { Fakts } from "@/components/loading/Fakts";

export default function TrekLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center">
        <div
          className="absolute -inset-10 animate-spin rounded-full border border-dashed border-primary/20"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute -inset-7 animate-spin rounded-full border-2 border-transparent border-t-primary/40 border-r-primary/20"
          style={{ animationDuration: "2.5s" }}
        />
        <div
          className="absolute -inset-4 animate-spin rounded-full border-2 border-transparent border-b-secondary border-l-secondary/40"
          style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
        />
        <div className="absolute -inset-10 animate-spin" style={{ animationDuration: "4s" }}>
          <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/60 animate-pulse" />
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-secondary/60 animate-pulse" style={{ animationDelay: "2s" }} />
        </div>
        <div className="relative">
          <LoadingLogo />
        </div>
        <div className="mt-5 flex flex-col items-center">
          <span className="text-xl font-bold tracking-tight text-foreground">Mardi Treks</span>
          <span className="mt-1.5 text-xs font-medium tracking-widest text-text-muted animate-pulse" style={{ animationDuration: "1.5s" }}>
            LOADING
          </span>
        </div>

        {/* Fakts just below the loading content */}
        <div className="mt-10 max-w-sm px-6">
          <Fakts />
        </div>
      </div>
    </div>
  );
}
