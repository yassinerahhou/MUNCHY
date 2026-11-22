import Munchy from '@/components/editorial-home';
import GoogleReviews from '@/components/google-reviews';
import { readSiteContent } from '@/lib/site-content';
import { getBusinessStatus } from '@/lib/business-hours';

export default async function Home() {
  const { content } = await readSiteContent();
  return <Munchy initialStatus={getBusinessStatus(content.contact.hours, content.contact.deliveryMinutes)} reviews={<GoogleReviews />} />;
}
