// MY STUDIO — modal.ts
// PURPOSE: Client-side helpers for triggering Modal GPU generation and polling job status

interface GenerationResponse {
  jobId: string;
}

interface JobStatus {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  step: string;
  progress: number;
  outputUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Triggers a generation job by POSTing to the internal API route.
 * The API route forwards the request to Modal with proper auth.
 */
export async function triggerGeneration(
  module: string,
  data: Record<string, unknown>,
): Promise<GenerationResponse> {
  const response = await fetch(`/api/generate/${module}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Generation request failed' }));
    throw new Error((error as { message: string }).message || 'Generation request failed');
  }

  return response.json() as Promise<GenerationResponse>;
}

/**
 * Polls the status of a generation job.
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`/api/status/${jobId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch job status' }));
    throw new Error((error as { message: string }).message || 'Failed to fetch job status');
  }

  return response.json() as Promise<JobStatus>;
}

/**
 * Starts polling a job status at a given interval. Calls onUpdate for each poll,
 * and stops when the job is complete or failed.
 */
export function pollJobStatus(
  jobId: string,
  onUpdate: (status: JobStatus) => void,
  intervalMs: number = 3000,
): { stop: () => void } {
  let active = true;

  const poll = async () => {
    while (active) {
      try {
        const status = await getJobStatus(jobId);
        onUpdate(status);

        if (status.status === 'complete' || status.status === 'failed') {
          active = false;
          return;
        }
      } catch {
        // Silently retry on network errors
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  };

  poll();

  return {
    stop() {
      active = false;
    },
  };
}
