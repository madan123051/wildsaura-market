export const dynamic = 'force-dynamic';

import { CommunityPage } from '@/components/community/CommunityPage';

export const metadata = {
  title: 'WildSaura Community | Market',
  description: 'Join the WildSaura Community — share wildlife & nature photography with fellow enthusiasts.',
  openGraph: {
    title: 'WildSaura Community 🌿',
    description: 'Share wildlife & nature photography with fellow enthusiasts.',
    url: 'https://market.wildsaura.com/community',
    siteName: 'WildSaura Community',
    type: 'website',
  },
};

export default function CommunityRoute() {
  return <CommunityPage />;
}
