# ClipCast

ClipCast is a Next.js application that allows users to upload videos and publish them to multiple social media platforms (TikTok and Instagram) simultaneously with AI-generated hashtags.

## Features

- **Multi-Platform Publishing**: Upload videos to TikTok and Instagram from one interface
- **AI-Powered Hashtags**: Automatically generate relevant hashtags using AI
- **Account Management**: Connect and manage multiple social media accounts (up to 5)
- **Secure Authentication**: OAuth 2.0 integration with TikTok and Instagram
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15.3.3, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Authentication**: OAuth 2.0 (TikTok, Instagram)
- **AI Integration**: Google Genkit with Gemini
- **Development**: Turbopack (when enabled)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clipcast
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```
   TIKTOK_CLIENT_KEY=your_tiktok_client_key
   TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
   INSTAGRAM_APP_ID=your_instagram_app_id
   INSTAGRAM_APP_SECRET=your_instagram_app_secret
   GOOGLE_GENAI_API_KEY=your_google_ai_api_key
   NEXT_PUBLIC_BASE_URL=http://localhost:9002
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Navigate to [http://localhost:9002](http://localhost:9002)

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── instagram/  # Instagram API integration
│   │   └── tiktok/     # TikTok API integration
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # Shadcn/ui components
│   ├── account-manager.tsx
│   └── upload-form.tsx
├── context/           # React context providers
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
└── ai/                # AI integration (Genkit)
```

## Current Problems & Known Issues

⚠️ **This application is currently in development and has several critical issues that prevent it from working properly:**

### 🔴 CSS Build Errors
- **Issue**: Turbopack CSS parser fails with invalid CSS syntax
- **Error**: `Parsing css source code failed` at `globals.css:1696:9`
- **Impact**: Application fails to load, returns 500 errors
- **Cause**: Corrupted or invalid CSS generated in `globals.css`
- **Status**: Intermittent - sometimes works without `--turbopack` flag

### 🔴 TikTok Integration Issues
- **Issue**: TikTok API endpoints return 404 errors
- **Missing Files**: Several TikTok API route files were deleted
- **Impact**: Cannot connect TikTok accounts or upload videos
- **Status**: Requires complete TikTok integration rebuild

### 🔴 Instagram OAuth Inconsistencies
- **Issue**: Instagram OAuth sometimes fails with "Missing required environment variables"
- **Cause**: Environment variable loading issues in serverless functions
- **Impact**: Intermittent Instagram connection failures
- **Status**: Partially fixed but still unstable

### 🟡 Development Server Instability
- **Issue**: Frequent need to restart development server
- **Symptoms**: 
  - CSS compilation errors
  - Environment variable reloading issues
  - Module resolution problems
- **Workaround**: Regular server restarts and cache clearing

### 🟡 Missing Core Functionality
- **Video Upload**: File upload mechanism not fully implemented
- **Content Publishing**: API integrations incomplete
- **Error Handling**: Limited error recovery and user feedback
- **Testing**: No test coverage for critical paths

### 🟡 Dependency Warnings
- **OpenTelemetry**: Missing `@opentelemetry/exporter-jaeger` dependency
- **Handlebars**: Webpack compatibility warnings
- **Impact**: Console noise, potential runtime issues

## Why It Doesn't Work

1. **CSS Compilation Failure**: The primary blocker is the CSS parsing error that prevents the application from loading
2. **Incomplete API Integration**: TikTok and Instagram APIs are not fully functional
3. **Missing File Uploads**: Core video upload functionality is not implemented
4. **Environment Issues**: Inconsistent environment variable loading
5. **Development Instability**: Frequent build failures requiring manual intervention

## Next Steps for Fixing

1. **Fix CSS Issues**: Clean up `globals.css` and resolve Turbopack compatibility
2. **Rebuild TikTok Integration**: Recreate missing API endpoints
3. **Stabilize Instagram OAuth**: Fix environment variable loading
4. **Implement File Uploads**: Add proper video file handling
5. **Add Error Handling**: Improve user experience with better error messages
6. **Add Testing**: Implement comprehensive test coverage

## Contributing

This project is currently in early development. Please check the issues section for known problems before contributing.
