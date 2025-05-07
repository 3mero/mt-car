export interface Item {
  id: string
  name: string
  type: "distance" | "time"
  currentReading: number
  consumptionRate: number
  consumptionPeriod: "daily" | "weekly" | "monthly"
  maintenanceThreshold: number
  maintenanceOption: "5000" | "10000" | "15000" | "custom"
  createdAt: string
  updatedAt: string
  manuallyAdjusted: boolean
  manualEstimation: string | null
  isPinned?: boolean
  adjustmentOffset?: number // إضافة حقل جديد لتخزين قيمة التعديل
}
