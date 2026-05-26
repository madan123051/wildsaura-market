export const dynamic = 'force-dynamic';

import { CommunityPage } from '@/components/community/CommunityPage';

export const metadata = {
  title: 'Community | WildSaura Market',
  description: 'Join the WildSaura Community — share wildlife & nature photography with fellow enthusiasts.',
};

export default function CommunityRoute() {
  return <CommunityPage />;
}
