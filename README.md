This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Database

Splitsy uses Postgres. Install it locally (e.g. `brew install postgresql@16` on macOS) and make sure the server is running.

Create a database for development and one for tests:

```bash
createdb splitsy_dev
createdb splitsy_test
```

Copy `.env` (create it if it doesn't exist) and point it at your databases:

```bash
DATABASE_URL="postgresql://<user>@localhost:5432/splitsy_dev"
TEST_DATABASE_URL="postgresql://<user>@localhost:5432/splitsy_test"
```

Apply migrations to the dev database:

```bash
npx prisma migrate dev
```

The test database doesn't need migrations run against it — `src/test/database.ts` creates the schema on first use.

### Development server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
