import React from 'react';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const TermsCheckbox: React.FC<TermsCheckboxProps> = ({ 
  checked, 
  onChange, 
  className = '' 
}) => {
  return (
    <div className={`pt-2 ${className}`}>
      <label className="flex items-start space-x-2 cursor-pointer group">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="appearance-none w-6 h-6 border-2 border-gray-300 rounded bg-white checked:bg-orange-500"
          />
          {checked && (
            <svg 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 28 28"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-xs text-gray-600 text-left leading-relaxed group-hover:text-gray-800 transition-colors">
          He leído y acepto los{' '}
          <a 
            href="/terminos" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            términos de servicio
          </a>
          {' '}y{' '}
          <a 
            href="/privacidad" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            política de privacidad
          </a>
        </span>
      </label>
    </div>
  );
};

export default TermsCheckbox;