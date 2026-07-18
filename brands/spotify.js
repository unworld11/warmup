// Spotify, the per-deal config. Dark theme, green accent, Jakarta stand-in for
// Circular. All content is original mood/vibe copy, no real songs or artists.

const A = 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/spotify';

export const spotify = {
  slug: 'spotify',
  name: 'Spotify',
  logo: 'spotify',

  bookingUrl: 'mailto:you@yourteam.com?subject=Re%3A%20the%20Spotify%20page%20you%20built&body=Saw%20it.%20Let%E2%80%99s%20talk.',

  // Dark-first tokens pulled from Spotify's design language.
  tokens: {
    red: '#1ED760',          // the accent slot, Spotify green
    redDark: '#1AB84C',
    gradient: 'linear-gradient(135deg, #1ED760 0%, #1DB954 100%)',
    ink: '#FFFFFF',
    muted: '#B3B3B3',
    line: '#2A2A2A',
    surface: '#181818',
    bg: '#121212',
    card: '#1C1C1C',
    navBg: 'rgba(18,18,18,0.85)',
    onAccent: '#0A1F12',       // near-black text on the green button
    ctaBg: 'linear-gradient(160deg, #0f5130 0%, #121212 62%)',
    ctaText: '#FFFFFF',
    radius: '10px',
    radiusLg: '16px',
    font: 'var(--font-jakarta), system-ui, sans-serif',
  },

  prepared: {
    eyebrow: 'A content engine, proposed for',
    note: 'We studied your Wrapped, your feeds and how your listeners talk about you. Here is one week of what we’d run.',
  },

  hero: {
    headline: 'The whole world already scores its life to you. Let’s make the whole feed do it too.',
    sub: 'Once a year your listeners turn your data into identity and post it everywhere. We manufacture that reflex every week, native content across thousands of accounts on TikTok and Reddit, in your voice.',
    ctaPrimary: 'See the week we built',
    ctaSecondary: 'Book 20 minutes',
  },

  research: {
    heading: 'What we saw when we studied you',
    lead: 'A day inside your app, your Wrapped and where your listeners actually talk about you. Three things stood out.',
    insights: [
      {
        stat: 'Wrapped',
        title: 'Your users already post for you',
        detail:
          'Once a year, millions turn your data into a personality test and flood every feed with it. That reflex, “this is so me, I have to share it”, is a content engine you switch on for one week. We run it all fifty-two.',
      },
      {
        stat: 'the sound',
        title: 'Half the feed is already scored by you',
        detail:
          'A clip from your app soundtracks an enormous share of short-form video. But the audio travels without your name on it. We make native content that puts you back on the moment people are already feeling.',
      },
      {
        stat: '“this is my personality”',
        title: 'A playlist is a personality test',
        detail:
          'Moods, eras, 2am drives, people relate to a playlist harder than to any ad. That relatability is the most saveable, most sendable content there is, and it rewards exactly the volume and range a fleet is built for.',
      },
    ],
  },

  content: {
    heading: 'What we’d make for you, week one',
    lead: 'Native slideshows and threads with Wrapped energy and mood-playlist relatability, in your voice, pushed across the fleet. Not ads. Content people repost as their own personality.',
    tiktoks: [
      {
        handle: '@nightdrive.mixes',
        avatarImg: `${A}/01-nightdrive.jpg`,
        music: 'original sound – nightdrive.mixes',
        caption: 'the 2am drive playlist everyone keeps asking me for 🌃 #playlist #latenight',
        slides: [
          { img: `${A}/01-nightdrive.jpg`, overlay: 'the 2am drive playlist everyone’s saving', sub: 'save it for the next empty highway' },
          { img: `${A}/08-roadtrip.jpg`, overlay: '#1 · for windows-down golden hour', sub: '' },
          { img: `${A}/07-lofi-room.jpg`, overlay: '#2 · for the slow reset', sub: '' },
          { img: `${A}/04-vinyl.jpg`, overlay: '#3 · for when you feel everything', sub: '' },
          { img: `${A}/03-concert.jpg`, overlay: 'which mood are you? 👇', sub: '' },
        ],
        stats: { likes: '92.4k', comments: '3,110', saves: '61.2k', shares: '18.9k' },
      },
      {
        handle: '@wrapped.szn',
        avatarImg: `${A}/05-gradient-a.jpg`,
        music: 'trending · wrapped season',
        caption: 'POV: it exposes your whole personality again and you post it anyway 💀',
        slides: [
          { img: `${A}/05-gradient-a.jpg`, overlay: 'POV: your Wrapped exposes you. again.', sub: '' },
          { img: `${A}/02-headphones.jpg`, overlay: 'top 0.5% of overthinkers, apparently', sub: '47,000 minutes' },
          { img: `${A}/06-gradient-b.jpg`, overlay: 'and you’re going to post it anyway', sub: 'every single year' },
        ],
        stats: { likes: '141.8k', comments: '5,402', saves: '88.7k', shares: '34.1k' },
      },
      {
        handle: '@rentfree.audio',
        avatarImg: `${A}/03-concert.jpg`,
        music: 'original sound – rentfree.audio',
        caption: 'songs that live rent-free (you already know the ones) 🎧',
        slides: [
          { img: `${A}/03-concert.jpg`, overlay: 'songs that live rent-free', sub: 'save before you forget them' },
          { img: `${A}/04-vinyl.jpg`, overlay: 'the one from that one summer', sub: '' },
          { img: `${A}/02-headphones.jpg`, overlay: 'the one you replay at 2am', sub: '' },
          { img: `${A}/08-roadtrip.jpg`, overlay: 'the one for the drive home', sub: 'which is yours? 📌' },
        ],
        stats: { likes: '67.3k', comments: '2,004', saves: '40.6k', shares: '12.7k' },
      },
    ],
    reddit: {
      subreddit: 'r/spotify',
      posted: '5h',
      author: 'u/onrepeat_',
      title: 'Wrapped really looked me dead in the eyes and said “let me expose your entire personality”',
      thumb: `${A}/05-gradient-a.jpg`,
      upvotes: '7.8k',
      commentCount: '512',
      body:
        'Every December without fail this app turns my listening history into a personality test I never consented to, and then I post it anyway. Genuinely the only ad I volunteer for. How is it always this accurate.',
      comments: [
        { author: 'u/lowfi_hours', up: '1.2k', text: 'being in the top 0.5% of some random niche artist is a whole personality trait now' },
        { author: 'u/onrepeat_', op: true, up: '803', text: 'already screenshotted mine and sent it to everyone in my group chat. every year. no notes.' },
        { author: 'u/aux_cord_holder', up: '344', text: 'saving this thread, wrapped season is a lifestyle' },
      ],
    },
  },

  scale: {
    heading: 'How your week actually runs',
    lead: 'No dashboard to learn, no calendar to fill. You greenlight once and the loop runs, this is the engine behind the content above.',
    steps: [
      { n: '01', title: 'We study you', detail: 'Your Wrapped, your most-shared moments, the exact way your playlists get talked about. That read sets every template, so it always sounds like your listeners, never like an ad.' },
      { n: '02', title: 'We make the week', detail: 'Native slideshows and threads like the three above, Wrapped energy, mood-playlist relatability. Made to be reposted as someone’s personality, not scrolled past.' },
      { n: '03', title: 'The fleet posts it', detail: 'Thousands of aged, warmed accounts push it across TikTok and Reddit as real fans finding a feeling. Not one brand handle, a thousand quiet “this is so me” moments.' },
      { n: '04', title: 'Saves compound', detail: 'We watch what gets saved and sent, double down on the winners, and feed them into next week. Every week gets sharper. Zero ad spend.' },
    ],
    stats: [
      { value: '1,000s', label: 'aged devices' },
      { value: '200+', label: 'native posts / week' },
      { value: '$0', label: 'ad spend' },
      { value: '48h', label: 'to first posts live' },
    ],
  },

  cta: {
    headline: 'This is one week. Wrapped is one day.',
    sub: 'Everything on this page was made for Spotify, by us, this week. If it made you want to reply, that’s the exact reflex we sell, all year.',
    button: 'Book the next 20 minutes',
  },
};
