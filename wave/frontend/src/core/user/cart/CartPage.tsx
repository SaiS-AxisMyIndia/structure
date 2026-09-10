import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { TabScreenView } from '../../../config/components/layouts/TabScreenView';
import { userTabConfig } from '../../../config/components/bottombar/userTabConfig';
import { BottomType } from '../../../config/components/bottombar/BottomBar';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { ResponsiveView } from '../../../config/components/layouts/ResponsiveView';
import { MobileCenter, SizedCenterProps, TabletCenter, WebCenter } from '../../../config/components/layouts/Center';
import { EmptyListView } from '../../../config/components/layouts/EmptyListView';
import { ElevatedButton } from '../../../config/components/buttons/ElevatedButton';
import { AppColors } from '../../../config/theme/AppColors';
import { useCartController } from './CartController';
import { CartItem } from './CartRepo';

type CartRowProps = {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
};

function CartRow({ item, onIncrement, onDecrement, onRemove }: CartRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.rowPrice}>{`₹${item.price}`}</Text>
      </View>
      <View style={styles.quantityRow}>
        <Pressable style={styles.stepButton} onPress={onDecrement} hitSlop={8}>
          <Text style={styles.stepLabel}>−</Text>
        </Pressable>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <Pressable style={styles.stepButton} onPress={onIncrement} hitSlop={8}>
          <Text style={styles.stepLabel}>+</Text>
        </Pressable>
      </View>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Text style={styles.remove}>Remove</Text>
      </Pressable>
    </View>
  );
}

// No ScreenView here - same convention as HomePage.tsx's HomeBody (see its
// own note): BottomBarView supplies MainBar/BottomBar on mobile/tablet,
// TabScreenView's web branch supplies MainBar via ScreenView on web.
export function CartBody() {
  const controller = useCartController();
  const { loadingController, summary, onIncrement, onDecrement, onRemove, onCheckout, reload } = controller;

  const renderBody = (CenterView: (props: SizedCenterProps) => React.ReactElement) => (
    <LoadingView
      controller={loadingController}
      onRefresh={reload}
      body={
        <CenterView style={styles.container}>
          {summary.items.length === 0 ? (
            <EmptyListView title="Your cart is empty" description="Items you add will show up here." />
          ) : (
            <>
              <FlatList
                data={summary.items}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <CartRow
                    item={item}
                    onIncrement={() => onIncrement(item)}
                    onDecrement={() => onDecrement(item)}
                    onRemove={() => onRemove(item)}
                  />
                )}
              />
              <View style={styles.footer}>
                <View style={styles.subtotalRow}>
                  <Text style={styles.subtotalLabel}>Subtotal</Text>
                  <Text style={styles.subtotalValue}>{`₹${summary.subtotal}`}</Text>
                </View>
                <ElevatedButton label="Checkout" onPress={onCheckout} />
              </View>
            </>
          )}
        </CenterView>
      }
    />
  );

  function mobile() {
    return renderBody(MobileCenter);
  }

  function tablet() {
    return renderBody(TabletCenter);
  }

  function web() {
    return renderBody(WebCenter);
  }

  return <ResponsiveView mobile={mobile()} tablet={tablet()} web={web()} />;
}

export function CartPage() {
  return <TabScreenView config={userTabConfig} tab={BottomType.cart} body={<CartBody />} isHome={false} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  list: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.neutral500,
  },
  rowPrice: {
    fontSize: 13,
    color: AppColors.neutral400,
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.neutral500,
    minWidth: 16,
    textAlign: 'center',
  },
  remove: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.red,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral200,
    gap: 12,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtotalLabel: {
    fontSize: 14,
    color: AppColors.neutral400,
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
});
