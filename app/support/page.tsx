export default function SupportPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Fairway Support</h1>

      <p className="mb-4">
        Need help with Fairway? We're here to assist.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p className="mb-4">
        Email us at{" "}
        <a
          href="mailto:support@fairway.cam"
          className="underline"
        >
          support@fairway.cam
        </a>
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Frequently Asked Questions</h2>

      <p className="font-medium mt-4">How does Auto work?</p>
      <p className="mb-4">
        When Auto is enabled, lift your club toward the camera to trigger recording.
        Step back and swing. Your swing will automatically capture and replay.
      </p>

      <p className="font-medium mt-4">Does Fairway require an account?</p>
      <p className="mb-4">
        No. Fairway does not require an account to record and review swings.
      </p>

      <p className="font-medium mt-4">How do I report a bug?</p>
      <p className="mb-4">
        Please email support@fairway.cam with details and your device model.
      </p>

      <div className="mt-12 text-sm text-gray-500">
        © 2026 James Poots
      </div>
    </main>
  );
}