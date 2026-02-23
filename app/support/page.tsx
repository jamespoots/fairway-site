export default function SupportPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Fairway Support</h1>

      <p className="mb-6">
        Fairway is designed to be simple and hands-free. If you need help or
        have feedback, we're here.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p className="mb-6">
        Email us at{" "}
        <a
          href="mailto:support@fairway.cam"
          className="underline"
        >
          support@fairway.cam
        </a>
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">FAQ</h2>

      <p className="font-medium mt-4">How does Auto recording work?</p>
      <p className="mb-4">
        When Auto is enabled, lift your club toward the camera to trigger
        recording. Step back and swing. Your swing captures automatically
        and instantly replays.
      </p>

      <p className="font-medium mt-4">Do I need an account?</p>
      <p className="mb-4">
        No account is required to record and review swings.
      </p>

      <p className="font-medium mt-4">How do I report a bug?</p>
      <p className="mb-6">
        Send us an email with your device model and a brief description of
        the issue.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Legal</h2>
      <p className="mb-4">
        View our{" "}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>.
      </p>

      <div className="mt-12 text-sm text-gray-500">
        © 2026 James Poots
      </div>
    </main>
  );
}