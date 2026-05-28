import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { ShareTargetCapture } from '@/components/ShareTargetCapture';

// Android Web Share Target: text from another app lands here.
// We let the user pick a person and save it as a note.
export default async function SharePage({ searchParams }: { searchParams: Promise<{ title?: string; text?: string; url?: string }> }) {
  await requireSession();
  const sp = await searchParams;
  const body = [sp.title, sp.text, sp.url].filter(Boolean).join('\n').trim();
  return (
    <>
      <TopNav title="Share into KIT" back="/" />
      <main className="max-w-md mx-auto px-4 pad-nav pt-4">
        <ShareTargetCapture initialText={body} />
      </main>
    </>
  );
}
