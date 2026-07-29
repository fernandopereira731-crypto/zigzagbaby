'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

export type GalleryItem = {
  src: string
  alt: string
  /** Marks this item as a short video placeholder for future support. */
  video?: boolean
}

export function ProductGallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  const frameRef = useRef<HTMLDivElement | null>(null)

  const current = items[active]

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = frameRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setOrigin(`${x}% ${y}%`)
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {/* Thumbnails */}
      <div className="flex gap-3 overflow-x-auto md:flex-col md:overflow-visible">
        {items.map((item, i) => (
          <button
            key={item.alt}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Ver imagem ${i + 1}`}
            aria-pressed={i === active}
            className={cn(
              'relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-muted transition-all',
              i === active
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50',
            )}
          >
            <Image
              src={item.src || '/placeholder.svg'}
              alt={item.alt}
              fill
              sizes="80px"
              className="object-cover"
            />
            {item.video && (
              <span className="absolute inset-0 flex items-center justify-center bg-foreground/30">
                <Play className="h-5 w-5 fill-background text-background" aria-hidden="true" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="relative flex-1">
        <div
          ref={frameRef}
          onMouseEnter={() => !current.video && setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={handleMove}
          className="relative aspect-square w-full overflow-hidden rounded-[2rem] border border-border bg-muted"
        >
          <Image
            key={current.src}
            src={current.src || '/placeholder.svg'}
            alt={current.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ transformOrigin: origin }}
            className={cn(
              'zzb-animate-fade-in object-cover transition-transform duration-300 ease-out',
              zoom ? 'scale-[1.7] cursor-zoom-in' : 'scale-100',
            )}
          />
          {current.video && (
            <button
              type="button"
              aria-label="Reproduzir vídeo do produto"
              className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/20 transition-colors hover:bg-foreground/30"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-background/90 shadow-lg">
                <Play className="h-7 w-7 fill-primary text-primary" aria-hidden="true" />
              </span>
            </button>
          )}
          {!current.video && (
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
              Passe o mouse para dar zoom
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
