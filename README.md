# AI Notes

AI Notes is a Next.js app for role-based note management, collaboration, and AI-assisted note generation.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Docker and Render

This project now ships with a Dockerfile and a Render blueprint so it can run the same way locally and in production.

### Build and run locally with Docker

```bash
docker build -t ai-notes .
docker run --rm -p 3000:3000 --env-file .env.local ai-notes
```

### Deploy on Render

1. Push the repository to GitHub.
2. Create a new Render Web Service from this repo.
3. Render will detect `render.yaml` and use the included Dockerfile.
4. Set the required environment variables in Render:
	- `MONGODB_URI`
	- `JWT_SECRET`
	- `NEXT_PUBLIC_ADMIN_EMAIL`
	- `NEXT_PUBLIC_ADMIN_PASS`
	- `GROQ_API_KEY` if you use the AI features
	- `TNGIS_COOKIE`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` if those features are enabled
5. Keep the persistent disk mounted at `/var/data/uploads` so uploaded files survive redeploys.

The file-serving route reads from `UPLOADS_DIR`. It defaults to `public/uploads` locally and is set to `/var/data/uploads` on Render.
