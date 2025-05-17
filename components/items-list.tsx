"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow, isValid, format } from "date-fns"
import { ar } from "date-fns/locale"
import {
  Gauge,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  PinOff,
  Edit,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Milestone,
  Activity,
  ArrowRight,
  Ruler,
  BarChart,
  Car,
  Wrench,
  GaugeIcon as Speedometer,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { calculateEstimation, getEstimatedCurrentReading } from "@/lib/estimations"
import { useApp } from "@/contexts/app-context"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// تعديل ثابت ITEMS_PER_PAGE ليستخدم القيمة المخزنة في localStorage
const ITEMS_PER_PAGE = typeof window !== "undefined" ? Number(localStorage.getItem("itemsPerPage") || "9") : 9

// دالة لتنسيق الأرقام بشكل احترافي
const formatNumber = (number: number): string => {
  return new Intl.NumberFormat("en-US").format(Math.round(number))
}

export function ItemsList() {
  const { items, isLoading, error, updateItem, deleteItem } = useApp()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [currentEditItem, setCurrentEditItem] = useState<any>(null)
  const [editValues, setEditValues] = useState({
    currentReading: 0,
    maintenanceThreshold: 0,
    consumptionRate: 0,
    adjustmentOffset: 0,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  // تحديث الوقت كل ساعة لتحديث القراءات التقديرية
  useEffect(() => {
    // تعيين الوقت الحالي عند التحميل
    setCurrentTime(new Date())

    // تحديث الوقت كل ساعة للتحديثات الفعلية
    const hourlyInterval = setInterval(
      () => {
        setCurrentTime(new Date())
      },
      60 * 60 * 1000,
    ) // كل ساعة

    return () => {
      clearInterval(hourlyInterval)
    }
  }, [])

  // إضافة تأثير لتحديث عدد العناصر في الصفحة عند تغييره في الإعدادات
  useEffect(() => {
    const handleStorageChange = () => {
      const newItemsPerPage = Number(localStorage.getItem("itemsPerPage") || "9")
      if (newItemsPerPage !== ITEMS_PER_PAGE) {
        // إعادة تحميل الصفحة لتطبيق التغييرات
        window.location.reload()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // تحديث عدد الصفحات عند تغير العناصر
  useEffect(() => {
    setTotalPages(Math.ceil(items.length / ITEMS_PER_PAGE) || 1)
  }, [items])

  const handleEditClick = (item: any) => {
    // استخدام القراءة التقديرية الحالية بدلاً من القراءة الأصلية
    const estimatedCurrentReading = getEstimatedCurrentReading(item)

    setCurrentEditItem(item)
    setEditValues({
      currentReading: estimatedCurrentReading, // استخدام القراءة التقديرية
      maintenanceThreshold: item.maintenanceThreshold,
      consumptionRate: item.consumptionRate,
      adjustmentOffset: item.adjustmentOffset || 0, // إضافة قيمة التعديل
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!currentEditItem) return

    try {
      const updatedItem = {
        ...currentEditItem,
        currentReading: Number(editValues.currentReading),
        maintenanceThreshold: Number(editValues.maintenanceThreshold),
        consumptionRate: Number(editValues.consumptionRate),
        adjustmentOffset: Number(editValues.adjustmentOffset || 0), // حفظ قيمة التعديل
        updatedAt: new Date().toISOString(), // تحديث وقت التعديل
        manuallyAdjusted: true, // تعيين علامة التعديل اليدوي
      }

      updateItem(updatedItem)
      setEditDialogOpen(false)

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث القراءات بنجاح",
        variant: "success",
      })
    } catch (error) {
      console.error("Error updating item:", error)
      setEditDialogOpen(false)

      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث القراءات",
        variant: "destructive",
      })
    }
  }

  const handleTogglePin = (item: any) => {
    try {
      const updatedItem = {
        ...item,
        isPinned: !item.isPinned,
      }
      updateItem(updatedItem)
    } catch (error) {
      console.error("Error toggling pin:", error)
    }
  }

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    setDeleteDialogOpen(false)

    try {
      deleteItem(itemToDelete)
      setItemToDelete(null)
    } catch (error) {
      console.error("Error deleting item:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // تحويل عدد الأيام إلى نص مناسب
  const formatDaysLeft = (days: number) => {
    if (days <= 0) {
      return "تجاوز موعد الصيانة"
    } else if (days < 7) {
      return `${days} أيام`
    } else if (days < 30) {
      const weeks = Math.floor(days / 7)
      return `${weeks} أسابيع`
    } else if (days < 365) {
      const months = Math.floor(days / 30)
      return `${months} أشهر`
    } else {
      const years = Math.floor(days / 365)
      return `${years} سنوات`
    }
  }

  // حساب معدل الاستهلاك اليومي
  const getDailyConsumptionRate = (item: any) => {
    let dailyRate = item.consumptionRate
    switch (item.consumptionPeriod) {
      case "weekly":
        dailyRate = item.consumptionRate / 7
        break
      case "monthly":
        dailyRate = item.consumptionRate / 30
        break
    }
    return Math.round(dailyRate)
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2">جاري التحميل...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 border rounded-lg bg-destructive/10">
        <h3 className="text-xl font-medium mb-2 text-destructive">{error}</h3>
        <p className="text-muted-foreground">حدث خطأ أثناء تحميل البيانات</p>
      </div>
    )
  }

  if (items.length === 0) {
    return null // سيتم عرض حالة فارغة في الصفحة الرئيسية
  }

  // حساب الصفحات
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length)
  const currentItems = items.slice(startIndex, endIndex)

  return (
    <TooltipProvider>
      <>
        {isDeleting && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p>جاري الحذف...</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentItems.map((item) => {
            try {
              if (!item || !item.id) return null

              const estimation = calculateEstimation(item)
              const daysLeft = estimation.daysLeft
              const estimatedCurrentReading = getEstimatedCurrentReading(item)
              const nextMaintenanceReading = item.currentReading + item.maintenanceThreshold
              const remainingDistance = nextMaintenanceReading - estimatedCurrentReading

              // حساب نسبة التقدم
              const totalDistance = item.maintenanceThreshold
              const consumedDistance = estimatedCurrentReading - item.currentReading
              const progressPercentage =
                totalDistance > 0 ? Math.min(100, (consumedDistance / totalDistance) * 100) : 100

              // تحديد الحالة والتنسيق
              let statusIcon = <CheckCircle className="h-6 w-6" />
              let statusClass = "status-normal"
              let statusBorderClass = "border-success"
              let statusBgClass = "bg-success/10"
              let statusTextClass = "text-success"
              let badgeClass = "badge-normal"
              let progressColorClass = "bg-success"

              if (estimation.status === "critical") {
                statusIcon = <AlertTriangle className="h-6 w-6" />
                statusClass = "status-critical"
                statusBorderClass = "border-destructive"
                statusBgClass = "bg-destructive/10"
                statusTextClass = "text-destructive"
                badgeClass = "badge-critical"
                progressColorClass = "bg-destructive"
              } else if (estimation.status === "warning") {
                statusIcon = <Gauge className="h-6 w-6" />
                statusClass = "status-warning"
                statusBorderClass = "border-warning"
                statusBgClass = "bg-warning/10"
                statusTextClass = "text-warning"
                badgeClass = "badge-warning"
                progressColorClass = "bg-warning"
              }

              // التأكد من صحة التاريخ المقدر
              const estimatedDate = estimation.estimatedDate
              const isValidDate = isValid(estimatedDate)

              // حساب معدل الاستهلاك اليومي
              const dailyConsumptionRate = getDailyConsumptionRate(item)

              // تحديد اتجاه الاستهلاك (هل هو مرتفع أم منخفض)
              const consumptionTrend =
                dailyConsumptionRate > 50 ? (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-success" />
                )

              // تنسيق تاريخ آخر تحديث
              const lastUpdated = new Date(item.updatedAt)
              const formattedLastUpdate = isValid(lastUpdated)
                ? format(lastUpdated, "yyyy/MM/dd", { locale: ar })
                : "غير معروف"

              return (
                <Card
                  key={item.id}
                  className={`dashboard-card cursor-pointer relative ${statusBorderClass} border overflow-hidden ${
                    typeof window !== "undefined" && localStorage.getItem("cardSize") === "small"
                      ? "max-w-xs"
                      : typeof window !== "undefined" && localStorage.getItem("cardSize") === "large"
                        ? "max-w-md"
                        : ""
                  }`}
                  onClick={(e) => {
                    // منع التنقل عند النقر على القائمة المنسدلة
                    if ((e.target as HTMLElement).closest("[data-dropdown-menu]")) {
                      e.stopPropagation()
                      return
                    }
                    router.push(`/items/${item.id}`)
                  }}
                >
                  {item.isPinned && (
                    <div className="absolute top-2 right-2 text-primary text-xl" title="مثبت">
                      📌
                    </div>
                  )}

                  <div className="absolute top-2 left-2 z-10" data-dropdown-menu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(item)
                          }}
                        >
                          <Edit className="ml-2 h-4 w-4" />
                          تعديل الأرقام
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTogglePin(item)
                          }}
                        >
                          {item.isPinned ? (
                            <>
                              <PinOff className="ml-2 h-4 w-4" />
                              إلغاء التثبيت
                            </>
                          ) : (
                            <>
                              <span className="ml-2">📌</span>
                              تثبيت
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardHeader className={`pb-2 ${statusBgClass}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription>تتبع بالمسافة</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 pb-0 relative">
                    {/* مؤشر الحالة في وسط البطاقة */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div
                        className={`w-12 h-12 rounded-full ${statusClass} flex items-center justify-center shadow-lg border-4 border-background`}
                      >
                        {statusIcon}
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {/* معلومات القراءات */}
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Speedometer className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-muted-foreground">القراءة الحالية:</span>
                          </div>
                          <div className="text-center">
                            <span className="text-lg font-bold text-blue-500 font-mono">
                              {formatNumber(item.currentReading)}
                            </span>
                            <span className="text-xs text-muted-foreground mr-1">كم</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-indigo-500" />
                            <span className="text-xs text-muted-foreground">القراءة التقديرية:</span>
                          </div>
                          <div className="text-center">
                            <span className="text-lg font-bold text-indigo-500 font-mono">
                              {formatNumber(estimatedCurrentReading)}
                            </span>
                            <span className="text-xs text-muted-foreground mr-1">كم</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Milestone className="h-4 w-4 text-purple-500" />
                            <span className="text-xs text-muted-foreground">نقطة الصيانة:</span>
                          </div>
                          <div className="text-center">
                            <span className="text-lg font-bold text-purple-500 font-mono">
                              {formatNumber(nextMaintenanceReading)}
                            </span>
                            <span className="text-xs text-muted-foreground mr-1">كم</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs text-muted-foreground">المتبقي:</span>
                          </div>
                          <div className="text-center">
                            <span
                              className={`text-lg font-bold font-mono ${
                                remainingDistance <= 500
                                  ? "text-destructive"
                                  : remainingDistance <= 1000
                                    ? "text-warning"
                                    : "text-emerald-500"
                              }`}
                            >
                              {formatNumber(remainingDistance)}
                            </span>
                            <span className="text-xs text-muted-foreground mr-1">كم</span>
                          </div>
                        </div>
                      </div>

                      {/* شريط التقدم */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BarChart className="h-3 w-3" />
                            التقدم:
                          </span>
                          <span className="font-mono font-medium">{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className={`h-2 ${progressColorClass}`} />
                      </div>

                      {/* معلومات الوقت والتاريخ */}
                      <div className="grid grid-cols-2 gap-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                              <Clock className={`h-5 w-5 mb-1 ${statusTextClass}`} />
                              <span className={`text-xl font-bold ${statusTextClass} font-mono`}>{daysLeft}</span>
                              <span className="text-xs text-muted-foreground">يوم</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>المدة المتبقية حتى موعد الصيانة</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                              <Calendar className="h-5 w-5 mb-1 text-muted-foreground" />
                              <span className="text-lg font-medium font-mono">
                                {isValidDate ? format(estimatedDate, "MM/dd", { locale: ar }) : "--/--"}
                              </span>
                              <span className="text-xs text-muted-foreground">تاريخ الصيانة</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>التاريخ المتوقع للصيانة القادمة</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* معلومات إضافية */}
                      <div className="grid grid-cols-2 gap-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center mb-1">
                                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                                {consumptionTrend}
                              </div>
                              <span className="text-lg font-medium font-mono">{dailyConsumptionRate}</span>
                              <span className="text-xs text-muted-foreground">كم/يوم</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>معدل الاستهلاك اليومي</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                              <Wrench className="h-4 w-4 text-muted-foreground mb-1" />
                              <span className="text-sm font-medium font-mono">{formattedLastUpdate}</span>
                              <span className="text-xs text-muted-foreground">آخر تحديث</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>تاريخ آخر تحديث للبيانات</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className={`${statusBgClass} mt-4`}>
                    <div className="w-full">
                      <Badge className={`w-full justify-center py-1.5 ${badgeClass} flex gap-2 items-center`}>
                        <span className={statusTextClass}>{statusIcon}</span>
                        <span>
                          {daysLeft > 0 && isValidDate
                            ? `متبقي ${formatDistanceToNow(estimatedDate, { locale: ar })}`
                            : "تجاوز موعد الصيانة"}
                        </span>
                      </Badge>
                    </div>
                  </CardFooter>
                </Card>
              )
            } catch (error) {
              console.error(`Error processing item ${item?.id || "unknown"}:`, error)
              return null // تخطي عرض هذا العنصر في حالة حدوث خطأ
            }
          })}
        </div>

        {/* الصفحات */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* مربع حوار التعديل */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>تعديل الأرقام</DialogTitle>
              <DialogDescription>
                قم بتعديل القيم الرقمية للعنصر. سيتم الحفظ تلقائياً عند النقر على حفظ.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentReading" className="text-right flex items-center gap-1">
                  <Speedometer className="h-4 w-4 text-blue-500" />
                  <span>القراءة الحالية</span>
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="currentReading"
                    type="number"
                    value={editValues.currentReading}
                    onChange={(e) => setEditValues({ ...editValues, currentReading: Number(e.target.value) })}
                    className="pl-12 font-mono text-blue-500 font-medium"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">كم</span>
                </div>
                <div className="col-span-4 text-xs text-muted-foreground text-right pr-[25%]">
                  * هذه القيمة تعكس القراءة التقديرية الحالية
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maintenanceThreshold" className="text-right flex items-center gap-1">
                  <Milestone className="h-4 w-4 text-purple-500" />
                  <span>نقطة الصيانة</span>
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="maintenanceThreshold"
                    type="number"
                    value={editValues.maintenanceThreshold}
                    onChange={(e) => setEditValues({ ...editValues, maintenanceThreshold: Number(e.target.value) })}
                    className="pl-12 font-mono text-purple-500 font-medium"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">كم</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="consumptionRate" className="text-right flex items-center gap-1">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                  <span>معدل الاستهلاك</span>
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="consumptionRate"
                    type="number"
                    value={editValues.consumptionRate}
                    onChange={(e) => setEditValues({ ...editValues, consumptionRate: Number(e.target.value) })}
                    className="pl-12 font-mono text-amber-500 font-medium"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">كم</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="adjustmentOffset" className="text-right flex items-center gap-1">
                  <Ruler className="h-4 w-4 text-emerald-500" />
                  <span>تعديل القراءة</span>
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="adjustmentOffset"
                    type="number"
                    value={editValues.adjustmentOffset}
                    onChange={(e) => setEditValues({ ...editValues, adjustmentOffset: Number(e.target.value) })}
                    className="pl-12 font-mono text-emerald-500 font-medium"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">كم</span>
                </div>
                <div className="col-span-4 text-xs text-muted-foreground text-right pr-[25%]">
                  * قيمة التعديل تضاف أو تطرح من القراءة التقديرية
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSaveEdit}>
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* مربع حوار تأكيد الحذف */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف هذا العنصر نهائياً ولا يمكن التراجع عن هذه العملية.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleConfirmDelete}
              >
                تأكيد الحذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </TooltipProvider>
  )
}
