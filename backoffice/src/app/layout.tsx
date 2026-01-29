import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sencker Backoffice",
  description: "Admin panel for Sencker platform management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <div className="h-screen flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
