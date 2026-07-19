import '../lib/env';
import { task, metadata } from '@trigger.dev/sdk';
import { extractSite, researchTikTok, researchReddit, synthesize, generateImage, generatePage, slideImagePrompt, analyzeReferences } from '../lib/pipeline';
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
    metadata.set('detail', `Looking at ${tiktok.length} of their real posts`);
    const visualBrief = await analyzeReferences(tiktok);
    metadata.set('detail', `Studying their content with Sol`);
    const config = await synthesize({ site, tiktok, reddit, visualBrief });

    // Slideshow slides bake the hook text into the image as a TikTok sticker, so
    // they render at high quality for legible text; video thumbs are plain scenes.
    const style = config.imageStyle ? `. ${config.imageStyle}` : '';
    const jobs = [];
    (config.content?.tiktoks || []).forEach((t) => (t.slides || []).forEach((s) => {
      if (s.imagePrompt) jobs.push({ prompt: slideImagePrompt(s, config), quality: 'high' });
    }));
    (config.content?.videos || []).forEach((v) => {
      if (v.imagePrompt) jobs.push({ prompt: v.imagePrompt + style, quality: 'medium' });
    });
    const seen = new Set();
    const unique = jobs.filter((j) => !seen.has(j.prompt) && seen.add(j.prompt));

    metadata.set('phase', 'image');
    metadata.set('detail', `Generating ${unique.length} content images`);

    const imgMap = {};
    let done = 0;
    let idx = 0;
    const worker = async () => {
      while (idx < unique.length) {
        const myIdx = idx++;
        const { prompt, quality } = unique[myIdx];
        try {
          const dataUrl = await generateImage(prompt, quality);
          imgMap[prompt] = await uploadDataUrl(dataUrl, `_gen/${ctx.run.id}/${myIdx}`);
        } catch {
          imgMap[prompt] = '';
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
