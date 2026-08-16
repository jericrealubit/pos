export type CartLine = {
  productId: string
  barcode: string
  name: string
  size: string | null
  priceCents: number
  quantity: number
}

export type CartState = {
  lines: CartLine[]
}

export type CartAction =
  | { type: "ADD_OR_INCREMENT"; product: Omit<CartLine, "quantity">; quantity?: number }
  | { type: "SET_QUANTITY"; productId: string; quantity: number }
  | { type: "REMOVE_LINE"; productId: string }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; state: CartState }

export const emptyCart: CartState = { lines: [] }

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_OR_INCREMENT": {
      const qty = action.quantity ?? 1
      const existing = state.lines.find((l) => l.productId === action.product.productId)
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.productId === action.product.productId
              ? { ...l, quantity: l.quantity + qty }
              : l
          ),
        }
      }
      return { lines: [...state.lines, { ...action.product, quantity: qty }] }
    }
    case "SET_QUANTITY": {
      if (action.quantity <= 0) {
        return { lines: state.lines.filter((l) => l.productId !== action.productId) }
      }
      return {
        lines: state.lines.map((l) =>
          l.productId === action.productId ? { ...l, quantity: action.quantity } : l
        ),
      }
    }
    case "REMOVE_LINE":
      return { lines: state.lines.filter((l) => l.productId !== action.productId) }
    case "CLEAR":
      return emptyCart
    case "HYDRATE":
      return action.state
    default:
      return state
  }
}

export function cartTotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0)
}

export function cartItemCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0)
}
