'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { PublicProduct } from '@/lib/catalog-types'
import { ProductGallery, type GalleryItem } from './product-gallery'
import { ProductInfo } from './product-info'
import { SizeGuideTable } from './size-guide-table'

export function ProductMain({ product }: { product: PublicProduct }) {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)

  const gallery = useMemo<GalleryItem[]>(() => {
    if (product.gallery.length > 0) {
      return product.gallery.map((g) => ({ src: g.src, alt: g.alt }))
    }
    return [{ src: '/placeholder.svg', alt: product.name }]
  }, [product])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSizeGuideOpen(false)
    }
    if (sizeGuideOpen) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [sizeGuideOpen])

  return (
    <section aria-label="Detalhes principais do produto" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="zzb-animate-fade-in">
            <ProductGallery items={gallery} />
          </div>
          <ProductInfo
            product={product}
            onOpenSizeGuide={() => setSizeGuideOpen(true)}
          />
        </div>
      </div>

      {/* Size guide modal */}
      {sizeGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Guia de tamanhos"
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setSizeGuideOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="zzb-animate-fade-up max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                Guia de tamanhos
              </h2>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                aria-label="Fechar guia de tamanhos"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              As medidas são aproximadas e podem variar de acordo com o biotipo
              da criança. Na dúvida entre dois tamanhos, escolha o maior.
            </p>
            <SizeGuideTable />
          </div>
        </div>
      )}
    </section>
  )
}
