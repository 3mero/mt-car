"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ItemForm } from "@/components/item-form"
import { EstimationResult } from "@/components/estimation-result"
import { Button } from "@/components/ui/button"
import { ArrowRight, Trash2, RefreshCw } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import type { Item } from "@/types/item"
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
import { useToast } from "@/hooks/use-toast"

export default function ItemPage() {
  const params = useParams()
  const router = useRouter()
  const { getItemById, deleteItem } = useApp()
  const { toast } = useToast()
  const [item, setItem] = useState<Item | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchItem = () => {
      setIsLoading(true)
      setError(null)

      if (!params || !params.id) {
        console.error("No ID parameter found in URL")
        setError("معرف العنصر غير موجود في الرابط")
        setIsLoading(false)
        return
      }

      const itemId = Array.isArray(params.id) ? params.id[0] : params.id
      console.log(`Fetching item with ID: ${itemId}`)

      try {
        const fetchedItem = getItemById(itemId)

        if (!fetchedItem) {
          console.error(`Item with ID ${itemId} not found`)
          setError("لم يتم العثور على العنصر")
          setItem(null)
        } else {
          console.log("Item fetched successfully:", fetchedItem)
          setItem(fetchedItem)
          setError(null)
        }
      } catch (error) {
        console.error("Error fetching item:", error)
        setError("حدث خطأ أثناء تحميل بيانات العنصر")
      } finally {
        setIsLoading(false)
      }
    }

    fetchItem()
  }, [params, getItemById])

  const handleDelete = () => {
    if (!params || !params.id) return

    const itemId = Array.isArray(params.id) ? params.id[0] : params.id
    setIsDeleting(true)
    setDeleteDialogOpen(false)

    try {
      // تأخير قصير لإظهار حالة الحذف
      setTimeout(() => {
        deleteItem(itemId)

        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف العنصر بنجاح",
          variant: "success",
        })

        // توجيه المستخدم إلى الصفحة الرئيسية بعد الحذف
        router.push("/")
      }, 300)
    } catch (error) {
      console.error("Error deleting item:", error)
      setIsDeleting(false)

      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف العنصر",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2">جاري التحميل...</p>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="container mx-auto p-4">
        <Button variant="outline" onClick={() => router.push("/")} className="mb-6">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>

        <div className="text-center py-8 border rounded-lg bg-secondary/30">
          <h3 className="text-xl font-medium mb-2">{error || "لم يتم العثور على العنصر"}</h3>
          <p className="text-muted-foreground mb-4">يرجى التحقق من الرابط أو المحاولة مرة أخرى</p>
          <Button onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            إعادة تحميل الصفحة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {isDeleting && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p>جاري الحذف...</p>
          </div>
        </div>
      )}

      <div className="container mx-auto p-4 max-w-4xl">
        <Button variant="outline" onClick={() => router.push("/")} className="mb-6">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-2xl font-bold mb-6">{item.name}</h1>
            <ItemForm item={item} />

            <div className="mt-8">
              <Button
                variant="destructive"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    حذف العنصر
                  </>
                )}
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">نتائج التقدير</h2>
            <EstimationResult item={item} />
          </div>
        </div>
      </div>

      {/* مربع حوار تأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف هذا العنصر نهائياً ولا يمكن التراجع عن هذه العملية.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
