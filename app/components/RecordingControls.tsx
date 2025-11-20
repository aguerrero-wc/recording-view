import React from 'react';
import { Pause, Play, Square, Mic, RotateCcw } from 'lucide-react';

interface RecordingControlsProps {
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped' | 'uploading';
  duration: number;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onResetRecorder: () => void;
  disabled?: boolean;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  duration,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onResetRecorder,
  disabled = false,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMainButtonAction = () => {
    if (disabled && recordingState === 'idle') return () => {};
    if (recordingState === 'idle') return onStartRecording;
    if (recordingState === 'stopped') return onResetRecorder;
    return () => {};
  };

  const isMainButtonDisabled = () => {
    if (recordingState === 'idle' && disabled) return true;
    return recordingState === 'uploading' || recordingState === 'recording' || recordingState === 'paused';
  };

  const getMainButtonStyles = () => {
    const baseStyles = "w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-300";
    
    if (recordingState === 'idle') {
      if (disabled) {
        return `${baseStyles} bg-gray-300 cursor-not-allowed opacity-60`;
      }
      return `${baseStyles} bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 active:scale-95 transform hover:scale-105`;
    } else if (recordingState === 'stopped') {
      return `${baseStyles} bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 active:scale-95 transform hover:scale-105`;
    } else if (recordingState === 'recording') {
      return `${baseStyles} bg-gradient-to-br from-purple-500 to-purple-600 cursor-not-allowed`;
    }
    
    return `${baseStyles} bg-gradient-to-br from-orange-400 to-orange-500 cursor-not-allowed`;
  };

  const getMainButtonIcon = () => {
    if (recordingState === 'idle') {
      return <Mic className={`w-8 h-8 ${disabled ? 'text-gray-500' : 'text-white'}`} />;
    } else if (recordingState === 'stopped') {
      return <RotateCcw className="w-8 h-8 text-white" />;
    } else {
      return (
        <div 
          className={`w-8 h-8 rounded-full bg-white ${
            recordingState === 'recording' ? 'animate-pulse' : ''
          }`}
          style={{
            animationDuration: recordingState === 'recording' ? '2s' : '1s'
          }}
        />
      );
    }
  };

  // ✅ NUEVO: Vista especial para estado "recording"
  if (recordingState === 'recording') {
    return (
      <div className="pb-8 pt-6">
        {/* Timer prominente arriba */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-red-50 px-6 py-3 rounded-2xl border border-red-100">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-mono text-2xl font-bold tracking-wider">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Botones principales centrados y grandes */}
        <div className="flex items-center justify-center space-x-6">
          {/* Botón de Pausa - Grande */}
          <button
            onClick={onPauseRecording}
            className="w-20 h-20 bg-white/90 backdrop-blur-sm hover:bg-white border-2 border-orange-200 rounded-2xl flex flex-col items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group"
            title="Pausar grabación"
          >
            <Pause className="w-8 h-8 text-orange-600 group-hover:text-orange-700 transition-colors" />
            <span className="text-xs text-orange-600 font-medium mt-1">Pausar</span>
          </button>

          {/* Botón de Detener - Grande */}
          <button
            onClick={onStopRecording}
            className="w-20 h-20 bg-white/90 backdrop-blur-sm hover:bg-white border-2 border-red-200 rounded-2xl flex flex-col items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group"
            title="Detener grabación"
          >
            <Square className="w-8 h-8 text-red-500 fill-current group-hover:text-red-600 transition-colors" />
            <span className="text-xs text-red-500 font-medium mt-1">Detener</span>
          </button>
        </div>

        {/* Status text - ✅ CAMBIADO: como estaba antes */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-red-600 text-sm font-medium">Grabando...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ NUEVO: Vista especial para estado "paused"
  if (recordingState === 'paused') {
    return (
      <div className="pb-8 pt-6">
        {/* Timer prominente arriba */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-purple-50 px-6 py-3 rounded-2xl border border-purple-200">
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-purple-600 font-mono text-2xl font-bold tracking-wider">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Botones principales centrados y grandes */}
        <div className="flex items-center justify-center space-x-6">
          {/* Botón de Reanudar - Grande */}
          <button
            onClick={onResumeRecording}
            className="w-20 h-20 bg-gradient-to-br from-purple-100/90 to-purple-200/80 backdrop-blur-sm hover:from-purple-100 hover:to-purple-200 border-2 border-purple-300 rounded-2xl flex flex-col items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group"
            title="Reanudar grabación"
          >
            <Play className="w-8 h-8 text-purple-600 ml-1 group-hover:text-purple-700 transition-colors" />
            <span className="text-xs text-purple-600 font-medium mt-1">Reanudar</span>
          </button>

          {/* Botón de Detener - Grande */}
          <button
            onClick={onStopRecording}
            className="w-20 h-20 bg-white/90 backdrop-blur-sm hover:bg-white border-2 border-red-200 rounded-2xl flex flex-col items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group"
            title="Detener grabación"
          >
            <Square className="w-8 h-8 text-red-500 fill-current group-hover:text-red-600 transition-colors" />
            <span className="text-xs text-red-500 font-medium mt-1">Detener</span>
          </button>
        </div>

        {/* Status text */}
        <div className="text-center mt-6">
          <p className="text-purple-600 text-sm font-medium">Grabación pausada</p>
        </div>
      </div>
    );
  }

  // ✅ Vista normal para idle, stopped, uploading
  const showTimer = recordingState !== 'idle' && recordingState !== 'uploading';

  return (
    <div className="pb-8 pt-6">
      <div className="flex items-center justify-center">
        {/* Center: Main Record Button */}
        <div className="text-center">
          <button
            onClick={getMainButtonAction()}
            disabled={isMainButtonDisabled()}
            className={getMainButtonStyles()}
            title={
              recordingState === 'idle' 
                ? disabled 
                  ? 'Acepta los términos para grabar'
                  : 'Iniciar grabación'
                : recordingState === 'stopped' 
                ? 'Nueva grabación' 
                : 'Grabando...'
            }
          >
            {getMainButtonIcon()}
          </button>
          
          {/* Timer */}
          {showTimer && (
            <div className="mt-3 text-orange-600 font-mono text-xl font-bold tracking-wider">
              {formatDuration(duration)}
            </div>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="text-center mt-6">
        {recordingState === 'stopped' && (
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <p className="text-green-600 text-sm font-medium">Listo para procesar</p>
          </div>
        )}
        {recordingState === 'uploading' && (
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
            <p className="text-orange-600 text-sm font-medium">Procesando audio...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingControls;