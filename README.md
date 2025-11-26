# OrcaScout 🐋

OrcaScout is a powerful, AI-enhanced job application tracker designed to help you organize your job hunt and land your dream role faster. Built with modern web technologies, it offers a seamless experience for managing applications, contacts, and documents.

<!-- ![OrcaScout Dashboard](https://placehold.co/1200x600/09090b/7c3aed?text=OrcaScout+Dashboard) -->

## ✨ Features

- **Job Tracking**: Organize applications by status (Wishlist, Applied, Interview, Offer, Rejected).
- **AI-Powered Tools**:
  - Generate tailored cover letters using AI.
  - Create personalized cold outreach emails.
  - Analyze job descriptions for keyword matching.
- **Contact Management**: Keep track of recruiters and networking contacts.
- **Document Management**: Store and manage multiple versions of your CV/Resume.
- **Chrome Extension Integration**: (Coming Soon) Save jobs directly from LinkedIn and other boards.
- **Analytics**: Visualize your progress and application stats.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Backend & Database**: [Convex](https://convex.dev/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Tabler Icons](https://tabler-icons.io/) & [Iconify](https://iconify.design/)
- **AI**: Integration with LLMs via Convex actions.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/PURPLE-ORCA/ORCASCOUTE.git
   cd orcascout
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory and add the following keys:

   ```env
   # Convex
   CONVEX_DEPLOYMENT=your_convex_deployment_name
   NEXT_PUBLIC_CONVEX_URL=your_convex_url

   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. **Start the Development Server**

   You need to run both the Next.js frontend and the Convex backend.

   ```bash
   # Terminal 1: Run Convex
   npx convex dev

   # Terminal 2: Run Next.js
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and import your project.
3. **Environment Variables**: Vercel will automatically detect that you are using Convex and Clerk if you use their integrations, or you can manually add the env vars from your `.env.local` file.
4. **Build Command**: `next build`
5. **Install Command**: `pnpm install`
6. Deploy!

### Convex Production

When deploying to production, make sure to configure your Convex production environment:

```bash
npx convex deploy
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License](LICENSE).

**TL;DR**: You can view, study, and learn from this code, but you cannot use it for commercial purposes. Attribution is required.
