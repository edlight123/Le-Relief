export const metadata = {
  title: "Privacy Policy | Le Relief Haiti",
  description: "Privacy policy and data handling practices",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight animate-fade-in-up">
        Privacy Policy
      </h1>

      <div className="mt-4 h-px bg-gradient-to-r from-primary/60 via-accent-rose/20 to-transparent" />

      <div className="mt-8 prose prose-lg dark:prose-invert max-w-none">
        <p>
          Le Relief Haiti is committed to protecting your privacy. This policy
          explains what data we collect, how we use it, and your rights.
        </p>

        <h2>Data We Collect</h2>
        <p>
          When you create an account, we collect your name, email address, and
          profile image. If you sign in with a third-party provider such as
          Google, Facebook, or X, we receive basic profile information from
          that service.
        </p>

        <h2>Authentication &amp; Sessions</h2>
        <p>
          We use secure session-based authentication. Passwords are hashed
          using industry-standard algorithms and are never stored in plain
          text.
        </p>

        <h2>Cookies</h2>
        <p>
          We use essential cookies to maintain your session and store your
          theme preference (light or dark mode). We do not use advertising
          or tracking cookies.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          Le Relief Haiti integrates with third-party authentication providers
          (Google, Facebook, X) for sign-in convenience. We do not sell or
          share your personal data with third parties.
        </p>

        <h2>Data Storage</h2>
        <p>
          Your data is stored securely and accessed only by authorized
          platform operations. We retain your data as long as your account
          is active.
        </p>

        <h2>Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your
          personal data at any time by contacting us through our contact
          page.
        </p>
      </div>
    </div>
  );
}
