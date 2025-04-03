export default function GameControls() {
  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow">
      <h3 className="font-heading font-bold text-lg mb-3">Game Controls</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-100 p-3 rounded text-center">
          <span className="block text-sm text-gray-500">Move</span>
          <span className="font-medium">Arrow Keys</span>
        </div>
        <div className="bg-gray-100 p-3 rounded text-center">
          <span className="block text-sm text-gray-500">Action</span>
          <span className="font-medium">Space Bar</span>
        </div>
        <div className="bg-gray-100 p-3 rounded text-center">
          <span className="block text-sm text-gray-500">Pause</span>
          <span className="font-medium">P Key</span>
        </div>
        <div className="bg-gray-100 p-3 rounded text-center">
          <span className="block text-sm text-gray-500">Menu</span>
          <span className="font-medium">Esc Key</span>
        </div>
      </div>
    </div>
  );
}
