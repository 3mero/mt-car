"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/contexts/app-context"
import { getEstimatedCurrentReading } from "@/lib/estimations"
import { Calculator, Save, RefreshCw } from "lucide-react"

export function AdjustmentCalculator() {
  const { items, updateItem } = useApp()
  const { toast } = useToast()
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0)
  const [isPositive, setIsPositive] = useState<boolean>(true)
  const [estimatedReading, setEstimatedReading] = useState<number>(0)
  const [newReading, setNewReading] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // تحديث القراءة التقديرية عند تغيير العنصر المحدد
  useEffect(() => {
    if (selectedItemId) {
      const selectedItem = items.find((item) => item.id === selectedItemId)
      if (selectedItem) {
        const currentEstimatedReading = getEstimatedCurrentReading(selectedItem)
        setEstimatedReading(currentEstimatedReading)
        setNewReading(currentEstimatedReading)
      }
    } else {
      setEstimatedReading(0)
      setNewReading(0)
    }
  }, [selectedItemId, items])

  // حساب القراءة الجديدة عند تغيير قيمة التعديل
  useEffect(() => {
    if (estimatedReading > 0) {
      const adjustment = isPositive ? adjustmentValue : -adjustmentValue
      setNewReading(estimatedReading + adjustment)
    }
  }, [estimatedReading, adjustmentValue, isPositive])

  const handleAdjustmentChange = (value: string) => {
    const numValue = Number(value)
    setAdjustmentValue(isNaN(numValue) ? 0 : numValue)
  }

  const handleSaveAdjustment = async () => {
    if (!selectedItemId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار عنصر أولاً",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const selectedItem = items.find((item) => item.id === selectedItemId)
      if (selectedItem) {
        // حساب قيمة التعديل
        const adjustment = isPositive ? adjustmentValue : -adjustmentValue

        // تحديث القراءة الحالية للعنصر
        const updatedItem = {
          ...selectedItem,
          currentReading: newReading,
          updatedAt: new Date().toISOString(),
          manuallyAdjusted: true,
          adjustmentOffset: adjustment, // حفظ قيمة التعديل
        }

        updateItem(updatedItem)

        toast({
          title: "تم الضبط بنجاح",
          description: `تم ضبط قراءة ${selectedItem.name} إلى ${newReading} كم`,
          variant: "success",
        })

        // إعادة تعيين القيم
        setAdjustmentValue(0)
      }
    } catch (error) {
      console.error("Error adjusting reading:", error)
      toast({
        title: "خطأ في الضبط",
        description: "حدث خطأ أثناء ضبط القراءة",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">ضبط القراءة التقديرية</h3>
        <p className="text-sm text-muted-foreground">
          استخدم هذه الأداة لضبط القراءة التقديرية الحالية للعناصر. يمكنك إضافة أو طرح قيمة من القراءة الحالية.
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="item-select">اختر العنصر</Label>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger id="item-select">
              <SelectValue placeholder="اختر عنصراً" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedItemId && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">القراءة التقديرية الحالية:</span>
                  <span className="font-medium">{estimatedReading} كم</span>
                </div>

                <div className="grid grid-cols-5 gap-2 items-center">
                  <div className="col-span-1">
                    <Select value={isPositive ? "add" : "subtract"} onValueChange={(v) => setIsPositive(v === "add")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">+</SelectItem>
                        <SelectItem value="subtract">-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      value={adjustmentValue}
                      onChange={(e) => handleAdjustmentChange(e.target.value)}
                      placeholder="قيمة التعديل"
                    />
                  </div>
                </div>

                <div className="flex justify-between font-medium">
                  <span>القراءة الجديدة:</span>
                  <span className="text-primary">{newReading} كم</span>
                </div>

                <Button
                  onClick={handleSaveAdjustment}
                  disabled={isLoading || adjustmentValue === 0}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      حفظ التعديل
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Calculator className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">كيفية استخدام أداة الضبط</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
                <li>اختر العنصر الذي تريد ضبط قراءته</li>
                <li>أضف أو اطرح قيمة من القراءة الحالية</li>
                <li>اضغط على "حفظ التعديل" لتطبيق التغييرات</li>
                <li>سيتم تحديث جميع الحسابات والتقديرات بناءً على القراءة الجديدة</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
