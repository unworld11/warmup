import '../lib/env';
import { task, metadata } from '@trigger.dev/sdk';
import { extractSite, researchTikTok, researchReddit, synthesize, generateImage, generatePage } from '../lib/pipeline';
import { uploadDataUrl } from '../lib/db';

// The whole generate pipeline, off the serverless clock. Emits progress via
// metadata (phase + detail) that the studio polls, and returns the raw config
// plus an image map (imagePrompt -> Supabase storage URL).
export const generateDeal = task({
  id: 'generate-deal',
  maxDuration: 900,
  run: async (payload, { ctx }) => {
    const { url } = payload;

    metadata.set('phase', 'research');
    metadata.set('detail', 'Pulling their real TikTok and Reddit posts');
    const site = await extractSite(url);
    const [tiktok, reddit] = await Promise.all([researchTikTok(site.tiktokHandle), researchReddit(site.name)]);

    metadata.set('phase', 'study');
    metadata.set('detail', `Studying ${tiktok.length} posts with Sol`);
    const config = await synthesize({ site, tiktok, reddit });

    const prompts = [];
    (config.content?.tiktoks || []).forEach((t) => (t.slides || []).forEach((s) => s.imagePrompt && prompts.push(s.imagePrompt)));
    (config.content?.videos || []).forEach((v) => v.imagePrompt && prompts.push(v.imagePrompt));
    const unique = [...new Set(prompts)];

    metadata.set('phase', 'image');
    metadata.set('detail', `Generating ${unique.length} content images`);

    const style = config.imageStyle ? `. ${config.imageStyle}` : '';
    const imgMap = {};
    let done = 0;
    let idx = 0;
    const worker = async () => {
      while (idx < unique.length) {
        const myIdx = idx++;
        const p = unique[myIdx];
        try {
          const dataUrl = await generateImage(p + style);
          imgMap[p] = await uploadDataUrl(dataUrl, `_gen/${ctx.run.id}/${myIdx}`);
        } catch {
          imgMap[p] = '';
        }
        done += 1;
        metadata.set('detail', `Generated ${done}/${unique.length} images`);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker(), worker()]);

    metadata.set('phase', 'page');
    metadata.set('detail', `Designing the page in ${site.name}'s style`);
    let html = '';
    let htmlError = '';
    try {
      html = await generatePage(site, config, imgMap);
    } catch (e) {
      htmlError = e.message || 'page generation failed';
    }

    metadata.set('phase', 'done');
    return { site, config, imgMap, html, htmlError };
  },
});
