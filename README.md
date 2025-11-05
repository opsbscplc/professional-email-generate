# Email Template Generator

A modern, AI-powered email template generator built with Next.js, featuring glass morphism design and Google Gemini AI integration.

## 🌟 Features

- **AI-Powered Email Enhancement**: Transform draft emails using Google Gemini AI
- **Multiple Template Styles**: Professional, Casual, Polite, Direct, Follow-up, and Reminder templates
- **AI Trainer Interface**: Train the AI with custom examples for personalized outputs
- **Glass Morphism Design**: Modern, elegant UI with backdrop blur effects
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Comprehensive Testing**: Unit, integration, E2E, accessibility, and security tests
- **Performance Optimized**: Code splitting, caching, and Core Web Vitals monitoring
- **Security First**: XSS protection, input sanitization, and secure API handling

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom glass morphism utilities
- **AI Integration**: Google Gemini API
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Testing**: Jest, React Testing Library, Puppeteer
- **CI/CD**: GitHub Actions

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/email-template-generator.git
cd email-template-generator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Add your Google Gemini API key and database credentials to `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Google Gemini API
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration
POSTGRES_URL=your_postgres_connection_string
POSTGRES_PRISMA_URL=your_prisma_connection_string
POSTGRES_URL_NON_POOLING=your_non_pooling_connection_string

# Supabase Configuration
SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🏗️ Project Structure

```
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   ├── template-enhancer/ # Template enhancement page
│   │   └── trainer/        # AI trainer page
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   └── __tests__/      # Component tests
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript type definitions
├── scripts/                # Build and deployment scripts
├── .github/workflows/      # GitHub Actions CI/CD
└── docs/                   # Documentation
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:accessibility # Accessibility tests
npm run test:security     # Security tests
npm run test:performance  # Performance tests

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy to Vercel:
```bash
npm run deploy
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 📊 Features Overview

### Template Enhancement
- Select from 6 predefined email templates
- Input your draft email content
- AI enhances the email based on selected template style
- Copy enhanced email to clipboard

### AI Trainer
- Provide training examples (input/output pairs)
- Test the AI with new inputs
- Get personalized email generation based on your training data

### Glass Morphism UI
- Modern backdrop blur effects
- Responsive glass card components
- Smooth animations and transitions
- Accessible design with proper contrast

## 🔒 Security Features

- Input sanitization and XSS protection
- Rate limiting on API endpoints
- Secure session management
- HTTPS enforcement
- Security headers implementation
- CORS configuration

## 📈 Performance Features

- Code splitting for optimal loading
- Image optimization
- API response caching
- Core Web Vitals monitoring
- Lighthouse performance optimization

## 🧩 API Endpoints

- `POST /api/gemini` - Email enhancement and AI generation
- `POST /api/gemini/test` - API key validation
- `GET /api/health` - Health check endpoint
- `POST /api/analytics` - Usage analytics
- `POST /api/errors` - Error logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powerful language processing
- Vercel for seamless deployment platform
- Supabase for database infrastructure
- Next.js team for the amazing framework
- Tailwind CSS for utility-first styling

## 📞 Support

If you have any questions or need help with setup, please open an issue on GitHub.

---

**Built with ❤️ using Next.js and Google Gemini AI**