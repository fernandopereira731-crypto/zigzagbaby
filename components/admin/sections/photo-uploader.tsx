'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { UploadCloud, Star, Trash2, GripVertical, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type UploadedPhoto = {
  id: string
  url: string
  name: string
  originalKb: number
  webpKb: number
}

/**
 * Compresses an image file to WebP using a canvas and returns a data URL.
 * This genuinely prepares uploads for WebP delivery and reduces size.
 */
async function compressToWebp(
  file: File,
): Promise<{ url: string; webpKb: number }> {
  const bitmapUrl = URL.createObjectURL(file)
  try {
    const img = document.createElement('img')
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('load error'))
      img.src = bitmapUrl
    })

    const maxSize = 1200
    let { width, height } = img
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return { url: bitmapUrl, webpKb: Math.round(file.size / 1024) }
    ctx.drawImage(img, 0, 0, width, height)

    const dataUrl = canvas.toDataURL('image/webp', 0.82)
    const webpKb = Math.round((dataUrl.length * 0.75) / 1024)
    return { url: dataUrl, webpKb }
  } finally {
    URL.revokeObjectURL(bitmapUrl)
  }
}

export function PhotoUploader({
  initial = [],
  onChange,
}: {
  initial?: UploadedPhoto[]
  onChange?: (photos: UploadedPhoto[]) => void
}) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(initial)
  const [dragOver, setDragOver] = useState(false)

  // Mantém o formulário sincronizado com as fotos atuais (ordem inclusa).
  useEffect(() => {
    onChange?.(photos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos])
  const [busy, setBusy] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith('image/'),
    )
    const processed: UploadedPhoto[] = []
    for (const file of imageFiles) {
      const { url, webpKb } = await compressToWebp(file)
      processed.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url,
        name: file.name,
        originalKb: Math.round(file.size / 1024),
        webpKb,
      })
    }
    setPhotos((prev) => [...prev, ...processed])
    setBusy(false)
  }, [])

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  function makeMain(id: string) {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === id)
      if (idx <= 0) return prev
      const copy = [...prev]
      const [item] = copy.splice(idx, 1)
      copy.unshift(item)
      return copy
    })
  }

  function onDrop(index: number) {
    const from = dragIndex.current
    if (from === null || from === index) return
    setPhotos((prev) => {
      const copy = [...prev]
      const [item] = copy.splice(from, 1)
      copy.splice(index, 0, item)
      return copy
    })
    dragIndex.current = null
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void addFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/40',
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          {busy ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <UploadCloud className="h-7 w-7" />
          )}
        </span>
        <p className="mt-3 text-sm font-semibold text-foreground">
          Arraste as fotos aqui ou clique para selecionar
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG ou WebP · Compressão e conversão para WebP automáticas
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Selecionar fotos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void addFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {photos.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            Arraste para reordenar. A primeira foto é a principal da vitrine.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => (dragIndex.current = index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(index)}
                className={cn(
                  'group relative overflow-hidden rounded-xl border bg-muted',
                  index === 0 ? 'border-primary ring-2 ring-primary/30' : 'border-border',
                )}
              >
                <div className="relative aspect-square">
                  <Image
                    src={photo.url || '/placeholder.svg'}
                    alt={photo.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                {index === 0 && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    <Star className="h-3 w-3 fill-current" />
                    Principal
                  </span>
                )}

                <span className="absolute right-2 top-2 flex h-6 w-6 cursor-grab items-center justify-center rounded-md bg-background/80 text-muted-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-4 w-4" />
                </span>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/90 p-1.5 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => makeMain(photo.id)}
                    disabled={index === 0}
                    className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Principal
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir foto"
                    onClick={() => removePhoto(photo.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-secondary-foreground transition-colors hover:bg-secondary"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <span className="pointer-events-none absolute bottom-11 right-1 rounded bg-foreground/70 px-1.5 py-0.5 text-[9px] font-bold text-background opacity-0 transition-opacity group-hover:opacity-100">
                  {photo.webpKb}kb WebP
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
