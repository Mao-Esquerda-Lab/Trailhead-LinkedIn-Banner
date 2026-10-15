import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Trailhead LinkedIn Banner",
  description: "Gere seu banner de LinkedIn com selos e certificações do Trailhead",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
