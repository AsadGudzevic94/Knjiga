# QuoteCheck - Is This Price Fair?

Instantly analyze any service quote to see if you're being overcharged. Car repairs, plumbing, dental work, home renovations and more.

## Features

- **Fairness Score (1-10)** - Color-coded verdict on your quote
- **Line-by-Line Analysis** - Each item checked against fair market prices
- **Fair Price Range** - Regional pricing based on zip code
- **Negotiation Scripts** - Copy-paste scripts to negotiate your price down
- **Red Flag Detection** - Spots overcharges, missing itemization, emergency markups

## Tech Stack

- **Next.js 16** + TypeScript
- **Tailwind CSS** for styling
- **Stripe** for payments (Pro plan)
- **Supabase** for auth (ready to connect)

## Getting Started

```bash
cd quotecheck
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, pricing |
| `/analyze` | Main quote analysis tool |
| `/pricing` | Detailed pricing with FAQ |
| `/login` | Sign in page |
| `/signup` | Create account page |
| `/api/analyze` | Quote analysis API endpoint |
| `/api/checkout` | Stripe checkout API endpoint |

## Monetization

- **Free tier**: 3 quote checks/month
- **Pro ($9.99/mo)**: Unlimited checks, custom scripts, history
- **Pro Annual ($7.99/mo)**: 20% discount, billed annually

## Going to Production

1. Set up Stripe account and add price IDs
2. Set up Supabase project for auth + database
3. Add environment variables to `.env.local`
4. Deploy to Vercel: `npx vercel`
