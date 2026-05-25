import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { ImportFlow } from '@/components/ImportFlow';

export default async function ImportPage() {
  await requireSession();
  return (
    <>
      <TopNav title="Import contacts" back="/settings" />
      <main className="max-w-md mx-auto px-4 pb-24 pt-2">
        <ImportFlow />
      </main>
    </>
  );
}
