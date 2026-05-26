import React from 'react'

export default function PrivacyPolicyPage(): React.JSX.Element {
  return (
    <div className="max-w-4xl mx-auto py-16 px-8 text-left text-foreground/90 space-y-12">
      <div className="space-y-2 border-b border-white/5 pb-8">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
          Privacy Policy
        </h2>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Last updated: May 26, 2026
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Information We Collect
          </h3>
          <p className="text-lg leading-relaxed">
            We collect information that you provide directly to us, including when you create an
            account, use our services, or communicate with us.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            How We Use Your Information
          </h3>
          <p className="text-lg leading-relaxed">We use the information we collect to:</p>
          <ul className="list-disc list-inside text-lg leading-relaxed space-y-1 text-muted-foreground">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Information Sharing
          </h3>
          <p className="text-lg leading-relaxed">
            We do not sell, trade, or rent your personal information to third parties. We may share
            your information in the following situations:
          </p>
          <ul className="list-disc list-inside text-lg leading-relaxed space-y-1 text-muted-foreground">
            <li>With your consent</li>
            <li>To comply with laws</li>
            <li>To protect our rights</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Cookies</h3>
          <p className="text-lg leading-relaxed">
            We use cookies and similar tracking technologies to track activity on our service and
            hold certain information.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Data Security
          </h3>
          <p className="text-lg leading-relaxed">
            We take reasonable measures to help protect your personal information from loss, theft,
            misuse and unauthorized access.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Your Rights
          </h3>
          <p className="text-lg leading-relaxed">
            You have the right to access, update, or delete your personal information at any time.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Changes to This Policy
          </h3>
          <p className="text-lg leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Contact Us
          </h3>
          <p className="text-lg leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us.
          </p>
        </div>
      </div>
    </div>
  )
}
