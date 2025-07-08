# MVP Release Checklist for ClipCast

---

## 3rd Party Accounts & API Credentials
- [ ] **TikTok Developer Account**: Register as a TikTok developer, create an app, and obtain Client Key/Secret for API access and OAuth authentication.
- [ ] **Instagram (Meta) Developer Account**: Register as a Meta developer, create an app, configure Instagram Graph API, and obtain App ID/Secret for API access and OAuth authentication.
- [ ] **AI Service Provider Account**: (Recommended for production) Sign up for an AI provider (e.g., OpenAI, Google Cloud AI), obtain API keys for hashtag generation.
- [ ] **Cloud Storage/Hosting Provider Account**: (Optional) Set up an account with AWS, Google Cloud, Azure, or Vercel for hosting or temporary video storage.
- [ ] **Email/Feedback Service Account**: (Optional) Set up an account with Mailgun, SendGrid, or similar for user support/feedback.

---

## 1. Core Product Functionality
- [ ] Implement real video upload to TikTok and Instagram (replace simulation with real API integration)
- [ ] Handle authentication (OAuth) for TikTok and Instagram accounts
- [ ] Store and manage user access tokens securely
- [ ] Ensure upload progress and error handling works with real APIs
- [ ] Enforce 5-account limit and prevent duplicate account linking

## 2. AI Features
- [ ] Finalize AI hashtag generation (ensure prompt quality and output relevance)
- [ ] Optimize AI call performance and error handling
- [ ] Add fallback or manual hashtag entry if AI fails

## 3. User Experience & UI
- [ ] Polish mobile and desktop responsiveness
- [ ] Test drag-and-drop and file preview on all target devices
- [ ] Add clear feedback for all user actions (success, error, loading)
- [ ] Ensure all text, icons, and colors match the style guide

## 4. Account Management
- [ ] Allow users to add, view, and remove TikTok/Instagram accounts
- [ ] Display accurate follower counts and avatars (from real APIs)
- [ ] Handle account disconnects and expired tokens gracefully

## 5. Security & Privacy
- [ ] Securely store sensitive data (tokens, user info)
- [ ] Add privacy policy and terms of service links
- [ ] Ensure no video or user data is leaked or logged unnecessarily

## 6. Testing & QA
- [ ] Write and run unit tests for all major components and flows
- [ ] Perform manual QA for all user flows (upload, account linking, hashtag generation)
- [ ] Test error states (API failures, network issues, invalid files)
- [ ] Test on all supported browsers and devices

## 7. Deployment & Monitoring
- [ ] Set up production build and deployment pipeline
- [ ] Configure environment variables for API keys and secrets
- [ ] Add basic monitoring/logging for errors and usage
- [ ] Prepare a rollback plan in case of critical issues

## 8. Documentation & Support
- [ ] Update README with setup, usage, and troubleshooting
- [ ] Add in-app help or tooltips for key features
- [ ] Prepare a feedback channel for early users

## 9. Legal & Compliance
- [ ] Ensure compliance with TikTok and Instagram API terms
- [ ] Add copyright and branding information
- [ ] Review for accessibility (a11y) compliance

## 10. Pre-Launch
- [ ] Final smoke test of all features
- [ ] Announce launch to early users/beta testers
- [ ] Prepare post-launch support plan 