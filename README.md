# Fiverr Ace (GigWizard)

This is a Next.js application built with Firebase Studio, designed to help create optimized Fiverr gigs using AI.

## Getting Started

To get started, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

For Genkit AI flows development (if you need to test flows independently):
```bash
npm run genkit:dev
```
This will start the Genkit development server, usually on port 3400.

Open [http://localhost:9002](http://localhost:9002) (or your configured port for `npm run dev`) with your browser to see the result.

## Project Structure

-   `src/app/`: Contains the Next.js pages and route handlers (App Router).
-   `src/ai/`: Contains Genkit AI flows and related schemas.
    -   `src/ai/flows/`: Specific AI generation tasks.
    -   `src/ai/schemas/`: Zod schemas for AI inputs/outputs.
    -   `src/ai/genkit.ts`: Genkit initialization.
    -   `src/ai/dev.ts`: For local Genkit development server.
-   `src/components/`: Shared React components, including ShadCN UI components.
-   `src/lib/`: Utility functions, Firebase initialization.
-   `public/`: Static assets.

## Key Technologies

-   Next.js (App Router)
-   React
-   TypeScript
-   Tailwind CSS
-   ShadCN UI
-   Genkit (for AI features with Google Gemini)
-   Firebase (for Authentication)

## Deploying to Vercel

This project is ready to be deployed to Vercel.

### 1. Connect Your Git Repository to Vercel

-   Push your project to a Git provider (GitHub, GitLab, Bitbucket).
-   Go to your Vercel dashboard and import the project. Vercel should automatically detect it as a Next.js application.

### 2. Configure Environment Variables

Your application requires an API key for Google AI (Gemini) used by Genkit.

-   In your Vercel project settings, navigate to "Environment Variables".
-   Add the following variable:
    -   `GEMINI_API_KEY`: Your API key obtained from [Google AI Studio](https://aistudio.google.com/app/apikey).

    Refer to the `.env.example` file for a template.
    **Important:** Do NOT commit your actual `.env` file containing your API key to your Git repository.

### 3. Configure Firebase Authentication - Authorized Domains

This is a **CRITICAL** step for Firebase Authentication (like Google Sign-In) to work on your deployed Vercel site.

-   After Vercel deploys your project, you will get a production URL (e.g., `your-project-name.vercel.app`) and potentially preview URLs for branches.
-   Go to your [Firebase Console](https://console.firebase.google.com/).
-   Select your project (e.g., `fiverr-ace`).
-   Navigate to **Authentication** from the left sidebar.
-   Click on the **Sign-in method** tab.
-   Scroll down to the **Authorized domains** section.
-   Click **Add domain** and add your Vercel production URL (e.g., `your-project-name.vercel.app`).
-   If you use Vercel's preview deployments, you might also need to add the domain format Vercel uses for them (often `*.vercel.app` can work, or more specific preview domains if you know them).

    *If you forget this step, Google Sign-In will likely fail with an `auth/unauthorized-domain` error.*

### 4. Deploy

-   Once the environment variables and authorized domains are set up, trigger a deployment in Vercel (this usually happens automatically when you push to your connected Git branch).
-   Vercel will build and deploy your Next.js application.

### `apphosting.yaml`

The `apphosting.yaml` file in this project is for deployment to Firebase App Hosting. It is not used by Vercel and can be ignored if you are deploying to Vercel.

## Local Development Notes

-   Make sure you have Node.js and npm (or yarn/pnpm) installed.
-   Copy `.env.example` to `.env` and fill in your `GEMINI_API_KEY` for local AI feature testing.
-   For Firebase Authentication to work locally, `localhost` is usually authorized by default in new Firebase projects. If you have issues, ensure `localhost` is in the "Authorized domains" list in your Firebase Authentication settings.
```
