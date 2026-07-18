// Airbnb — the per-deal config. Everything brand-specific lives here:
// design tokens extracted from airbnb.com, the research read of their content,
// and the example content we'd ship, written to match their DNA.

export const airbnb = {
  slug: 'airbnb',
  name: 'Airbnb',
  logo: 'belo', // recreated Bélo mark, see components/logos.jsx

  // Where every "book a call" button goes. Swap for your Calendly/Cal.com link
  // per deal; a mailto is the always-works default.
  bookingUrl: 'mailto:you@yourteam.com?subject=Re%3A%20the%20Airbnb%20page%20you%20built&body=Saw%20it.%20Let%E2%80%99s%20talk.',

  // Tokens pulled off the live site (computed styles), not memory.
  tokens: {
    red: '#FF385C',       // Rausch, the primary CTA
    redDark: '#E00B41',
    gradient: 'linear-gradient(135deg, #E61E4D 0%, #E31C5F 50%, #C1185B 100%)',
    ink: '#222222',
    muted: '#717171',
    line: '#DDDDDD',
    surface: '#F7F7F7',
    bg: '#FFFFFF',
    radius: '16px',
    radiusLg: '24px',
    font: 'var(--font-manrope), system-ui, sans-serif',
  },

  prepared: {
    eyebrow: 'A content engine, proposed for',
    // small honest framing that this was made for them specifically
    note: 'We read your site, your feeds, and how you show up. Here is one week of what we’d run for you.',
  },

  hero: {
    headline: 'The most-saved stays on the internet deserve the internet’s loudest feeds.',
    sub: 'You already make people stop, screenshot and send. We take that instinct and manufacture it across thousands of native accounts on TikTok and Reddit — every week, in your voice.',
    ctaPrimary: 'See the week we built',
    ctaSecondary: 'Book 20 minutes',
    stat: { value: 'Guest favourite', label: 'is already your best hook. We just point it at the whole feed.' },
  },

  // "What we saw" — grounded in a real read of Airbnb's content and marketing.
  research: {
    heading: 'What we saw when we studied you',
    lead: 'Half a day inside your site, your owned channels and where your stays actually get talked about. Three things stood out.',
    insights: [
      {
        stat: '“Guest favourite”',
        title: 'Your funnel is a save button',
        detail:
          'Every unique stay you surface gets saved, screenshotted and dropped into a group chat. That reflex — “I have to send this” — is the entire top of your funnel. It’s repeatable, and right now you only trigger it on your own channels.',
      },
      {
        stat: '2 channels',
        title: 'You look incredible — in a handful of places',
        detail:
          'Your owned feeds nail the aspirational-but-real look. The gap is reach: the travel-inspo, budget-stay and city-specific corners of TikTok and Reddit where booking intent forms are wide open, and mostly not you.',
      },
      {
        stat: '“send me one like this”',
        title: 'Discovery moved into the feed',
        detail:
          'People shop for stays inside TikTok slideshows and Reddit threads now, not just search. Native content in those feeds is the new front door — and it rewards volume and variety, which is exactly what a device fleet is for.',
      },
    ],
  },

  // "What we'd make" — aligned to the DNA above.
  content: {
    heading: 'What we’d make for you — week one',
    lead: 'Native slideshows and threads seeded from your real “Guest favourite” listings, in your aesthetic, pushed across the fleet. Not ads. Content people actually save.',
    tiktoks: [
      {
        handle: '@stays.india',
        avatarImg: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/02-treehouse.jpg',
        music: 'original sound – stays.india',
        caption: '7 stays you have to save before they book out 🧳 #airbnb #travelindia #uniquestays',
        slides: [
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/01-aframe.jpg', overlay: 'stays in India that don’t look real', sub: 'save this before it’s booked out' },
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/02-treehouse.jpg', overlay: '#1 · the glass treehouse', sub: '₹4,200 / night · Guest favourite' },
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/03-goa-pool.jpg', overlay: '#2 · the Goa infinity villa', sub: '₹6,800 / night' },
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/04-haveli.jpg', overlay: '#3 · the blue-city haveli', sub: '₹3,100 / night' },
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/05-houseboat.jpg', overlay: '#4 · wake up on the water', sub: 'Kerala houseboat' },
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/08-cliff-villa.jpg', overlay: 'which one first? 👇', sub: '' },
        ],
        stats: { likes: '48.2k', comments: '1,204', saves: '22.4k', shares: '9,881' },
      },
      {
        handle: '@cozy.stays',
        avatarImg: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/06-interior-morning.jpg',
        music: 'trending · aesthetic morning',
        caption: 'POV: you booked the treehouse everyone’s been saving 🌲',
        slides: [
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/06-interior-morning.jpg', overlay: 'POV: you booked the stay everyone’s saving', sub: '' },
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/07-balcony-pov.jpg', overlay: 'this is the view you wake up to', sub: '₹3,000 / night' },
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/02-treehouse.jpg', overlay: 'still can’t believe it was this cheap', sub: 'Guest favourite · Superhost' },
        ],
        stats: { likes: '71.9k', comments: '2,010', saves: '39.1k', shares: '14.2k' },
      },
      {
        handle: '@weekend.escapes',
        avatarImg: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/03-goa-pool.jpg',
        music: 'original sound – weekend.escapes',
        caption: 'Airbnbs under ₹5k that feel like ₹50k 👀 which is your pick?',
        slides: [
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/04-haveli.jpg', overlay: 'Airbnbs under ₹5k that feel like ₹50k', sub: 'wait for #3' },
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/05-houseboat.jpg', overlay: 'the ₹2,900 houseboat', sub: 'Guest favourite' },
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/01-aframe.jpg', overlay: 'the ₹4,100 forest A-frame', sub: 'superhost' },
          { img: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/08-cliff-villa.jpg', overlay: 'the ₹4,800 cliff villa', sub: 'save it 📌' },
        ],
        stats: { likes: '33.7k', comments: '904', saves: '18.9k', shares: '6,402' },
      },
    ],
    reddit: {
      subreddit: 'r/IndiaTravel',
      posted: '7h',
      author: 'u/wanderwithme',
      title: 'Just realised you can rent an entire villa in Goa for less than a hostel bed in Europe',
      thumb: 'https://cdn.jsdelivr.net/gh/unworld11/warmup@main/public/content/airbnb/03-goa-pool.jpg',
      upvotes: '4.1k',
      commentCount: '318',
      body:
        'Was doom-scrolling stays for a December trip and fell into a rabbit hole of “Guest favourite” places — entire villas, treehouses, backwater houseboats. Half of them are cheaper per night than the dorm I stayed in in Lisbon. Genuinely how is this real.',
      comments: [
        { author: 'u/ghumakkad', up: '812', text: 'ok drop the link i need this for december 😭' },
        { author: 'u/wanderwithme', op: true, up: '540', text: 'it’s all on airbnb — filter “entire place” + guest favourite, sort by rating. the treehouse one is unreal' },
        { author: 'u/tripchhori', up: '203', text: 'saving this whole thread' },
      ],
    },
  },

  scale: {
    heading: 'How your week actually runs',
    lead: 'No dashboard to learn, no calendar to fill. You greenlight once and the loop runs — this is the engine behind the content above.',
    steps: [
      { n: '01', title: 'We study you', detail: 'Your listings, your best-performing posts, the exact way your stays get talked about. That read sets every template — so it always sounds like you, never like an ad.' },
      { n: '02', title: 'We make the week', detail: 'Native slideshows and threads like the three above, seeded from real “Guest favourite” stays. Made to be saved and sent, not scrolled past.' },
      { n: '03', title: 'The fleet posts it', detail: 'Thousands of aged, warmed accounts push it across TikTok and Reddit as real people finding your stays. Not one megaphone — a thousand quiet recommendations.' },
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
    sub: 'Everything on this page was made for Airbnb, by us, this week. If it made you want to reply — that’s exactly the reflex we sell.',
    button: 'Book the next 20 minutes',
  },
};
