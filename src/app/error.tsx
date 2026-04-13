"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-parchment dark:bg-dark-bg flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold font-serif text-ink dark:text-dark-text mb-2">
          页面出了点问题
        </h1>
        <p className="text-muted dark:text-dark-muted text-sm mb-6">
          {error.message || "加载失败，请稍后重试"}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-cinnabar hover:bg-cinnabar-light text-white rounded-lg text-sm font-medium transition-colors"
        >
          重新加载
        </button>
      </div>
    </main>
  );
}
