import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-safe-area relative h-dvh overflow-y-auto overscroll-y-contain bg-background text-foreground">
      {children}
    </div>
  );
}
