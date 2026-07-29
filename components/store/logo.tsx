import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center', className)}>
      <Image
        src="/images/logo.png"
        alt="Zig Zag Baby - Carinho em cada detalhe"
        width={741}
        height={672}
        priority
        className="h-[68px] w-auto transition-transform duration-300 ease-out group-hover:scale-105 md:h-[84px]"
      />
      <span className="sr-only">Zig Zag Baby - Carinho em cada detalhe</span>
    </span>
  )
}
