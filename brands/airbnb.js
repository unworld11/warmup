// Airbnb — the per-deal config. Design tokens were extracted from airbnb.com.
// The research, content and Reddit angle are built from a real pull of their last
// 25 TikTok posts + the Reddit threads written about them. Copy is original,
// modeled on their DNA — never lifted verbatim.

const A = 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb';

export const airbnb = {
  slug: 'airbnb',
  name: 'Airbnb',
  logo: 'belo',

  bookingUrl: 'mailto:you@yourteam.com?subject=Re%3A%20the%20Airbnb%20page%20you%20built&body=Saw%20it.%20Let%E2%80%99s%20talk.',

  // Tokens pulled off the live site (computed styles), not memory.
  tokens: {
    red: '#FF385C',
    redDark: '#E00B41',
    gradient: 'linear-gradient(135deg, #E61E4D 0%, #E31C5F 50%, #C1185B 100%)',
    ink: '#222222',
    muted: '#717171',
    line: '#DDDDDD',
    surface: '#F7F7F7',
    bg: '#FFFFFF',
    card: '#FFFFFF',
    navBg: 'rgba(255,255,255,0.92)',
    onAccent: '#FFFFFF',
    ctaBg: 'linear-gradient(135deg, #E61E4D 0%, #E31C5F 50%, #C1185B 100%)',
    ctaText: '#FFFFFF',
    radius: '16px',
    radiusLg: '24px',
    font: 'var(--font-manrope), system-ui, sans-serif',
  },

  prepared: {
    eyebrow: 'A content engine, proposed for',
    note: 'We pulled your last 25 posts and the Reddit threads people are actually writing about you. Here’s one week of what we’d run, built on what we found.',
  },

  hero: {
    headline: 'You make the best travel content on the internet. Almost nobody sees most of it.',
    sub: 'Your culture posts hit millions; the rest of the feed gets follower-tier reach — and the loudest conversations about you are happening on Reddit without you. We take what already works and manufacture its reach, across thousands of native accounts, every week, in your voice.',
    ctaPrimary: 'See the week we built',
    ctaSecondary: 'Book 20 minutes',
  },

  // "What we saw" — grounded in the real pull, not guesses.
  research: {
    heading: 'What we saw when we studied your feed',
    lead: 'We read your last 25 posts and the Reddit threads written about you this month. Three things jumped out.',
    insights: [
      {
        stat: '7.7M vs 2K',
        title: 'Your culture posts fly. Your campaign posts don’t.',
        detail:
          'The culturally-rooted ones — a love letter to a host nation, a creator breaking his foot for the bit — cleared millions of views. Most of the feed, the ticket drops and bracket updates, sits at two to four thousand. You’re making culture-tier creative and getting follower-tier reach on the bulk of it. The fix isn’t better content — it’s volume and distribution of what already works.',
      },
      {
        stat: 'r/airbnb',
        title: 'Your loudest conversations are happening without you',
        detail:
          'The top Airbnb threads on Reddit right now: “greed is ruining the lake,” a $10,000 cancelled booking, the fallout from New York’s ban. Real intent, real sentiment, thousands of readers — and the brand isn’t in the room. That’s a narrative you can enter natively, at scale, with the authentic host and guest stories you already have.',
      },
      {
        stat: '3 creators',
        title: 'You lean on a few big names; the corners are open',
        detail:
          'The creator series and partners are great, but the reach is centralised. The travel-tok, host-story and city-guide corners — where someone actually decides which city to fly to and where to stay — are wide open, and mostly not you.',
      },
    ],
  },

  // "What we'd make" — modeled on their real DNA (host-city travel, Experiences,
  // "hosts who feel like family", creator-POV city culture).
  content: {
    heading: 'What we’d make for you — week one',
    lead: 'Modeled on your last 25 posts, in your voice, not a brand-ad voice. Native slideshows and threads built to travel the way your best posts already do.',
    tiktoks: [
      {
        handle: '@matchday.cities',
        avatarImg: `${A}/host-city.jpg`,
        music: 'original sound – matchday.cities',
        caption: 'how to do a host city like you actually live there 🌍 #worldcup #travel #hostcity',
        slides: [
          { img: `${A}/host-city.jpg`, overlay: 'do a host city like you live there', sub: 'save this before you fly out' },
          { img: `${A}/watch-party.jpg`, overlay: 'the outdoor watch parties locals actually go to', sub: '' },
          { img: `${A}/food-local.jpg`, overlay: 'eat where the neighbourhood eats', sub: 'skip the tourist strip' },
          { img: `${A}/creator-pov.jpg`, overlay: 'get pleasantly lost in the good streets', sub: '' },
          { img: `${A}/wc-fans.jpg`, overlay: 'which city are you flying to? 👇', sub: '' },
        ],
        stats: { likes: '58.1k', comments: '1,806', saves: '31.4k', shares: '12.2k' },
      },
      {
        handle: '@stayswithsoul',
        avatarImg: `${A}/host-welcome.jpg`,
        music: 'trending · belong anywhere',
        caption: 'POV: you booked a room and left with a family 🫶',
        slides: [
          { img: `${A}/host-welcome.jpg`, overlay: 'POV: your host basically adopts you for the week', sub: '' },
          { img: `${A}/food-local.jpg`, overlay: 'they set a place for you at the table', sub: '' },
          { img: `${A}/keys-welcome.jpg`, overlay: 'you came for a bed, you left with a home', sub: 'belong anywhere' },
        ],
        stats: { likes: '96.7k', comments: '2,540', saves: '44.8k', shares: '19.3k' },
      },
      {
        handle: '@localsonly.pov',
        avatarImg: `${A}/creator-pov.jpg`,
        music: 'original sound – localsonly.pov',
        caption: 'let a local show you the city tourists never find 🛵',
        slides: [
          { img: `${A}/creator-pov.jpg`, overlay: 'the city tourists never actually see', sub: 'let a local drive' },
          { img: `${A}/stadium-pov.jpg`, overlay: 'the pre-match walk hits different with someone who lives here', sub: '' },
          { img: `${A}/wc-fans.jpg`, overlay: 'this is what “belong anywhere” actually looks like', sub: '' },
          { img: `${A}/watch-party.jpg`, overlay: 'save it for your trip 📌', sub: '' },
        ],
        stats: { likes: '40.3k', comments: '1,120', saves: '22.6k', shares: '8,410' },
      },
    ],
    // Enters the REAL (mostly critical) Reddit conversation with an authentic,
    // credible positive story — the narrative gap from insight #2.
    reddit: {
      subreddit: 'r/travel',
      posted: '9h',
      author: 'u/awaydays_',
      title: 'Booked a place for the tournament expecting tourist-trap chaos. My host basically adopted us for the week.',
      thumb: `${A}/host-welcome.jpg`,
      upvotes: '3.4k',
      commentCount: '227',
      body:
        'Went in bracing for the horror stories you read on here. Instead the host left a hand-written list of where locals actually watch the matches, walked us to a family-run spot two streets over on the first night, and texted to check we’d sorted tickets. Genuinely one of the best trips I’ve had.',
      comments: [
        { author: 'u/lakesideskeptic', up: '512', text: 'after the threads on here lately i genuinely did not expect to read this. glad it still exists.' },
        { author: 'u/awaydays_', op: true, up: '388', text: 'i know. i almost booked a hotel out of fear. the good hosts really are the whole thing.' },
        { author: 'u/onematchday', up: '164', text: 'saving this, flying out for the quarters and needed to hear it' },
      ],
    },
  },

  scale: {
    heading: 'How your week actually runs',
    lead: 'No dashboard to learn, no calendar to fill. You greenlight once and the loop runs — this is the engine behind the content above.',
    steps: [
      { n: '01', title: 'We study you', detail: 'We pull your last 25 posts and the threads people write about you, and read what actually travels versus what falls flat. That read sets every template — so it sounds like your best work, never like an ad.' },
      { n: '02', title: 'We make the week', detail: 'Native slideshows and threads like the three above, modeled on what already resonates for you. Made to be saved and sent, not scrolled past.' },
      { n: '03', title: 'The fleet posts it', detail: 'Thousands of aged, warmed accounts push it across TikTok and Reddit as real people finding your stays and experiences. Not one megaphone — a thousand quiet recommendations, including in the threads you’re currently absent from.' },
      { n: '04', title: 'Saves compound', detail: 'We watch what gets saved and sent, double down on the winners, and feed them into next week. Every week gets sharper. Zero ad spend.' },
    ],
    stats: [
      { value: '1,000s', label: 'aged devices' },
      { value: '200+', label: 'native posts / week' },
      { value: '₹0', label: 'ad spend' },
      { value: '48h', label: 'to first posts live' },
    ],
  },

  cta: {
    headline: 'This is one week. Imagine fifty-two.',
    sub: 'Everything on this page was built from your real posts and the real conversations about you, this week. If it made you want to reply — that’s exactly the reflex we sell.',
    button: 'Book the next 20 minutes',
  },
};
