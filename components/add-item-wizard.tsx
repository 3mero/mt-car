"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, ChevronsRight, ChevronsLeft } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { useApp } from "@/contexts/app-context"
import { useToast } from "@/hooks/use-toast"

// نوع البيانات للنموذج
interface FormData {
  name: string
  currentReading: number
  maintenanceThreshold: number
  maintenanceOption: "5000" | "10000" | "15000" | "custom"
  consumptionRate: number
  consumptionPeriod: "daily" | "weekly" | "monthly"
}

// نوع أخطاء النموذج
interface FormErrors {
  name?: string
  currentReading?: string
  maintenanceThreshold?: string
  consumptionRate?: string
  consumptionPeriod?: string
}

export function AddItemWizard() {
  const router = useRouter()
  const { saveItem } = useApp()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // حالة النموذج
  const [formData, setFormData] = useState<FormData>({
    name: "",
    currentReading: 0,
    maintenanceThreshold: 10000,
    maintenanceOption: "10000",
    consumptionRate: 0,
    consumptionPeriod: "weekly",
  })

  // حالة أخطاء النموذج
  const [errors, setErrors] = useState<FormErrors>({})

  // تحديث قيمة في النموذج
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // مسح الخطأ عند تحديث القيمة
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // التحقق من صحة الخطوة الأولى
  const validateStep1 = () => {
    const newErrors: FormErrors = {}

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "يجب أن يحتوي الاسم على حرفين على الأقل"
    }

    if (formData.currentReading < 0) {
      newErrors.currentReading = "يجب أن تكون القراءة الحالية رقماً موجباً"
    }

    if (formData.maintenanceThreshold <= 0) {
      newErrors.maintenanceThreshold = "يجب أن تكون نقطة الصيانة رقماً موجباً أكبر من صفر"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // التحقق من صحة الخطوة الثانية
  const validateStep2 = () => {
    const newErrors: FormErrors = {}

    if (formData.consumptionRate <= 0) {
      newErrors.consumptionRate = "يجب أن يكون معدل الاستهلاك رقماً موجباً أكبر من صفر"
    }

    if (!formData.consumptionPeriod) {
      newErrors.consumptionPeriod = "يرجى اختيار فترة الاستهلاك"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // الانتقال إلى الخطوة التالية
  const goToNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2)
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3)
      }
    }
  }

  // الانتقال إلى الخطوة السابقة
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // معالجة تغيير خيار الصيانة
  const handleMaintenanceOptionChange = (value: string) => {
    if (value === "5000" || value === "10000" || value === "15000" || value === "custom") {
      updateFormData("maintenanceOption", value)

      if (value !== "custom") {
        updateFormData("maintenanceThreshold", Number.parseInt(value))
      }
    }
  }

  // إرسال النموذج
  const handleSubmit = () => {
    if (validateStep1() && validateStep2()) {
      setIsSubmitting(true)

      try {
        // إنشاء عنصر جديد
        const newItem = {
          id: uuidv4(),
          ...formData,
          type: "distance" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          manuallyAdjusted: false,
          manualEstimation: null,
          adjustmentOffset: 0,
        }

        saveItem(newItem)

        toast({
          title: "تم الإضافة بنجاح",
          description: "تم إضافة العنصر الجديد بنجاح",
          variant: "success",
        })

        router.push("/")
      } catch (error) {
        console.error("Error saving item:", error)

        toast({
          title: "خطأ في الإضافة",
          description: "حدث خطأ أثناء إضافة العنصر",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إضافة عنصر جديد</h1>
      </div>

      {/* خطوات المعالج */}
      <div className="flex justify-between items-center">
        <div
          className={`flex items-center ${step === 3 ? "text-primary" : "text-muted-foreground"} cursor-pointer`}
          onClick={() => validateStep1() && validateStep2() && setStep(3)}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              step === 3 ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {step > 3 ? <Check className="h-5 w-5" /> : "3"}
          </div>
          <span>التأكيد</span>
        </div>

        <div
          className={`flex items-center ${step === 2 ? "text-primary" : "text-muted-foreground"} cursor-pointer`}
          onClick={() => validateStep1() && setStep(2)}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              step === 2
                ? "bg-primary text-primary-foreground"
                : step > 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
            }`}
          >
            {step > 2 ? <Check className="h-5 w-5" /> : "2"}
          </div>
          <span>معدل الاستهلاك</span>
        </div>

        <div
          className={`flex items-center ${step === 1 ? "text-primary" : "text-muted-foreground"} cursor-pointer`}
          onClick={() => setStep(1)}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              step === 1
                ? "bg-primary text-primary-foreground"
                : step > 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
            }`}
          >
            {step > 1 ? <Check className="h-5 w-5" /> : "1"}
          </div>
          <span>المعلومات الأساسية</span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">اسم العنصر</Label>
              <Input
                id="name"
                placeholder="مثال: سيارة تويوتا"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              <p className="text-sm text-muted-foreground">اسم العنصر الذي تريد تتبع صيانته</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentReading">القراءة الحالية (كم)</Label>
              <Input
                id="currentReading"
                type="number"
                value={formData.currentReading}
                onChange={(e) => updateFormData("currentReading", Number(e.target.value))}
              />
              {errors.currentReading && <p className="text-sm text-destructive">{errors.currentReading}</p>}
              <p className="text-sm text-muted-foreground">عدد الكيلومترات الحالية</p>
            </div>

            <div className="space-y-2">
              <Label>نقطة الصيانة (كم)</Label>
              <RadioGroup
                value={formData.maintenanceOption}
                onValueChange={handleMaintenanceOptionChange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-0 space-x-reverse space-y-0 rtl:space-x-reverse">
                  <RadioGroupItem value="5000" id="r1" />
                  <Label className="mr-2 font-normal" htmlFor="r1">
                    5,000 كم
                  </Label>
                </div>
                <div className="flex items-center space-x-0 space-x-reverse space-y-0 rtl:space-x-reverse">
                  <RadioGroupItem value="10000" id="r2" />
                  <Label className="mr-2 font-normal" htmlFor="r2">
                    10,000 كم
                  </Label>
                </div>
                <div className="flex items-center space-x-0 space-x-reverse space-y-0 rtl:space-x-reverse">
                  <RadioGroupItem value="15000" id="r3" />
                  <Label className="mr-2 font-normal" htmlFor="r3">
                    15,000 كم
                  </Label>
                </div>
                <div className="flex items-center space-x-0 space-x-reverse space-y-0 rtl:space-x-reverse">
                  <RadioGroupItem value="custom" id="r4" />
                  <Label className="mr-2 font-normal" htmlFor="r4">
                    تخصيص
                  </Label>
                </div>
              </RadioGroup>

              {formData.maintenanceOption === "custom" && (
                <div className="mt-2 pr-6">
                  <Input
                    type="number"
                    value={formData.maintenanceThreshold}
                    onChange={(e) => updateFormData("maintenanceThreshold", Number(e.target.value))}
                  />
                  {errors.maintenanceThreshold && (
                    <p className="text-sm text-destructive">{errors.maintenanceThreshold}</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="button" onClick={goToNextStep} className="flex items-center gap-2">
                التالي
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="consumptionRate">معدل الاستهلاك (كم)</Label>
              <Input
                id="consumptionRate"
                type="number"
                value={formData.consumptionRate}
                onChange={(e) => updateFormData("consumptionRate", Number(e.target.value))}
              />
              {errors.consumptionRate && <p className="text-sm text-destructive">{errors.consumptionRate}</p>}
              <p className="text-sm text-muted-foreground">عدد الكيلومترات في الفترة المحددة</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumptionPeriod">فترة الاستهلاك</Label>
              <Select
                value={formData.consumptionPeriod}
                onValueChange={(value) => updateFormData("consumptionPeriod", value as "daily" | "weekly" | "monthly")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر فترة الاستهلاك" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومياً</SelectItem>
                  <SelectItem value="weekly">أسبوعياً</SelectItem>
                  <SelectItem value="monthly">شهرياً</SelectItem>
                </SelectContent>
              </Select>
              {errors.consumptionPeriod && <p className="text-sm text-destructive">{errors.consumptionPeriod}</p>}
              <p className="text-sm text-muted-foreground">الفترة الزمنية لمعدل الاستهلاك</p>
            </div>

            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" onClick={goToPreviousStep} className="flex items-center gap-2">
                <ChevronsRight className="h-4 w-4" />
                السابق
              </Button>
              <Button type="button" onClick={goToNextStep} className="flex items-center gap-2">
                التالي
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">مراجعة المعلومات</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">اسم العنصر</p>
                  <p className="font-medium">{formData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">القراءة الحالية</p>
                  <p className="font-medium">{formData.currentReading} كم</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نقطة الصيانة</p>
                  <p className="font-medium">{formData.maintenanceThreshold} كم</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">معدل الاستهلاك</p>
                  <p className="font-medium">
                    {formData.consumptionRate} كم{" "}
                    {formData.consumptionPeriod === "daily"
                      ? "يومياً"
                      : formData.consumptionPeriod === "weekly"
                        ? "أسبوعياً"
                        : "شهرياً"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" onClick={goToPreviousStep} className="flex items-center gap-2">
                <ChevronsRight className="h-4 w-4" />
                السابق
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
                {isSubmitting ? "جاري الحفظ..." : "إضافة العنصر"}
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
