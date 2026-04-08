import type { ReactNode } from "react";
import { Toaster } from "@/shared/components/ui/sonner";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-safe-area relative flex h-full flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain bg-background text-foreground">
      <div className="flex-1">
        {children}
      </div>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
