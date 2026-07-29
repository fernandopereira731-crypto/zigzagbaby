'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Printer, X } from 'lucide-react'
import { formatBRL } from '@/lib/format'
import {
  getStoreSettings,
  EMPTY_STORE_SETTINGS,
  type StoreSettings,
} from '../store-settings-service'
import type { AdminOrderRow } from '../orders-service'
import {
  paymentMethodLabel,
  deliveryMethodLabel,
  formatOrderDate,
} from '../orders-service'

type ReceiptFormat = 'a4' | 'thermal'

/** Monta a linha de endereço completo do cliente a partir do pedido. */
function buildCustomerAddress(order: AdminOrderRow): string[] {
  const a = order.address
  if (!a) return []
  const line1 = [a.street, a.number].filter(Boolean).join(', ')
  const line2 = [a.complement].filter(Boolean).join('')
  const line3 = [a.district].filter(Boolean).join('')
  const line4 = [a.city, a.state].filter(Boolean).join(' - ')
  const line5 = a.cep ? `CEP ${a.cep}` : ''
  return [line1, line2, line3, line4, line5].filter((l) => l && l.length > 0)
}

/** Data limite para troca = data do pedido + prazo (dias). */
function exchangeDeadline(createdAt: string, days: number): string {
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return '—'
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function OrderReceiptModal({
  order,
  onClose,
}: {
  order: AdminOrderRow
  onClose: () => void
}) {
  const [store, setStore] = useState<StoreSettings>(EMPTY_STORE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [format, setFormat] = useState<ReceiptFormat>('a4')
  const [mounted, setMounted] = useState(false)

  // Só renderizamos o portal no cliente (evita erro de SSR).
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getStoreSettings()
        if (active) setStore(data)
      } catch {
        // Mantém os valores padrão se não conseguir carregar.
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  // Garante que a impressão só dispare depois que a logo terminar de carregar,
  // para que a imagem apareça na pré-visualização de impressão / PDF.
  const handlePrint = () => {
    const img = document.querySelector<HTMLImageElement>(
      '#receipt-print-area img.receipt-logo',
    )
    if (img && !img.complete) {
      const go = () => window.print()
      img.addEventListener('load', go, { once: true })
      img.addEventListener('error', go, { once: true })
      return
    }
    // Aguarda um frame para o layout do formato atual estar aplicado.
    requestAnimationFrame(() => window.print())
  }

  const customerAddress = buildCustomerAddress(order)
  const deadline = exchangeDeadline(order.createdAt, store.exchangeDays)

  if (!mounted) return null

  return createPortal(
    <div
      id="receipt-modal-root"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      {/*
        Estilos de impressão.
        Estratégia: manter o comprovante no FLUXO NORMAL (sem position:absolute
        nem visibility:hidden nos pais), ocultar somente o restante da página com
        display:none e neutralizar as restrições de altura/overflow dos
        contêineres do modal. Assim o comprovante inteiro imprime e pagina em
        múltiplas folhas quando necessário.
      */}
      <style>{`
        .receipt-logo {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @media print {
          html, body {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: #fff !important;
          }
          /* Oculta tudo que não faz parte do modal do comprovante. */
          body > *:not(#receipt-modal-root) { display: none !important; }

          /* Neutraliza o wrapper fixo do modal. */
          #receipt-modal-root {
            position: static !important;
            display: block !important;
            inset: auto !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: #fff !important;
            z-index: auto !important;
          }
          /* Cartão e área de rolagem: sem altura/overflow limitados. */
          #receipt-modal-root .receipt-shell,
          #receipt-modal-root .receipt-scroll {
            position: static !important;
            display: block !important;
            width: auto !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          /* Elementos que não devem ser impressos (backdrop e barra de ações). */
          #receipt-modal-root .no-print { display: none !important; }

          /* O comprovante permanece no fluxo normal para paginar. */
          #receipt-print-area {
            position: static !important;
            width: auto !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 auto !important;
            box-shadow: none !important;
          }
          /* Evita quebrar blocos pequenos no meio, sem impedir a paginação. */
          #receipt-print-area header,
          #receipt-print-area section,
          #receipt-print-area tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .receipt-logo {
            display: block !important;
            height: auto !important;
            object-fit: contain !important;
          }
        }
        ${
          format === 'thermal'
            ? '@media print { @page { size: 80mm auto; margin: 3mm; } #receipt-print-area { padding: 0 !important; } .receipt-logo { width: 90px !important; } }'
            : '@media print { @page { size: A4; margin: 12mm; } #receipt-print-area { padding: 0 !important; } .receipt-logo { width: 140px !important; } }'
        }
      `}</style>

      <button
        type="button"
        aria-label="Fechar"
        className="no-print absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="receipt-shell relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl sm:rounded-3xl">
        {/* Barra de ações (não imprime) */}
        <div className="no-print flex items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-border p-1">
              <button
                type="button"
                onClick={() => setFormat('a4')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  format === 'a4'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => setFormat('thermal')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  format === 'thermal'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Térmica 80mm
              </button>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Área de pré-visualização com rolagem */}
        <div className="receipt-scroll overflow-y-auto bg-muted/40 p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-sm">Carregando comprovante...</span>
            </div>
          ) : (
            <div
              id="receipt-print-area"
              className={`mx-auto bg-white text-black ${
                format === 'thermal'
                  ? 'w-[80mm] px-3 py-4 font-mono text-[11px] leading-snug'
                  : 'w-full max-w-[210mm] p-8 text-sm'
              }`}
            >
              <Receipt
                order={order}
                store={store}
                format={format}
                customerAddress={customerAddress}
                deadline={deadline}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Receipt({
  order,
  store,
  format,
  customerAddress,
  deadline,
}: {
  order: AdminOrderRow
  store: StoreSettings
  format: ReceiptFormat
  customerAddress: string[]
  deadline: string
}) {
  const thermal = format === 'thermal'
  const divider = thermal ? (
    <div className="my-2 border-t border-dashed border-black/40" />
  ) : (
    <div className="my-4 border-t border-black/15" />
  )

  return (
    <div>
      {/* Cabeçalho / dados da loja */}
      <header className="text-center">
        {/* Logo oficial da loja. Usamos <img> nativo (não next/image) para
            garantir carregamento direto do caminho público e impressão
            confiável pelo navegador, sem otimizador nem checagem de CORS. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.logoUrl || '/images/logo.png'}
          alt={store.storeName}
          className={`receipt-logo mx-auto h-auto object-contain ${
            thermal ? 'w-[90px]' : 'w-[140px]'
          }`}
        />
        <div
          className={`mt-2 ${thermal ? 'text-[10px]' : 'text-xs text-black/70'}`}
        >
          {store.cnpj && <p>CNPJ: {store.cnpj}</p>}
          {store.address && <p>{store.address}</p>}
          {(store.city || store.state) && (
            <p>{[store.city, store.state].filter(Boolean).join(' - ')}</p>
          )}
          {store.phone && <p>Tel/WhatsApp: {store.phone}</p>}
          {store.whatsapp && store.whatsapp !== store.phone && (
            <p>WhatsApp: {store.whatsapp}</p>
          )}
          {store.instagram && <p>Instagram: {store.instagram}</p>}
        </div>
      </header>

      {divider}

      {/* Título do documento */}
      <div className="text-center">
        <h2 className={`font-bold ${thermal ? 'text-xs' : 'text-base'}`}>
          COMPROVANTE DE PEDIDO
        </h2>
        <p className={thermal ? 'text-[10px]' : 'text-xs text-black/70'}>
          {order.orderNumber} · {formatOrderDate(order.createdAt)}
        </p>
      </div>

      {divider}

      {/* Dados do cliente */}
      <section>
        <h3
          className={`font-bold ${thermal ? 'text-[11px]' : 'mb-1 text-sm'}`}
        >
          Cliente
        </h3>
        <p className={thermal ? 'text-[10px]' : 'text-xs'}>{order.customer}</p>
        {order.phone && (
          <p className={thermal ? 'text-[10px]' : 'text-xs'}>
            Tel: {order.phone}
          </p>
        )}
        {customerAddress.length > 0 ? (
          customerAddress.map((line, i) => (
            <p key={i} className={thermal ? 'text-[10px]' : 'text-xs'}>
              {line}
            </p>
          ))
        ) : (
          <p className={thermal ? 'text-[10px]' : 'text-xs'}>{order.city}</p>
        )}
      </section>

      {divider}

      {/* Itens do pedido */}
      <section>
        <h3
          className={`font-bold ${thermal ? 'text-[11px]' : 'mb-2 text-sm'}`}
        >
          Itens
        </h3>

        {thermal ? (
          <ul className="space-y-1">
            {order.items.map((item) => (
              <li key={item.id}>
                <p className="text-[10px] font-semibold">{item.productName}</p>
                <div className="flex justify-between text-[10px]">
                  <span>
                    {[
                      item.color,
                      item.size ? `Tam ${item.size}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}{' '}
                    {item.quantity} x {formatBRL(item.unitPrice)}
                  </span>
                  <span>{formatBRL(item.unitPrice * item.quantity)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/20 text-left">
                <th className="py-1 font-semibold">Produto</th>
                <th className="py-1 text-center font-semibold">Qtd</th>
                <th className="py-1 text-right font-semibold">Unit.</th>
                <th className="py-1 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-black/10 align-top">
                  <td className="py-1.5">
                    <span className="font-medium">{item.productName}</span>
                    {(item.color || item.size) && (
                      <span className="block text-[11px] text-black/60">
                        {[
                          item.color,
                          item.size ? `Tam ${item.size}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right">
                    {formatBRL(item.unitPrice)}
                  </td>
                  <td className="py-1.5 text-right">
                    {formatBRL(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {divider}

      {/* Totais */}
      <section className={thermal ? 'text-[10px]' : 'text-xs'}>
        <TotalRow label="Subtotal" value={formatBRL(order.subtotal)} thermal={thermal} />
        {order.giftWrap && (
          <TotalRow
            label="Embrulho presente"
            value={formatBRL(order.giftFee)}
            thermal={thermal}
          />
        )}
        {order.discount > 0 && (
          <TotalRow
            label="Desconto"
            value={`- ${formatBRL(order.discount)}`}
            thermal={thermal}
          />
        )}
        <TotalRow
          label="Frete"
          value={order.shipping === 0 ? 'Grátis' : formatBRL(order.shipping)}
          thermal={thermal}
        />
        <div className={thermal ? 'mt-1 border-t border-dashed border-black/40 pt-1' : 'mt-2 border-t border-black/20 pt-2'}>
          <div className="flex justify-between font-bold">
            <span className={thermal ? 'text-xs' : 'text-sm'}>TOTAL</span>
            <span className={thermal ? 'text-xs' : 'text-sm'}>
              {formatBRL(order.total)}
            </span>
          </div>
        </div>
        <div className="mt-1">
          <TotalRow
            label="Pagamento"
            value={paymentMethodLabel(order.paymentMethod)}
            thermal={thermal}
          />
          <TotalRow
            label="Entrega"
            value={deliveryMethodLabel(order.deliveryMethod)}
            thermal={thermal}
          />
        </div>
      </section>

      {order.notes && (
        <>
          {divider}
          <section>
            <h3 className={`font-bold ${thermal ? 'text-[11px]' : 'mb-1 text-sm'}`}>
              Observações
            </h3>
            <p className={thermal ? 'text-[10px]' : 'text-xs'}>{order.notes}</p>
          </section>
        </>
      )}

      {divider}

      {/* Política de troca */}
      <section>
        <h3 className={`font-bold ${thermal ? 'text-[11px]' : 'mb-1 text-sm'}`}>
          Trocas
        </h3>
        <p className={thermal ? 'text-[10px]' : 'text-xs'}>
          Prazo para troca: {store.exchangeDays} dias
        </p>
        <p className={`font-semibold ${thermal ? 'text-[10px]' : 'text-xs'}`}>
          Data limite: {deadline}
        </p>
        {store.exchangePolicy && (
          <p className={`mt-1 ${thermal ? 'text-[9px] leading-tight' : 'text-[11px] text-black/70'}`}>
            {store.exchangePolicy}
          </p>
        )}
      </section>

      {divider}

      <p
        className={`text-center font-medium ${
          thermal ? 'text-[10px] leading-tight' : 'text-xs text-black/70'
        }`}
      >
        {'Obrigado pela preferência! ❤️ Esperamos você novamente.'}
      </p>
    </div>
  )
}

function TotalRow({
  label,
  value,
  thermal,
}: {
  label: string
  value: string
  thermal: boolean
}) {
  return (
    <div className="flex justify-between">
      <span className={thermal ? '' : 'text-black/70'}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
