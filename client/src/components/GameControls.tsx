export default function GameControls() {
  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow">
      <h3 className="font-heading font-bold text-lg mb-3">Skyfall Snake Controls</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-100 p-3 rounded text-center">
          <span className="block text-sm text-gray-500">Move</span>
          <span className="font-medium">WASD or Arrow Keys</span>
        </div>
        <div className="bg-gray-100 p-3 rounded text-center">
          <span className="block text-sm text-gray-500">Boost</span>
          <span className="font-medium">Shift Key</span>
        </div>
        <div className="bg-gray-100 p-3 rounded text-center">
          <span className="block text-sm text-gray-500">Restart</span>
          <span className="font-medium">R Key</span>
        </div>
        <div className="bg-gray-100 p-3 rounded text-center">
          <span className="block text-sm text-gray-500">Start</span>
          <span className="font-medium">Click/Tap</span>
        </div>
      </div>
    </div>
  );
}
