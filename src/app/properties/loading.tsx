import { Loader } from '@/components/ui/Loader';
import { getTranslations } from 'next-intl/server';

export default async function PropertiesLoading() {
  const t = await getTranslations('loading');
  return <Loader variant="fullscreen" text={t('properties')} />;
}
