"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Trash2, Download, Upload, RefreshCw, Moon, Sun, Monitor } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { useToast } from "@/hooks/use-toast"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { AdjustmentCalculator } from "@/components/adjustment-calculator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// تعديل الكود للتحقق من وجود localStorage قبل استخدامه

// في بداية الملف، أضف هذه الدالة المساعدة للتحقق من وجود localStorage
const getLocalStorageItem = (key: string, defaultValue: string): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key) || defaultValue
  }
  return defaultValue
}

const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value)
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { clearAllItems, exportData, importData } = useApp()
  const [importDataText, setImportDataText] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const handleClearAllItems = async () => {
    setClearDialogOpen(false)
    setIsClearing(true)

    try {
      clearAllItems()
      router.push("/")
    } catch (error) {
      console.error("Error clearing items:", error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleExportData = async () => {
    try {
      setIsExporting(true)
      const jsonData = exportData()

      // إنشاء blob وتنزيله
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `maintenance-tracker-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير البيانات بنجاح",
        variant: "success",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async () => {
    if (!importDataText.trim()) {
      toast({
        title: "بيانات فارغة",
        description: "يرجى إدخال بيانات JSON صالحة",
        variant: "destructive",
      })
      return
    }

    try {
      setIsImporting(true)
      importData(importDataText)
      setImportDataText("")
      router.push("/")
    } catch (error) {
      console.error("Error importing data:", error)
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportDataText(content)
    }
    reader.readAsText(file)
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button variant="outline" onClick={() => router.push("/")} className="mb-6">
        <ArrowRight className="ml-2 h-4 w-4" />
        العودة للرئيسية
      </Button>

      <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="data">البيانات</TabsTrigger>
          <TabsTrigger value="calculator">ضبط الحساب</TabsTrigger>
          <TabsTrigger value="display">إعدادات العرض</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة البيانات</CardTitle>
              <CardDescription>تصدير واستيراد وحذف البيانات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">تصدير البيانات</h3>
                <p className="text-sm text-muted-foreground">قم بتصدير جميع بيانات التطبيق كملف JSON للنسخ الاحتياطي</p>
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      جاري التصدير...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      تصدير البيانات
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">استيراد البيانات</h3>
                <p className="text-sm text-muted-foreground">
                  قم باستيراد البيانات من ملف JSON. سيؤدي هذا إلى استبدال جميع البيانات الحالية.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="file-upload">اختر ملف JSON</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="import-data">أو الصق محتوى JSON</Label>
                  <Textarea
                    id="import-data"
                    placeholder='{"items": [...]}'
                    value={importDataText}
                    onChange={(e) => setImportDataText(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button
                    onClick={handleImportData}
                    disabled={isImporting || !importDataText.trim()}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        جاري الاستيراد...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        استيراد البيانات
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">حذف جميع البيانات</h3>
                <p className="text-sm text-muted-foreground">
                  سيؤدي هذا إلى حذف جميع العناصر وتنظيف الكاش. لا يمكن التراجع عن هذا الإجراء.
                </p>

                <Button
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isClearing}
                  onClick={() => setClearDialogOpen(true)}
                >
                  {isClearing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      جاري المسح...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      حذف جميع البيانات
                    </>
                  )}
                </Button>

                <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        سيتم حذف جميع العناصر وتنظيف الكاش. لا يمكن التراجع عن هذا الإجراء.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAllItems}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        تأكيد الحذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ضبط الحساب</CardTitle>
              <CardDescription>تعديل معدل الحساب وضبط القراءات التقديرية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AdjustmentCalculator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات العرض</CardTitle>
              <CardDescription>تخصيص طريقة عرض البيانات والواجهة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">حجم البطاقات</h3>
                  <RadioGroup
                    defaultValue={getLocalStorageItem("cardSize", "medium")}
                    onValueChange={(value) => {
                      setLocalStorageItem("cardSize", value)
                      toast({
                        title: "تم الحفظ",
                        description: "تم حفظ إعدادات حجم البطاقات",
                        variant: "success",
                      })
                    }}
                    className="grid grid-cols-3 gap-2"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="border rounded-lg p-2 w-full h-24 flex items-center justify-center">
                        <div className="w-16 h-16 bg-muted rounded-md"></div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                        <RadioGroupItem value="small" id="card-small" />
                        <Label htmlFor="card-small">صغير</Label>
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="border rounded-lg p-2 w-full h-24 flex items-center justify-center">
                        <div className="w-20 h-20 bg-muted rounded-md"></div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                        <RadioGroupItem value="medium" id="card-medium" />
                        <Label htmlFor="card-medium">متوسط</Label>
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="border rounded-lg p-2 w-full h-24 flex items-center justify-center">
                        <div className="w-24 h-24 bg-muted rounded-md"></div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                        <RadioGroupItem value="large" id="card-large" />
                        <Label htmlFor="card-large">كبير</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">عدد العناصر في الصفحة</h3>
                  <div className="grid gap-2">
                    <Label htmlFor="items-per-page">عدد العناصر</Label>
                    <Select
                      defaultValue={getLocalStorageItem("itemsPerPage", "9")}
                      onValueChange={(value) => {
                        setLocalStorageItem("itemsPerPage", value)
                        toast({
                          title: "تم الحفظ",
                          description: "تم حفظ إعدادات عدد العناصر في الصفحة",
                          variant: "success",
                        })
                      }}
                    >
                      <SelectTrigger id="items-per-page">
                        <SelectValue placeholder="اختر عدد العناصر" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 عناصر</SelectItem>
                        <SelectItem value="9">9 عناصر</SelectItem>
                        <SelectItem value="12">12 عنصر</SelectItem>
                        <SelectItem value="15">15 عنصر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">وضع العرض</h3>
                  <RadioGroup
                    value={theme}
                    onValueChange={(value) => setTheme(value)}
                    className="grid grid-cols-3 gap-2"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        فاتح
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        داكن
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        النظام
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">ترتيب العناصر</h3>
                  <Select
                    defaultValue={getLocalStorageItem("itemsSort", "name")}
                    onValueChange={(value) => {
                      setLocalStorageItem("itemsSort", value)
                      toast({
                        title: "تم الحفظ",
                        description: "تم حفظ إعدادات ترتيب العناصر",
                        variant: "success",
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">حسب الاسم</SelectItem>
                      <SelectItem value="date">حسب تاريخ الإضافة</SelectItem>
                      <SelectItem value="reading">حسب القراءة الحالية</SelectItem>
                      <SelectItem value="remaining">حسب المتبقي للصيانة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
