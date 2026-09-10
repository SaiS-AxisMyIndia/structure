export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    interval: 'month' as const,
    features: ['Access to free content', 'Standard support'],
    isCurrent: true,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 199,
    interval: 'month' as const,
    features: ['Everything in Basic', 'No ads', 'Priority support'],
    isCurrent: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1999,
    interval: 'year' as const,
    features: ['Everything in Plus', 'Early access to new features', 'Dedicated account manager'],
    isCurrent: false,
  },
];
