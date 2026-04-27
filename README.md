This is a Next.js project for Le Relief.

## Getting Started

Copy the environment template first:

```bash
cp .env.example .env.local
```

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

## AI Translation

The French → English translation flow supports `openai`, `gemini`, and `deepseek`.

Example DeepSeek setup in `.env.local`:

```dotenv
TRANSLATION_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

Optional cron protection for the translation route:

```dotenv
CRON_SECRET=your_secret_here
```

The translation endpoint is available at `/api/cron/translate-published-fr`.

If `CRON_SECRET` is set, send it as `Authorization: Bearer <secret>`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
