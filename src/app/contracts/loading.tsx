import { Loader } from '@/components/ui/Loader';
import { getTranslations } from 'next-intl/server';

export default async function ContractsLoading() {
  const t = await getTranslations('loading');
  return <Loader variant="fullscreen" text={t('contracts')} />;
}
