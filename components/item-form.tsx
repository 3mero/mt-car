"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Item } from "@/types/item"
import { useApp } from "@/contexts/app-context"
import { Car, GaugeIcon as Speedometer, Milestone, Activity, Timer } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يحتوي الاسم على حرفين على الأقل" }),
  currentReading: z.coerce.number().min(0, { message: "يجب أن تكون القراءة الحالية رقماً موجباً" }),
  consumptionRate: z.coerce.number().min(0, { message: "يجب أن يكون معدل الاستهلاك رقماً موجباً" }),
  consumptionPeriod: z.enum(["daily", "weekly", "monthly"], {
    required_error: "يرجى اختيار فترة الاستهلاك",
  }),
  maintenanceThreshold: z.coerce.number().min(0, { message: "يجب أن تكون نقطة الصيانة رقماً موجباً" }),
  maintenanceOption: z.enum(["5000", "10000", "15000", "custom"], {
    required_error: "يرجى اختيار خيار نقطة الصيانة",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface ItemFormProps {
  item: Item
}

// دالة لتنسيق الأرقام بشكل احترافي باستخدام الأرقام الإنجليزية
const formatNumber = (number: number): string => {
  return new Intl.NumberFormat("en-US").format(Math.round(number))
}

export function ItemForm({ item }: ItemFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateItem } = useApp()

  // تحديد خيار الصيانة الأولي
  const getInitialMaintenanceOption = () => {
    const threshold = item.maintenanceThreshold
    if (threshold === 5000) return "5000"
    if (threshold === 10000) return "10000"
    if (threshold === 15000) return "15000"
    return "custom"
  }

  const defaultValues: Partial<FormValues> = {
    name: item.name,
    currentReading: item.currentReading,
    consumptionRate: item.consumptionRate,
    consumptionPeriod: item.consumptionPeriod,
    maintenanceThreshold: item.maintenanceThreshold,
    maintenanceOption: getInitialMaintenanceOption(),
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const watchMaintenanceOption = form.watch("maintenanceOption")

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      // تحديث العنصر الموجود
      updateItem({
        ...item,
        ...data,
        type: "distance", // دائماً تعيين النوع إلى مسافة
        updatedAt: new Date().toISOString(),
      })

      router.push("/")
    } catch (error) {
      console.error("Error saving item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // معالجة تغيير خيار الصيانة
  const handleMaintenanceOptionChange = (value: string) => {
    form.setValue("maintenanceOption", value as "5000" | "10000" | "15000" | "custom")

    if (value !== "custom") {
      form.setValue("maintenanceThreshold", +value)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                اسم العنصر
              </FormLabel>
              <FormControl>
                <Input placeholder="مثال: سيارة تويوتا" {...field} className="border-primary/30" />
              </FormControl>
              <FormDescription>اسم العنصر الذي تريد تتبع صيانته</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="currentReading"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Speedometer className="h-4 w-4 text-blue-500" />
                  القراءة الحالية (كم)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : Number(e.target.value)
                        field.onChange(value)
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      className="pl-12 font-mono text-blue-500 font-medium border-blue-500/30"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">كم</span>
                  </div>
                </FormControl>
                <FormDescription>عدد الكيلومترات الحالية</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormField
              control={form.control}
              name="maintenanceOption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Milestone className="h-4 w-4 text-purple-500" />
                    نقطة الصيانة (كم)
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={handleMaintenanceOptionChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-0 space-x-reverse space-y-0 rtl:space-x-reverse">
                        <FormControl>
                          <RadioGroupItem value="5000" id="r1" />
                        </FormControl>
                        <FormLabel className="mr-2 font-normal flex items-center gap-1" htmlFor="r1">
                          <span className="font-mono text-purple-500">5,000</span> كم
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-0 space-x-reverse space-y-0 rtl:space-x-reverse">
                        <FormControl>
                          <RadioGroupItem value="10000" id="r2" />
                        </FormControl>
                        <FormLabel className="mr-2 font-normal flex items-center gap-1" htmlFor="r2">
                          <span className="font-mono text-purple-500">10,000</span> كم
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-0 space-x-reverse space-y-0 rtl:space-x-reverse">
                        <FormControl>
                          <RadioGroupItem value="15000" id="r3" />
                        </FormControl>
                        <FormLabel className="mr-2 font-normal flex items-center gap-1" htmlFor="r3">
                          <span className="font-mono text-purple-500">15,000</span> كم
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-0 space-x-reverse space-y-0 rtl:space-x-reverse">
                        <FormControl>
                          <RadioGroupItem value="custom" id="r4" />
                        </FormControl>
                        <FormLabel className="mr-2 font-normal" htmlFor="r4">
                          تخصيص
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchMaintenanceOption === "custom" && (
              <FormField
                control={form.control}
                name="maintenanceThreshold"
                render={({ field }) => (
                  <FormItem className="mt-2 pr-6">
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value === "" ? "" : Number(e.target.value)
                            field.onChange(value)
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          className="pl-12 font-mono text-purple-500 font-medium border-purple-500/30"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          كم
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {watchMaintenanceOption !== "custom" && (
              <FormField
                control={form.control}
                name="maintenanceThreshold"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" value={field.value} name={field.name} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="consumptionRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-500" />
                  معدل الاستهلاك (كم)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : Number(e.target.value)
                        field.onChange(value)
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      className="pl-12 font-mono text-amber-500 font-medium border-amber-500/30"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">كم</span>
                  </div>
                </FormControl>
                <FormDescription>عدد الكيلومترات في الفترة المحددة</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consumptionPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-emerald-500" />
                  فترة الاستهلاك
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-emerald-500/30">
                      <SelectValue placeholder="اختر فترة الاستهلاك" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">يومياً</SelectItem>
                    <SelectItem value="weekly">أسبوعياً</SelectItem>
                    <SelectItem value="monthly">شهرياً</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>الفترة الزمنية لمعدل الاستهلاك</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "جاري الحفظ..." : "تحديث العنصر"}
        </Button>
      </form>
    </Form>
  )
}
