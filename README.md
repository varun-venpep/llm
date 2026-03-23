# LMS Platform

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

> [!IMPORTANT]
> **Technical Documentation**: For a deep dive into the architecture, schema, and API routes, see [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md).

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


The Super Admin portal URL is: http://admin.localhost:3000

Here is a quick reference for the other URLs and the standard credentials we've been using for testing:

1. Super Admin (Platform Owner)

URL: http://admin.localhost:3000
Email: admin@platform.com (or check your specific seeded super admin email)
Password: password
2. Tenant Admin (Institute Owner)

URL: http://venpep.localhost:3000/admin (replace 'venpep' with any other tenant subdomain you create)
Email: admin@venpep.com
Password: password
3. Student (Learner)

URL: http://venpep.localhost:3000
Email: test@venpep.com
Password: drown8sy
(I searched for a specific credentials 

.md
 file but couldn't locate one in the project directory, so I've compiled everything we've used into this list for you!)