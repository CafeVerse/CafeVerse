import React from 'react'

export default function TermsOfServicePage(): React.JSX.Element {
  return (
    <div className="max-w-4xl mx-auto py-16 px-8 text-left text-foreground/90 space-y-12">
      <div className="space-y-2 border-b border-white/5 pb-8">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
          Terms of Service
        </h2>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Last updated: May 26, 2026
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            1. Acceptance of Terms
          </h3>
          <p className="text-lg leading-relaxed">
            By accessing and using this website, you accept and agree to be bound by the terms and
            provision of this agreement.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            2. Use License
          </h3>
          <p className="text-lg leading-relaxed">
            Permission is granted to temporarily stream videos from this site for personal,
            non-commercial transitory viewing only.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            3. Disclaimer
          </h3>
          <p className="text-lg leading-relaxed">
            The materials on this website are provided on an 'as is' basis. We make no warranties,
            expressed or implied, and hereby disclaim and negate all other warranties including,
            without limitation, implied warranties or conditions of merchantability, fitness for a
            particular purpose, or non-infringement of intellectual property or other violation of
            rights.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            4. Limitations
          </h3>
          <p className="text-lg leading-relaxed">
            In no event shall we or our suppliers be liable for any damages (including, without
            limitation, damages for loss of data or profit, or due to business interruption) arising
            out of the use or inability to use the materials on our website.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            5. Copyright/Trademark
          </h3>
          <p className="text-lg leading-relaxed">
            This website does not host any files. All content is provided by non-affiliated third
            parties.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            6. Contact
          </h3>
          <p className="text-lg leading-relaxed">
            If you have any questions about these Terms, please contact us.
          </p>
        </div>
      </div>
    </div>
  )
}
