import { redirect } from 'next/navigation'

// A vitrine de produtos vive na home (#produtos). Cada produto real tem sua
// própria página em /produto/[slug]. Acessos diretos a /produto voltam à home.
export default function ProdutoIndexPage() {
  redirect('/#produtos')
}
