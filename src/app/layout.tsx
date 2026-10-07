import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarberFlow | Gestão para barbearias",
  description:
    "Mais organização para sua barbearia. Agenda, atendimentos e clientes em um só lugar.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
