import React from 'react';

const Skeleton = ({ className = '', variant = 'default' }) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';

  const variants = {
    default: '',
    text: 'h-4',
    title: 'h-6',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32',
    table: 'h-12',
    metric: 'h-8 w-20'
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} />
  );
};

// Componentes específicos de skeleton
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" className={i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'} />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-6 border border-gray-200 rounded-lg ${className}`}>
    <Skeleton variant="title" className="w-3/4 mb-4" />
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={`header-${i}`} variant="text" className="flex-1 h-6" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" className="flex-1 h-4" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonMetrics = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton variant="text" className="h-4 w-20 mb-2" />
            <Skeleton variant="title" className="h-8 w-12" />
          </div>
          <Skeleton variant="avatar" className="w-12 h-12" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
