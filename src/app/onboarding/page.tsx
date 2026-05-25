import { requireSession } from '@/lib/auth';
import { OnboardingFlow } from '@/components/OnboardingFlow';

export default async function OnboardingPage() {
  await requireSession();
  return <OnboardingFlow />;
}
