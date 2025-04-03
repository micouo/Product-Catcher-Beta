export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <div className="w-16 h-16 mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400">Loading game assets...</p>
    </div>
  );
}