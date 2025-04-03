import { useEffect, useState } from 'react';
import { features } from '@/lib/constants';

export default function FeaturePreview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {features.map((feature, index) => (
        <div 
          key={index}
          className="bg-gray-800 rounded-lg p-5 shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
        >
          <div className={`text-${feature.colorClass} mb-3`}>
            <i className={`${feature.icon} text-3xl`}></i>
          </div>
          <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
          <p className="text-gray-400 text-sm">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}
