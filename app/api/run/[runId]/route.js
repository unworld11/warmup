import '../../../../lib/env';
import { runs } from '@trigger.dev/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Polled by the studio: current status, progress metadata, and (when done) output.
export async function GET(_req, { params }) {
  try {
    const run = await runs.retrieve(params.runId);
    const err = run.error ? (run.error.message || run.error.name || String(run.error)) : null;
    return Response.json({
      status: run.status,
      metadata: run.metadata || {},
      output: run.output || null,
      error: err,
    });
  } catch (e) {
    return Response.json({ error: e.message || 'could not read run' }, { status: 500 });
  }
}
