"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          页面出了点问题
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {error.message || "加载失败，请稍后重试"}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          重新加载
        </button>
      </div>
    </main>
  );
}
