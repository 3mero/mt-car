"use client"

import { Button } from "@/components/ui/button"
import { ItemsList } from "@/components/items-list"
import { Plus, Settings, RefreshCw, LayoutDashboard } from "lucide-react"
import { useRouter } from "next/navigation"
import { useApp } from "@/contexts/app-context"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const router = useRouter()
  const { refreshItems, isLoading, items } = useApp()
  const { theme } = useTheme()

  return (
    <main className="container mx-auto p-4 max-w-7xl">
      <div className="dashboard-header mb-8 rounded-lg bg-card shadow-sm">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">نظام تتبع الصيانة</h1>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button onClick={refreshItems} variant="outline" size="icon" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={() => router.push("/settings")} variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </Button>
            <Button onClick={() => router.push("/add")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              إضافة عنصر
            </Button>
          </div>
        </div>
      </div>

      {items.length === 0 && !isLoading && (
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="empty-state">
              <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">لا توجد عناصر للعرض</h2>
              <p className="text-muted-foreground mb-6">ابدأ بإضافة عنصر جديد لتتبع مواعيد الصيانة الخاصة به</p>
              <Button onClick={() => router.push("/add")} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة عنصر جديد
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ItemsList />
    </main>
  )
}
