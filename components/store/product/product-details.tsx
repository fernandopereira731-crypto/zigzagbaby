'use client'

import { useRef, useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PublicProduct } from '@/lib/catalog-types'
import { SizeGuideTable } from './size-guide-table'

type Tab = {
  id: string
  title: string
  content: React.ReactNode
}

function buildTabs(product: PublicProduct): Tab[] {
  return [
  {
    id: 'descricao',
    title: 'Descrição',
    content: (
      <div className="space-y-3">
        {product.description ? (
          product.description
            .split('\n')
            .filter((p) => p.trim())
            .map((paragraph, i) => <p key={i}>{paragraph}</p>)
        ) : (
          <p>
            {product.name} da Zig Zag Baby: uma peça escolhida com carinho,
            pensada para o conforto e a delicadeza dos pequenos.
          </p>
        )}
      </div>
    ),
  },
  {
    id: 'composicao',
    title: 'Composição',
    content: (
      <ul className="list-inside list-disc space-y-1">
        <li>100% algodão penteado</li>
        <li>Forro interno em meia-malha</li>
        <li>Botões antialérgicos</li>
        <li>Produto nacional</li>
      </ul>
    ),
  },
  {
    id: 'medidas',
    title: 'Medidas',
    content: (
      <div className="space-y-3">
        <p>Consulte a tabela abaixo para escolher o tamanho ideal:</p>
        <SizeGuideTable />
      </div>
    ),
  },
  {
    id: 'cuidados',
    title: 'Cuidados',
    content: (
      <ul className="list-inside list-disc space-y-1">
        <li>Lavar à mão ou na máquina em ciclo delicado</li>
        <li>Usar água fria (até 30°C)</li>
        <li>Não usar alvejante</li>
        <li>Secar à sombra</li>
        <li>Passar em temperatura média</li>
      </ul>
    ),
  },
  {
    id: 'trocas',
    title: 'Trocas',
    content: (
      <div className="space-y-3">
        <p>
          Você tem até 30 dias para trocar ou devolver o produto. A peça deve
          estar sem uso, com etiqueta e na embalagem original.
        </p>
        <p>
          Em Curvelo, a troca pode ser feita diretamente na loja. Para outras
          cidades, entre em contato pelo WhatsApp que cuidamos de tudo com
          carinho.
        </p>
      </div>
    ),
  },
  {
    id: 'avaliacoes',
    title: 'Avaliações',
    content: (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2">
            <div className="flex" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-accent text-accent"
                />
              ))}
            </div>
            <span className="text-base font-bold text-foreground">4,9</span>
          </div>
          <span className="text-sm">Conteúdo demonstrativo</span>
        </div>
        <p>
          Nossa loja está começando. Em breve, este espaço reunirá avaliações
          reais de quem comprou este produto na Zig Zag Baby.
        </p>
        <a
          href="#avaliacoes-produto-titulo"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ver todas as avaliações
        </a>
      </div>
    ),
  },
  ]
}

export function ProductDetails({ product }: { product: PublicProduct }) {
  const tabs = buildTabs(product)
  const [active, setActive] = useState(tabs[0].id)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const next = (index + dir + tabs.length) % tabs.length
    setActive(tabs[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <section aria-labelledby="detalhes-titulo" className="bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8 lg:py-16">
        <h2
          id="detalhes-titulo"
          className="mb-6 text-balance font-serif text-2xl font-semibold text-foreground sm:text-3xl"
        >
          Detalhes do produto
        </h2>

        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          {/* Tab list */}
          <div
            role="tablist"
            aria-label="Detalhes do produto"
            className="flex gap-1 overflow-x-auto border-b border-border bg-muted/40 p-1.5"
          >
            {tabs.map((tab, i) => {
              const isActive = tab.id === active
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActive(tab.id)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-background hover:text-foreground',
                  )}
                >
                  {tab.title}
                </button>
              )
            })}
          </div>

          {/* Panels */}
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              hidden={tab.id !== active}
              className={cn(
                'px-5 py-6 text-sm leading-relaxed text-muted-foreground sm:px-6',
                tab.id === active && 'zzb-animate-fade-in',
              )}
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
