import { TopBar } from '@/components/store/top-bar'
import { SiteHeader } from '@/components/store/site-header'
import { Hero } from '@/components/store/hero'
import { AgeFilter } from '@/components/store/age-filter'
import { Features } from '@/components/store/features'
import { Categories } from '@/components/store/categories'
import { FeaturedProducts } from '@/components/store/featured-products'
import { CareSection } from '@/components/store/care-section'
import { Reviews } from '@/components/store/reviews'
import { TrustBand } from '@/components/store/trust-band'
import { SiteFooter } from '@/components/store/site-footer'

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <AgeFilter />
        <Features />
        <Categories />
        <FeaturedProducts />
        <CareSection />
        <Reviews />
        <TrustBand />
      </main>
      <SiteFooter />
    </div>
  )
}
