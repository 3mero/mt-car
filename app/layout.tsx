import type React from "react"
import type { Metadata } from "next"
import { Tajawal } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { AppProvider } from "@/contexts/app-context"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
})

export const metadata: Metadata = {
  title: "تطبيق تتبع الصيانة",
  description: "تطبيق لتتبع مواعيد الصيانة للمركبات والأجهزة",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
