import type { Item } from "@/types/item"
import { addDays, differenceInDays, differenceInHours, isValid } from "date-fns"

export interface EstimationResult {
  daysLeft: number
  weeksLeft: number
  estimatedDate: Date
  estimatedCurrentReading: number
  nextMaintenanceReading: number
  status: "normal" | "warning" | "critical"
}

// إضافة دالة تنسيق الأرقام باستخدام الأرقام الإنجليزية
export function formatNumber(number: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(number))
}

export function calculateEstimation(item: Item): EstimationResult {
  try {
    // التحقق من وجود البيانات المطلوبة
    if (
      !item ||
      typeof item.consumptionRate !== "number" ||
      typeof item.currentReading !== "number" ||
      typeof item.maintenanceThreshold !== "number" ||
      !item.consumptionPeriod
    ) {
      throw new Error("بيانات العنصر غير مكتملة")
    }

    // حساب معدل الاستهلاك اليومي
    let dailyRate = item.consumptionRate
    switch (item.consumptionPeriod) {
      case "weekly":
        dailyRate = item.consumptionRate / 7
        break
      case "monthly":
        dailyRate = item.consumptionRate / 30
        break
    }

    // التأكد من صحة التواريخ
    const lastUpdateDate = new Date(item.updatedAt)
    const now = new Date()

    // حساب الأيام منذ آخر تحديث
    const daysSinceUpdate = isValid(lastUpdateDate) ? Math.max(0, differenceInDays(now, lastUpdateDate)) : 0

    // حساب القراءة الحالية التقديرية
    const estimatedCurrentReading = Math.round(item.currentReading + dailyRate * daysSinceUpdate)

    // حساب قراءة الصيانة التالية
    const nextMaintenanceReading = item.currentReading + item.maintenanceThreshold

    // حساب الوحدات المتبقية
    const remainingUnits = nextMaintenanceReading - estimatedCurrentReading

    // حساب الأيام المتبقية
    const daysLeft = dailyRate > 0 ? Math.max(0, Math.ceil(remainingUnits / dailyRate)) : 999

    // حساب الأسابيع المتبقية
    const weeksLeft = daysLeft / 7

    // حساب التاريخ المتوقع
    const estimatedDate = addDays(now, daysLeft)

    // تحديد الحالة
    let status: "normal" | "warning" | "critical" = "normal"
    if (daysLeft <= 7) {
      status = "critical"
    } else if (daysLeft <= 30) {
      status = "warning"
    }

    return {
      daysLeft,
      weeksLeft,
      estimatedDate,
      estimatedCurrentReading,
      nextMaintenanceReading,
      status,
    }
  } catch (error) {
    console.error("Error calculating estimation:", error)
    // إرجاع قيم افتراضية في حالة حدوث خطأ
    return {
      daysLeft: 0,
      weeksLeft: 0,
      estimatedDate: new Date(),
      estimatedCurrentReading: item?.currentReading || 0,
      nextMaintenanceReading: (item?.currentReading || 0) + (item?.maintenanceThreshold || 0),
      status: "normal",
    }
  }
}

// الحصول على القراءة الحالية التقديرية التي تتحدث في الوقت الفعلي
export function getEstimatedCurrentReading(item: Item): number {
  try {
    if (!item || typeof item.currentReading !== "number" || !item.updatedAt) {
      return item?.currentReading || 0
    }

    // حساب معدل الاستهلاك بالساعة
    let dailyRate = item.consumptionRate
    switch (item.consumptionPeriod) {
      case "weekly":
        dailyRate = item.consumptionRate / 7
        break
      case "monthly":
        dailyRate = item.consumptionRate / 30
        break
    }
    const hourlyRate = dailyRate / 24

    // التأكد من صحة التاريخ
    const lastUpdateDate = new Date(item.updatedAt)
    if (!isValid(lastUpdateDate)) {
      return item.currentReading
    }

    const now = new Date()
    const hoursSinceUpdate = differenceInHours(now, lastUpdateDate)

    // تطبيق التعديل المخصص إذا كان موجودًا
    const adjustmentOffset = item.adjustmentOffset || 0

    return Math.round(item.currentReading + hourlyRate * Math.max(0, hoursSinceUpdate) + adjustmentOffset)
  } catch (error) {
    console.error("Error calculating estimated current reading:", error)
    return item?.currentReading || 0
  }
}
