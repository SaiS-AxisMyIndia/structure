export type Flavour = 'dev' | 'uat' | 'prod';

const getEnvironment = (): Flavour => ((process.env.APP_ENV?.toLowerCase() as Flavour) || 'dev');

export const Flavour = {
  value: (): Flavour => getEnvironment(),
  isDev: (): boolean => getEnvironment() === 'dev',
  isUat: (): boolean => getEnvironment() === 'uat',
  isProd: (): boolean => getEnvironment() === 'prod',
};
