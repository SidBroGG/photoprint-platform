import type { Metadata, Viewport } from "next";
import "@fontsource/roboto/cyrillic-400.css";
import "@fontsource/roboto/cyrillic-500.css";
import "@fontsource/roboto/cyrillic-700.css";
import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-500.css";
import "@fontsource/roboto/latin-700.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ФотоПринт · Платформа управления",
  description:
    "BI-панель производственно-полиграфического бизнеса: продажи, финансы, производство, логистика и клиентский сервис.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
