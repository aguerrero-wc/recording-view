import React, { useState, useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
  isPaused: boolean;
  className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  isRecording, 
  isPaused, 
  className = "" 
}) => {
  const [audioData, setAudioData] = useState<number[]>(new Array(24).fill(8));
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    let isActive = true;
    startTimeRef.current = Date.now();

    const animate = () => {
      if (!isActive) return;

      if (isRecording && !isPaused) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const newAudioData: number[] = [];

        for (let i = 0; i < 24; i++) {
          // Múltiples ondas con diferentes frecuencias y fases
          const baseWave = Math.sin(elapsed * 2.5 + i * 0.4) * 25;
          const highFreq = Math.sin(elapsed * 6 + i * 0.7) * 12;
          const mediumFreq = Math.sin(elapsed * 3.5 + i * 0.6) * 8;
          
          // Patrones más complejos para diferentes secciones
          const sectionPattern = Math.sin(elapsed * 1.8 + (i / 24) * Math.PI * 2) * 15;
          
          // Variaciones aleatorias más naturales
          const randomVariation = (Math.random() - 0.5) * 6;
          const spike = Math.random() > 0.94 ? Math.random() * 20 : 0;
          
          // Diferentes comportamientos por sección
          let sectionMultiplier = 1;
          if (i < 6) {
            // Graves - más lentos y amplios
            sectionMultiplier = 1.3;
          } else if (i > 18) {
            // Agudos - más rápidos y pequeños
            sectionMultiplier = 0.8;
          }

          // Combinar todas las ondas
          const combinedHeight = (
            baseWave + 
            highFreq * 0.7 + 
            mediumFreq * 0.9 + 
            sectionPattern + 
            randomVariation + 
            spike
          ) * sectionMultiplier;

          // Altura final entre 8 y 65 pixeles
          const finalHeight = Math.max(8, Math.min(65, 30 + combinedHeight));
          newAudioData.push(finalHeight);
        }

        setAudioData(newAudioData);
      } else {
        // Animación suave hacia el estado inactivo
        setAudioData(prev => prev.map(height => {
          const target = isPaused ? height * 0.4 : 8;
          return height + (target - height) * 0.15;
        }));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPaused]);

  if (!isRecording && !isPaused) {
    return null;
  }

  return (
    <div className={`w-full max-w-xs ${className}`}>
      <div className="flex items-end justify-center space-x-1.5 h-20 px-6">
        {audioData.map((height, index) => {
          // Diferentes anchos para crear más variedad visual
          const widthVariations = [2, 3, 2, 4, 3, 2, 3];
          const width = widthVariations[index % widthVariations.length];
          
          // Gradientes dinámicos con morado y naranja
          let gradientClass = "from-orange-500 to-orange-300";
          let shadowClass = "";
          
          if (height > 50) {
            gradientClass = "from-purple-500 to-orange-400";
            shadowClass = "drop-shadow-lg";
          } else if (height > 35) {
            gradientClass = "from-orange-500 to-purple-400";
            shadowClass = "drop-shadow-md";
          }

          return (
            <div
              key={index}
              className={`bg-gradient-to-t ${gradientClass} rounded-full transition-all duration-200 ease-out ${shadowClass} ${
                isPaused ? 'opacity-50' : 'opacity-100'
              }`}
              style={{
                width: `${width}px`,
                height: `${Math.round(height)}px`,
                transform: isPaused ? 'scaleY(0.7)' : 'scaleY(1)',
                transitionDelay: `${index * 3}ms`
              }}
            />
          );
        })}
      </div>
      
      {/* Efecto de onda de fondo con gradiente dual */}
      <div className="relative -mt-4 h-6 overflow-hidden">
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/30 via-orange-200/30 to-transparent rounded-full transition-all duration-1000 ${
            isRecording && !isPaused ? 'animate-pulse opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </div>
  );
};

export default AudioVisualizer;