import { Clock, MapPin, Truck } from 'lucide-react'

export function TopBar() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold sm:text-sm lg:justify-between lg:px-8">
        <p className="flex items-center gap-2">
          <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Comprou até às 16h?{' '}
            <span className="font-bold">Receba hoje em Curvelo.</span>
          </span>
        </p>
        <div className="hidden items-center gap-5 lg:flex">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" /> Curvelo - MG
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" /> Compre online 24
            horas por dia
          </span>
        </div>
      </div>
    </div>
  )
}
