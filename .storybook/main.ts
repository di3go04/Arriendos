import type { StorybookConfig } from '@storybook/nextjs';

/** Módulo 11 — Storybook config */
const config: StorybookConfig = {
  stories: ['../src/modules/design-system/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: '@storybook/nextjs',
  staticDirs: ['../public'],
};

export default config;
