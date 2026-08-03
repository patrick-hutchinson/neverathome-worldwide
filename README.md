# neverathome-worldwide

Monorepo for the Never At Home Worldwide site and Sanity Studio.

## Structure

- `app/` - Next.js site. Use this as the Vercel root directory for the public site.
- `studio/` - Sanity Studio. Use this as the Vercel root directory for the studio deployment.

## Development

Run commands from the repository root:

```bash
npm run app:dev
npm run studio:dev
```

Each workspace also keeps its own package scripts and lockfile, so commands can still be run directly from `app/` or `studio/` when needed.
