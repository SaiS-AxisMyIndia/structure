import { CartItem, CartRepo } from './CartRepo';

export type CartSummary = {
  items: CartItem[];
  subtotal: number;
};

function toSummary(items: CartItem[]): CartSummary {
  return { items, subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0) };
}

export const CartCases = {
  getCart: async (): Promise<CartSummary> => toSummary(await CartRepo.list()),
  increment: async (item: CartItem): Promise<CartSummary> => toSummary(await CartRepo.setQuantity(item.id, item.quantity + 1)),
  decrement: async (item: CartItem): Promise<CartSummary> => toSummary(await CartRepo.setQuantity(item.id, item.quantity - 1)),
  remove: async (item: CartItem): Promise<CartSummary> => toSummary(await CartRepo.remove(item.id)),
};
