// MY STUDIO — Documentary Engine Page

import { ComingSoon } from '@/components/ui/ComingSoon';

export function DocumentaryPage() {
  return (
    <ComingSoon
      module="Documentary Engine"
      description="Auto-generate documentaries from sources using Whisper, NLLB-200, HunyuanVideo, and FFmpeg."
    />
  );
}

export { DocumentaryPage as default };
