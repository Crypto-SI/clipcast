export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing and using ClipCast, you accept and agree to be bound by the terms and provision of this agreement.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
        <p className="mb-4">
          ClipCast is a web application that allows users to upload video content to multiple social media platforms including TikTok and Instagram, with AI-powered hashtag generation.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Responsibilities</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>You are responsible for all content you upload through ClipCast</li>
          <li>You must comply with all applicable laws and platform policies</li>
          <li>You must not upload content that violates copyright or other intellectual property rights</li>
          <li>You must not upload harmful, offensive, or illegal content</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Privacy and Data</h2>
        <p className="mb-4">
          Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Third-Party Services</h2>
        <p className="mb-4">
          ClipCast integrates with third-party services including TikTok and Instagram. Your use of these services is subject to their respective terms of service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
        <p className="mb-4">
          ClipCast is provided "as is" without warranty of any kind. We are not liable for any damages arising from your use of the service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contact Information</h2>
        <p className="mb-4">
          For questions about these Terms of Service, please contact us at support@cryptosi.org
        </p>
      </div>
    </div>
  );
} 