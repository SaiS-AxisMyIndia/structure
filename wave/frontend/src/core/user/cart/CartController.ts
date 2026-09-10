import { useEffect, useState } from 'react';
import Toast from 'react-native-simple-toast';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';
import { CartCases, CartSummary } from './CartCases';
import { CartItem } from './CartRepo';

const EMPTY_SUMMARY: CartSummary = { items: [], subtotal: 0 };

export function useCartController() {
  const loadingController = useLoadingController();
  const [summary, setSummary] = useState<CartSummary>(EMPTY_SUMMARY);

  const load = async () => {
    loadingController.setLoading(true);
    try {
      setSummary(await CartCases.getCart());
    } catch (err) {
      loadingController.setError((err as Error).message);
    } finally {
      loadingController.setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // load is a fresh function every render - depending on it here would
    // re-run this on every render instead of just once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onIncrement = async (item: CartItem) => setSummary(await CartCases.increment(item));
  const onDecrement = async (item: CartItem) => setSummary(await CartCases.decrement(item));
  const onRemove = async (item: CartItem) => setSummary(await CartCases.remove(item));

  // No payment endpoint exists yet (see backend's RazorpayService stub) -
  // this is the eventual call site for creating an order against
  // `summary`.
  const onCheckout = () => {
    if (summary.items.length === 0) {return;}
    Toast.show('Checkout - coming soon', Toast.SHORT);
  };

  return {
    loadingController,
    summary,
    onIncrement,
    onDecrement,
    onRemove,
    onCheckout,
    reload: load,
  };
}
