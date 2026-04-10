# myp3-study

A redesigned MYP 3 study dashboard built with React and Vite. The app now focuses on a cleaner, more premium experience for students who want one place to plan revision, run focus sessions, and get AI support without visual clutter.

## What Changed

- Rebuilt the landing experience into a polished study command center
- Added subject switching for core MYP 3 study areas
- Added focus modes, a Pomodoro-style timer, and a lightweight daily planner
- Kept the AI coach workflow connected to the existing `/api/chat` serverless route
- Replaced the starter Vite styling with a custom visual system and responsive layout

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## AI Route

The frontend sends chat requests to `api/chat.js`.

For deployments, make sure `ANTHROPIC_API_KEY` is configured in your hosting environment so the serverless function can call Anthropic successfully.

## Vercel Deployment

1. Import the repo into Vercel
2. Set the environment variable `ANTHROPIC_API_KEY`
3. Deploy with the included `vercel.json`

The project already includes:

- `vercel.json` for Vite output and function duration
- `.env.example` for local and hosted environment setup
- a custom `favicon.svg` and improved metadata for a more polished production surface
