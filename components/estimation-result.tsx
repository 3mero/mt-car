"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Gauge,
  AlertTriangle,
  CheckCircle,
  Milestone,
  Ruler,
  Clock,
  Calendar,
  Activity,
  ArrowRight,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import type { Item } from "@/types/item"
import { calculateEstimation, getEstimatedCurrentReading } from "@/lib/estimations"

interface EstimationResultProps {
  item: Item
}

// دالة لتنسيق الأرقام بشكل احترافي باستخدام الأرقام الإنجليزية
const formatNumber = (number: number): string => {
  return new Intl.NumberFormat("en-US").format(Math.round(number))
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

  // تحديث الوقت كل ساعة لتحديث القراءات التقديرية
  useEffect(() => {
    const intervalId = setInterval(
      () => {
        setCurrentTime(new Date())
        try {
          setEstimation(calculateEstimation(item))
        } catch (error) {
          console.error("Error updating estimation:", error)
        }
      },
      60 * 60 * 1000,
    ) // ساعة واحدة بالمللي ثانية

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
  const remainingDistance = nextMaintenanceReading - estimatedCurrentReading

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
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Ruler className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">القراءات الحالية</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    القراءة الحالية
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {formatNumber(item.currentReading)}
                  </span>
                  <span className="text-xs text-muted-foreground mr-1">كم</span>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    القراءة التقديرية
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatNumber(estimatedCurrentReading)}
                  </span>
                  <span className="text-xs text-muted-foreground mr-1">كم</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Milestone className="h-3 w-3" />
                    نقطة الصيانة
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {formatNumber(nextMaintenanceReading)}
                  </span>
                  <span className="text-xs text-muted-foreground mr-1">كم</span>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    المتبقي للصيانة
                  </span>
                </div>
                <div className="text-center">
                  <span
                    className={`text-xl font-bold font-mono ${
                      remainingDistance <= 500
                        ? "text-destructive"
                        : remainingDistance <= 1000
                          ? "text-warning"
                          : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatNumber(remainingDistance)}
                  </span>
                  <span className="text-xs text-muted-foreground mr-1">كم</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">نسبة الاستهلاك:</span>
                <span className="font-medium font-mono">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className={`h-2 ${progressColorClass}`} />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">الوقت المتبقي</span>
            </div>

            <div className="flex justify-between items-center mb-4 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
              <span className="text-muted-foreground">المتبقي للصيانة:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold font-mono ${
                    estimation.daysLeft <= 7
                      ? "text-destructive"
                      : estimation.daysLeft <= 30
                        ? "text-warning"
                        : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {estimation.daysLeft}
                </span>
                <span className="text-muted-foreground">يوم</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    المتبقي بالأسابيع:
                  </span>
                </div>
                <div className="text-center mt-1">
                  <span className="text-lg font-bold font-mono">{estimation.weeksLeft.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground mr-1">أسبوع</span>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    التاريخ المتوقع:
                  </span>
                </div>
                <div className="text-center mt-1">
                  <span className="text-lg font-bold font-mono">
                    {format(estimation.estimatedDate, "yyyy/MM/dd", { locale: ar })}
                  </span>
                </div>
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
