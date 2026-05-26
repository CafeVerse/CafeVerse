import React from 'react'
import { Link } from 'react-router-dom'

export const ContactUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-8 text-left text-foreground/90 space-y-12">
      <div className="space-y-2 border-b border-white/5 pb-8">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
          Contact Us
        </h2>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Get in touch with us
        </p>
      </div>

      <div className="space-y-8">
        <p className="text-lg leading-relaxed">
          We would love to hear from you. If you have any questions, feedback, or concerns, please
          get in touch.
        </p>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            How to Reach Us
          </h3>
          <p className="text-lg leading-relaxed">You can contact us using the following methods:</p>
          <ul className="list-disc list-inside text-lg leading-relaxed space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground">Email:</strong> Use the contact form below or
              email us directly.
            </li>
            <li>
              <strong className="text-foreground">Response time:</strong> We aim to respond within
              1-2 business days.
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            What to Include
          </h3>
          <p className="text-lg leading-relaxed">
            When contacting us, please include a clear subject line and as much relevant detail as
            possible so we can help you quickly.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
            Other Pages
          </h3>
          <p className="text-lg leading-relaxed">
            For legal or copyright matters, please see our{' '}
            <Link to="/dmca" className="text-primary hover:underline transition-none">
              DMCA Policy
            </Link>{' '}
            and{' '}
            <Link to="/terms" className="text-primary hover:underline transition-none">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
