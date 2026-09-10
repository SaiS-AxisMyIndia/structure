import { CART_ITEMS } from '../../../mock_data/CartMockData';

export type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

// In-memory only - no backend endpoint exists yet, so this doesn't persist
// across an app restart either. Module-level state (not inside the object
// below) so every caller shares the one cart, same convention AStorage
// uses for the stored-user cache.
let items: CartItem[] = CART_ITEMS.map(item => ({ ...item }));

export const CartRepo = {
  // TODO: swap for a real endpoint once one exists - see the backend's
  // RazorpayService stub (backend/src/config/razorpay/), the eventual
  // source of the order this screen would create against `items`.
  list: (): Promise<CartItem[]> => Promise.resolve(items),

  // quantity <= 0 removes the item outright rather than leaving a
  // zero-quantity row behind.
  setQuantity: (id: string, quantity: number): Promise<CartItem[]> => {
    items =
      quantity <= 0
        ? items.filter(item => item.id !== id)
        : items.map(item => (item.id === id ? { ...item, quantity } : item));
    return Promise.resolve(items);
  },

  remove: (id: string): Promise<CartItem[]> => {
    items = items.filter(item => item.id !== id);
    return Promise.resolve(items);
  },
};
