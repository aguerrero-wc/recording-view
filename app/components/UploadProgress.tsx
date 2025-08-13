import React from 'react';

interface UploadProgressProps {
  progress: number; // 0-100
  isVisible: boolean;
  fileName?: string;
  uploadSpeed?: string;
}

const UploadProgress = ({ 
  progress, 
  isVisible, 
  fileName = "audio.webm",
  uploadSpeed = ""
}: UploadProgressProps) => {
  if (!isVisible) return null;
  
  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-700 font-medium">Subiendo audio...</span>
        <span className="text-orange-600 font-bold">{progress}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200/80 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-orange-500 via-orange-600 to-purple-600 h-full rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        
        {/* Progress indicator dot */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg border border-orange-300"
          style={{ left: `${progress}%`, marginLeft: '-4px' }}
        ></div>
      </div>
      
      {/* Details */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="truncate max-w-[120px]">{fileName}</span>
        {uploadSpeed && (
          <span className="bg-gray-100 px-2 py-1 rounded-full">
            {uploadSpeed}
          </span>
        )}
      </div>
      
      {/* Loading dots animation */}
      <div className="flex justify-center space-x-1">
        <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default UploadProgress;