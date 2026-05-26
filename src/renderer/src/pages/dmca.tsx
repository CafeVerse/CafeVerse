import React from 'react'

export const DmcaPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-8 text-left text-foreground/90 space-y-12">
      <div className="space-y-2 border-b border-white/5 pb-8">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
          DMCA Copyright Policy
        </h2>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Last updated: May 26, 2026
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Notice and Takedown Procedure
          </h3>
          <p className="text-lg leading-relaxed">
            We respect the intellectual property rights of others. If you believe that your
            copyrighted work has been copied in a way that constitutes copyright infringement,
            please provide our Copyright Agent with the following information:
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Required Information
          </h3>
          <ul className="list-disc list-inside text-lg leading-relaxed space-y-1 text-muted-foreground">
            <li>
              A physical or electronic signature of the copyright owner or authorized representative
            </li>
            <li>Identification of the copyrighted work claimed to have been infringed</li>
            <li>
              Identification of the material that is claimed to be infringing with information
              reasonably sufficient to permit us to locate the material
            </li>
            <li>Your contact information (address, telephone number, and email address)</li>
            <li>
              A statement that you have a good faith belief that use of the material is not
              authorized by the copyright owner
            </li>
            <li>
              A statement that the information in the notification is accurate, under penalty of
              perjury
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Counter-Notice
          </h3>
          <p className="text-lg leading-relaxed">
            If you believe that your material that was removed is not infringing, you may send a
            counter-notice containing the following:
          </p>
          <ul className="list-disc list-inside text-lg leading-relaxed space-y-1 text-muted-foreground">
            <li>Your physical or electronic signature</li>
            <li>Identification of the material that has been removed</li>
            <li>
              A statement under penalty of perjury that you have a good faith belief that the
              material was removed as a result of mistake or misidentification
            </li>
            <li>Your contact information</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Important Notice
          </h3>
          <p className="text-lg leading-relaxed">
            This website does not host any video files. All content is provided by non-affiliated
            third parties. We act as a search engine and streaming platform aggregator.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Repeat Infringers
          </h3>
          <p className="text-lg leading-relaxed">
            We will terminate the accounts of users who are repeat infringers.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Contact</h3>
          <p className="text-lg leading-relaxed">
            DMCA notices should be sent to our designated agent. Please allow 1-2 business days for
            a response.
          </p>
        </div>
      </div>
    </div>
  )
}
