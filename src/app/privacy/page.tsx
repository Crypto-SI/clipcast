export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p className="mb-4">
          ClipCast collects the following information to provide our services:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Social media account information (usernames, profile data) when you connect your accounts</li>
          <li>Video files and metadata that you upload for processing</li>
          <li>Usage data and analytics to improve our service</li>
          <li>Technical information such as IP address, browser type, and device information</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="mb-4">We use your information to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide video uploading services to your connected social media accounts</li>
          <li>Generate AI-powered hashtags for your content</li>
          <li>Authenticate and authorize access to third-party platforms</li>
          <li>Improve our services and user experience</li>
          <li>Communicate with you about service updates or issues</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Storage and Security</h2>
        <p className="mb-4">
          We implement appropriate security measures to protect your personal information. Video files are processed temporarily and are not permanently stored on our servers. Access tokens are encrypted and stored securely.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Services</h2>
        <p className="mb-4">
          ClipCast integrates with third-party services including TikTok and Instagram. These services have their own privacy policies that govern how they handle your data. We recommend reviewing their privacy policies.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Sharing</h2>
        <p className="mb-4">
          We do not sell, trade, or otherwise transfer your personal information to third parties, except as necessary to provide our services (such as uploading content to your connected social media accounts).
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
        <p className="mb-4">You have the right to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your personal information</li>
          <li>Disconnect your social media accounts at any time</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this Privacy Policy, please contact us at privacy@cryptosi.org
        </p>
      </div>
    </div>
  );
} 