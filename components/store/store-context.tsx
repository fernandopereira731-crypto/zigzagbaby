'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  addRemoteFavorite,
  mergeCart,
  mergeFavorites,
  removeRemoteFavorite,
  replaceRemoteCart,
} from './account-sync'

/**
 * Store global da loja (carrinho + favoritos).
 *
 * - Visitante: persiste no localStorage (carrinho/favoritos de visitante).
 * - Autenticado: sincroniza com o Supabase (tabelas cart_items e favorites),
 *   mesclando o que estava no localStorage ao entrar na conta, sem duplicar.
 *
 * O carrinho guarda um "snapshot" do produto (nome, preço, imagem, cor,
 * tamanho). Nada é simulado — os produtos vêm do catálogo real no Supabase.
 */

export type CartProduct = {
  id: string
  name: string
  price: number
  oldPrice?: number
  image: string
  color: string
  size: string
}

export type CartItem = {
  product: CartProduct
  quantity: number
}

type StoreContextValue = {
  cartItems: CartItem[]
  favoriteIds: string[]
  cartCount: number
  favoritesCount: number
  isFavorite: (productId: string) => boolean
  addToCart: (product: CartProduct, quantity?: number) => void
  removeFromCart: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  toggleFavorite: (productId: string) => void
  ready: boolean
}

const CART_STORAGE_KEY = 'zzb:cart:v2'
const FAVORITES_STORAGE_KEY = 'zzb:favorites'

const StoreContext = createContext<StoreContextValue | null>(null)

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  // Refs com o estado mais recente (usados dentro de callbacks/listeners).
  const cartRef = useRef<CartItem[]>([])
  const favRef = useRef<string[]>([])
  const userIdRef = useRef<string | null>(null)
  const readyRef = useRef(false)
  cartRef.current = cartItems
  favRef.current = favoriteIds
  readyRef.current = ready

  /* ---------- Carga inicial (visitante) a partir do localStorage ---------- */
  useEffect(() => {
    const storedCart = safeParse<CartItem[]>(
      localStorage.getItem(CART_STORAGE_KEY),
      [],
    ).filter((item) => item && item.product && item.product.id)
    const storedFavs = safeParse<string[]>(
      localStorage.getItem(FAVORITES_STORAGE_KEY),
      [],
    )
    setCartItems(storedCart)
    setFavoriteIds(storedFavs)
    setReady(true)
  }, [])

  /* -------------------------- Sessão + sincronização ------------------------- */
  useEffect(() => {
    const supabase = createClient()

    async function handleSignIn(uid: string) {
      if (userIdRef.current === uid) return
      try {
        const [mergedFavs, mergedCart] = await Promise.all([
          mergeFavorites(uid, favRef.current),
          mergeCart(uid, cartRef.current),
        ])
        // Limpa o carrinho de visitante para não mesclar de novo no futuro.
        localStorage.removeItem(CART_STORAGE_KEY)
        localStorage.removeItem(FAVORITES_STORAGE_KEY)
        userIdRef.current = uid
        setFavoriteIds(mergedFavs)
        setCartItems(mergedCart)
      } catch (err) {
        console.log('[v0] handleSignIn sync error:', err)
        userIdRef.current = uid
      }
    }

    function handleSignOut() {
      userIdRef.current = null
      setCartItems([])
      setFavoriteIds([])
      localStorage.removeItem(CART_STORAGE_KEY)
      localStorage.removeItem(FAVORITES_STORAGE_KEY)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) void handleSignIn(user.id)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        void handleSignIn(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        handleSignOut()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  /* ------------------------------- Persistência ------------------------------ */
  const persistCart = useCallback((next: CartItem[]) => {
    const uid = userIdRef.current
    if (uid) {
      void replaceRemoteCart(uid, next)
    } else if (readyRef.current) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next))
    }
  }, [])

  const persistFavoriteToggle = useCallback(
    (productId: string, next: string[], added: boolean) => {
      const uid = userIdRef.current
      if (uid) {
        if (added) void addRemoteFavorite(uid, productId)
        else void removeRemoteFavorite(uid, productId)
      } else if (readyRef.current) {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
      }
    },
    [],
  )

  /* --------------------------------- Ações ---------------------------------- */
  const addToCart = useCallback(
    (product: CartProduct, quantity = 1) => {
      const prev = cartRef.current
      const existing = prev.find((item) => item.product.id === product.id)
      const next = existing
        ? prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [...prev, { product, quantity }]
      setCartItems(next)
      persistCart(next)
    },
    [persistCart],
  )

  const removeFromCart = useCallback(
    (productId: string) => {
      const next = cartRef.current.filter(
        (item) => item.product.id !== productId,
      )
      setCartItems(next)
      persistCart(next)
    },
    [persistCart],
  )

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const next =
        quantity <= 0
          ? cartRef.current.filter((item) => item.product.id !== productId)
          : cartRef.current.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item,
            )
      setCartItems(next)
      persistCart(next)
    },
    [persistCart],
  )

  const toggleFavorite = useCallback(
    (productId: string) => {
      const prev = favRef.current
      const added = !prev.includes(productId)
      const next = added
        ? [...prev, productId]
        : prev.filter((id) => id !== productId)
      setFavoriteIds(next)
      persistFavoriteToggle(productId, next, added)
    },
    [persistFavoriteToggle],
  )

  const value = useMemo<StoreContextValue>(() => {
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    return {
      cartItems,
      favoriteIds,
      cartCount,
      favoritesCount: favoriteIds.length,
      isFavorite: (productId: string) => favoriteIds.includes(productId),
      addToCart,
      removeFromCart,
      setQuantity,
      toggleFavorite,
      ready,
    }
  }, [
    cartItems,
    favoriteIds,
    addToCart,
    removeFromCart,
    setQuantity,
    toggleFavorite,
    ready,
  ])

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore deve ser usado dentro de <StoreProvider>')
  }
  return context
}
