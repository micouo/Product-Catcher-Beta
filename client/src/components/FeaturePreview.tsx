import { features } from '@/lib/constants';

export default function FeaturePreview() {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-white mb-6">Coming Soon</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="bg-gray-900 rounded-lg p-5 border border-gray-700 hover:border-blue-500 transition-colors duration-300"
          >
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center text-white`}>
                <i className={feature.icon}></i>
              </div>
              <h3 className="font-bold text-white ml-3">{feature.title}</h3>
            </div>
            <p className="text-gray-400 text-sm">{feature.description}</p>
            <div className="mt-4">
              <span className="inline-block bg-gray-800 text-xs text-gray-400 py-1 px-2 rounded">
                Coming {feature.eta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}