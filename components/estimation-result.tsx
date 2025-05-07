"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Gauge, AlertTriangle, CheckCircle } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import type { Item } from "@/types/item"
import { calculateEstimation, getEstimatedCurrentReading } from "@/lib/estimations"

interface EstimationResultProps {
  item: Item
}

export function EstimationResult({ item }: EstimationResultProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [estimation, setEstimation] = useState(() => {
    try {
      return calculateEstimation(item)
    } catch (error) {
      console.error("Error calculating estimation:", error)
      return {
        daysLeft: 0,
        weeksLeft: 0,
        estimatedDate: new Date(),
        estimatedCurrentReading: item?.currentReading || 0,
        nextMaintenanceReading: (item?.currentReading || 0) + (item?.maintenanceThreshold || 0),
        status: "normal" as const,
      }
    }
  })

  // تحديث الوقت كل دقيقة لتحديث القراءات التقديرية
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
      try {
        setEstimation(calculateEstimation(item))
      } catch (error) {
        console.error("Error updating estimation:", error)
      }
    }, 60 * 1000) // دقيقة واحدة بالمللي ثانية

    return () => clearInterval(intervalId)
  }, [item])

  // التعامل مع الأخطاء المحتملة أو البيانات المفقودة
  if (!item || typeof item !== "object") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>خطأ في البيانات</CardTitle>
          <CardDescription>لا يمكن عرض التقديرات بسبب خطأ في البيانات</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // حساب نسبة التقدم
  const estimatedCurrentReading = getEstimatedCurrentReading(item)
  const nextMaintenanceReading = item.currentReading + item.maintenanceThreshold
  const totalDistance = item.maintenanceThreshold
  const consumedDistance = estimatedCurrentReading - item.currentReading
  const progressPercentage = totalDistance > 0 ? Math.min(100, (consumedDistance / totalDistance) * 100) : 100

  // تحديد الحالة
  let statusIcon = <CheckCircle className="h-5 w-5" />
  let statusClass = "bg-success/20 text-success hover:bg-success/30 border border-success"
  let progressColorClass = "bg-success"
  let borderColorClass = "border-success"
  let bgColorClass = "bg-success/10"

  if (estimation.status === "critical") {
    statusIcon = <AlertTriangle className="h-5 w-5" />
    statusClass = "bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive"
    progressColorClass = "bg-destructive"
    borderColorClass = "border-destructive"
    bgColorClass = "bg-destructive/10"
  } else if (estimation.status === "warning") {
    statusIcon = <Gauge className="h-5 w-5" />
    statusClass = "bg-warning/20 text-warning hover:bg-warning/30 border border-warning"
    progressColorClass = "bg-warning"
    borderColorClass = "border-warning"
    bgColorClass = "bg-warning/10"
  }

  return (
    <Card className={`border-2 ${borderColorClass}`}>
      <CardHeader className={`pb-2 ${bgColorClass} rounded-t-lg`}>
        <CardTitle>تقدير موعد الصيانة</CardTitle>
        <CardDescription>بناءً على معدل الاستهلاك الحالي</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">القراءة الحالية</span>
              <span>{item.currentReading} كم</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">القراءة التقديرية الحالية</span>
              <span>{estimatedCurrentReading} كم</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">نقطة الصيانة القادمة</span>
              <span>{nextMaintenanceReading} كم</span>
            </div>
            <Progress value={progressPercentage} className={`h-2 ${progressColorClass}`} />
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">المتبقي للصيانة:</span>
              <span className={`text-2xl font-bold text-${progressColorClass.replace("bg-", "")}`}>
                {estimation.daysLeft} يوم
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المتبقي بالأسابيع:</span>
                <span>{estimation.weeksLeft.toFixed(1)} أسبوع</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">التاريخ المتوقع:</span>
                <span>{format(estimation.estimatedDate, "yyyy/MM/dd", { locale: ar })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المتبقي بالمسافة:</span>
                <span>{nextMaintenanceReading - estimatedCurrentReading} كم</span>
              </div>
            </div>

            <div className="mt-6">
              <Badge className={`w-full justify-center py-2 ${statusClass} flex gap-2 items-center`}>
                {statusIcon}
                {estimation.daysLeft > 0
                  ? `متبقي ${formatDistanceToNow(estimation.estimatedDate, { locale: ar })}`
                  : "تجاوز موعد الصيانة"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
