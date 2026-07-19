import '../../../lib/env';
import { tasks } from '@trigger.dev/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Kicks off the background generate task and returns its run id to poll.
export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return Response.json({ error: 'url required' }, { status: 400 });
    const handle = await tasks.trigger('generate-deal', { url });
    return Response.json({ runId: handle.id });
  } catch (e) {
    return Response.json({ error: e.message || 'could not start generation' }, { status: 500 });
  }
}
