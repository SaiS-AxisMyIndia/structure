import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TabScreenView } from '../../../config/components/layouts/TabScreenView';
import { userTabConfig } from '../../../config/components/bottombar/userTabConfig';
import { BottomType } from '../../../config/components/bottombar/BottomBar';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { ResponsiveView } from '../../../config/components/layouts/ResponsiveView';
import { MobileCenter, SizedCenterProps, TabletCenter, WebCenter } from '../../../config/components/layouts/Center';
import { ElevatedButton } from '../../../config/components/buttons/ElevatedButton';
import { AppColors } from '../../../config/theme/AppColors';
import { useSubscriptionController } from './SubscriptionController';
import { SubscriptionPlan } from './SubscriptionRepo';

function PlanCard({ plan, onPress }: { plan: SubscriptionPlan; onPress: () => void }) {
  return (
    <View style={[styles.card, plan.isCurrent && styles.cardCurrent]}>
      {plan.isCurrent && <Text style={styles.currentBadge}>Current plan</Text>}
      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.planPrice}>
        {plan.price === 0 ? 'Free' : `₹${plan.price}`}
        {plan.price > 0 && <Text style={styles.planInterval}> / {plan.interval}</Text>}
      </Text>
      <View style={styles.featureList}>
        {plan.features.map(feature => (
          <Text key={feature} style={styles.feature}>{`• ${feature}`}</Text>
        ))}
      </View>
      {!plan.isCurrent && <ElevatedButton label="Choose plan" onPress={onPress} />}
    </View>
  );
}

// No ScreenView here - on mobile/tablet this is swapped into BottomBarView
// (BODIES map), which supplies MainBar + BottomBar; on web, TabScreenView's
// own web branch supplies MainBar via ScreenView instead - same convention
// as HomePage.tsx's HomeBody.
export function SubscriptionBody() {
  const controller = useSubscriptionController();
  const { loadingController, plans, onSelectPlan, reload } = controller;

  const renderBody = (CenterView: (props: SizedCenterProps) => React.ReactElement) => (
    <LoadingView
      controller={loadingController}
      onRefresh={reload}
      body={
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <CenterView style={styles.container}>
            <Text style={styles.title}>Choose your plan</Text>
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onPress={() => onSelectPlan(plan)} />
            ))}
          </CenterView>
        </ScrollView>
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

export function SubscriptionPage() {
  return <TabScreenView config={userTabConfig} tab={BottomType.subscription} body={<SubscriptionBody />} isHome={false} />;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 24,
  },
  container: {
    paddingHorizontal: 16,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  card: {
    borderWidth: 1,
    borderColor: AppColors.neutral200,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  cardCurrent: {
    borderColor: AppColors.primary,
  },
  currentBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primary,
    textTransform: 'uppercase',
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  planInterval: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.neutral400,
  },
  featureList: {
    gap: 4,
  },
  feature: {
    fontSize: 13,
    color: AppColors.neutral400,
  },
});
