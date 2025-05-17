"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import * as db from "@/lib/db"
import type { Item } from "@/types/item"
import { getEstimatedCurrentReading } from "@/lib/estimations"

interface AppContextType {
  items: Item[]
  isLoading: boolean
  error: string | null
  getItemById: (id: string) => Item | undefined
  saveItem: (item: Item) => void
  updateItem: (item: Item) => void
  deleteItem: (id: string) => void
  clearAllItems: () => void
  exportData: () => string
  importData: (jsonData: string) => void
  refreshItems: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // تحميل العناصر
  const loadItems = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      const loadedItems = db.getItems()

      // الحصول على طريقة الترتيب من الإعدادات
      const sortMethod = typeof window !== "undefined" ? localStorage.getItem("itemsSort") || "name" : "name"

      // ترتيب العناصر حسب الإعدادات
      const sortedItems = [...loadedItems].sort((a, b) => {
        // المثبتة دائماً في المقدمة
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1

        // ثم تطبيق الترتيب المحدد
        switch (sortMethod) {
          case "name":
            return a.name.localeCompare(b.name)
          case "date":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // الأحدث أولاً
          case "reading":
            return b.currentReading - a.currentReading // الأعلى أولاً
          case "remaining":
            const remainingA = a.currentReading + a.maintenanceThreshold - getEstimatedCurrentReading(a)
            const remainingB = b.currentReading + b.maintenanceThreshold - getEstimatedCurrentReading(b)
            return remainingA - remainingB // الأقل متبقي أولاً
          default:
            return a.name.localeCompare(b.name)
        }
      })

      setItems(sortedItems)
    } catch (error) {
      console.error("Error loading items:", error)
      setError("حدث خطأ أثناء تحميل العناصر")
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل العناصر",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // تحميل العناصر عند بدء التطبيق
  useEffect(() => {
    // تم إزالة استدعاء دالة إضافة البيانات التجريبية
    loadItems()
  }, [loadItems])

  // الحصول على عنصر بواسطة المعرف
  const getItemById = useCallback((id: string): Item | undefined => {
    return db.getItemById(id)
  }, [])

  // حفظ عنصر جديد
  const saveItem = useCallback(
    (item: Item) => {
      try {
        db.saveItem(item)
        loadItems()
        toast({
          title: "تم الحفظ بنجاح",
          description: "تم حفظ العنصر بنجاح",
          variant: "success",
        })
      } catch (error) {
        console.error("Error saving item:", error)
        toast({
          title: "خطأ في الحفظ",
          description: "حدث خطأ أثناء حفظ العنصر",
          variant: "destructive",
        })
        throw error
      }
    },
    [loadItems, toast],
  )

  // تحديث عنصر موجود
  const updateItem = useCallback(
    (item: Item) => {
      try {
        db.updateItem(item)
        loadItems()
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث العنصر بنجاح",
          variant: "success",
        })
      } catch (error) {
        console.error("Error updating item:", error)
        toast({
          title: "خطأ في التحديث",
          description: "حدث خطأ أثناء تحديث العنصر",
          variant: "destructive",
        })
        throw error
      }
    },
    [loadItems, toast],
  )

  // حذف عنصر
  const deleteItem = useCallback(
    (id: string) => {
      try {
        db.deleteItem(id)
        loadItems()
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف العنصر بنجاح",
          variant: "success",
        })
      } catch (error) {
        console.error("Error deleting item:", error)
        toast({
          title: "خطأ في الحذف",
          description: "حدث خطأ أثناء حذف العنصر",
          variant: "destructive",
        })
        throw error
      }
    },
    [loadItems, toast],
  )

  // حذف جميع العناصر
  const clearAllItems = useCallback(() => {
    try {
      db.clearAllItems()
      loadItems()
      toast({
        title: "تم المسح بنجاح",
        description: "تم مسح جميع العناصر بنجاح",
        variant: "success",
      })
    } catch (error) {
      console.error("Error clearing items:", error)
      toast({
        title: "خطأ في المسح",
        description: "حدث خطأ أثناء مسح العناصر",
        variant: "destructive",
      })
      throw error
    }
  }, [loadItems, toast])

  // تصدير البيانات
  const exportData = useCallback((): string => {
    try {
      return db.exportData()
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      })
      throw error
    }
  }, [toast])

  // استيراد البيانات
  const importData = useCallback(
    (jsonData: string) => {
      try {
        db.importData(jsonData)
        loadItems()
        toast({
          title: "تم الاستيراد بنجاح",
          description: "تم استيراد البيانات بنجاح",
          variant: "success",
        })
      } catch (error) {
        console.error("Error importing data:", error)
        toast({
          title: "خطأ في الاستيراد",
          description: "حدث خطأ أثناء استيراد البيانات",
          variant: "destructive",
        })
        throw error
      }
    },
    [loadItems, toast],
  )

  // تحديث العناصر
  const refreshItems = useCallback(() => {
    loadItems()
    toast({
      title: "تم التحديث",
      description: "تم تحديث البيانات بنجاح",
      variant: "success",
    })
  }, [loadItems, toast])

  const value = {
    items,
    isLoading,
    error,
    getItemById,
    saveItem,
    updateItem,
    deleteItem,
    clearAllItems,
    exportData,
    importData,
    refreshItems,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
