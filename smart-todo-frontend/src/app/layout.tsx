import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Todo List - AI Powered Task Management",
  description:
    "Intelligent task management with AI-powered prioritization and context analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}> 
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1  flex overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
