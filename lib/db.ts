// نظام تخزين بسيط وموثوق باستخدام localStorage بدلاً من IndexedDB
// هذا سيحل مشاكل التزامن والتجمد التي تحدث مع IndexedDB

import { v4 as uuidv4 } from "uuid"
import type { Item } from "@/types/item"

// مفتاح التخزين في localStorage
const STORAGE_KEY = "maintenance-tracker-items"

// التحقق من وجود localStorage (للتوافق مع SSR)
const isLocalStorageAvailable = () => {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem("test", "test")
    window.localStorage.removeItem("test")
    return true
  } catch (e) {
    return false
  }
}

// الحصول على جميع العناصر
export function getItems(): Item[] {
  try {
    if (!isLocalStorageAvailable()) return []

    const items = localStorage.getItem(STORAGE_KEY)
    return items ? JSON.parse(items) : []
  } catch (error) {
    console.error("Error getting items:", error)
    return []
  }
}

// الحصول على عنصر بواسطة المعرف
export function getItemById(id: string): Item | undefined {
  try {
    if (!isLocalStorageAvailable()) return undefined

    const items = getItems()
    return items.find((item) => item.id === id)
  } catch (error) {
    console.error(`Error getting item with id ${id}:`, error)
    return undefined
  }
}

// حفظ عنصر جديد
export function saveItem(item: Item): void {
  try {
    if (!isLocalStorageAvailable()) {
      throw new Error("localStorage غير متوفر")
    }

    const items = getItems()
    const newItem = {
      ...item,
      id: item.id || uuidv4(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // التحقق مما إذا كان العنصر موجودًا بالفعل
    const index = items.findIndex((i) => i.id === newItem.id)

    if (index !== -1) {
      // تحديث العنصر الموجود
      items[index] = newItem
    } else {
      // إضافة عنصر جديد
      items.push(newItem)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.error("Error saving item:", error)
    throw new Error("فشل في حفظ العنصر")
  }
}

// تحديث عنصر موجود
export function updateItem(updatedItem: Item): void {
  try {
    if (!isLocalStorageAvailable()) {
      throw new Error("localStorage غير متوفر")
    }

    const items = getItems()
    const index = items.findIndex((item) => item.id === updatedItem.id)

    if (index !== -1) {
      items[index] = {
        ...updatedItem,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } else {
      throw new Error("العنصر غير موجود")
    }
  } catch (error) {
    console.error("Error updating item:", error)
    throw new Error("فشل في تحديث العنصر")
  }
}

// حذف عنصر بواسطة المعرف
export function deleteItem(id: string): void {
  try {
    if (!isLocalStorageAvailable()) {
      throw new Error("localStorage غير متوفر")
    }

    const items = getItems()
    const filteredItems = items.filter((item) => item.id !== id)

    if (items.length === filteredItems.length) {
      throw new Error("العنصر غير موجود")
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredItems))
  } catch (error) {
    console.error(`Error deleting item with id ${id}:`, error)
    throw new Error("فشل في حذف العنصر")
  }
}

// حذف جميع العناصر
export function clearAllItems(): void {
  try {
    if (!isLocalStorageAvailable()) {
      throw new Error("localStorage غير متوفر")
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  } catch (error) {
    console.error("Error clearing all items:", error)
    throw new Error("فشل في حذف جميع العناصر")
  }
}

// تصدير البيانات كملف JSON
export function exportData(): string {
  try {
    const items = getItems()
    return JSON.stringify(items, null, 2)
  } catch (error) {
    console.error("Error exporting data:", error)
    throw new Error("فشل في تصدير البيانات")
  }
}

// استيراد البيانات من ملف JSON
export function importData(jsonData: string): void {
  try {
    if (!isLocalStorageAvailable()) {
      throw new Error("localStorage غير متوفر")
    }

    const items = JSON.parse(jsonData) as Item[]

    if (!Array.isArray(items)) {
      throw new Error("تنسيق JSON غير صالح")
    }

    // التحقق من صحة البيانات
    items.forEach((item) => {
      if (!item.id || !item.name) {
        throw new Error("بيانات غير صالحة: كل عنصر يجب أن يحتوي على معرف واسم")
      }
    })

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.error("Error importing data:", error)
    throw new Error("فشل في استيراد البيانات")
  }
}
