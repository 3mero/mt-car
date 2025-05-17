"use client"

import { AddItemWizard } from "@/components/add-item-wizard"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AddPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Button variant="outline" onClick={() => router.push("/")} className="mb-6">
        <ArrowRight className="ml-2 h-4 w-4" />
        العودة للرئيسية
      </Button>

      <AddItemWizard />
    </div>
  )
}
