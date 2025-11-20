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
  disabled?: boolean; // ✅ Ya está definido
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
    // ✅ MODIFICAR: No ejecutar acción si está disabled
    if (disabled && recordingState === 'idle') return () => {};
    if (recordingState === 'idle') return onStartRecording;
    if (recordingState === 'stopped') return onResetRecorder;
    return () => {}; // No action for recording/paused/uploading states
  };

  const isMainButtonDisabled = () => {
    // ✅ MODIFICAR: Incluir la prop disabled en el estado idle
    if (recordingState === 'idle' && disabled) return true;
    return recordingState === 'uploading' || recordingState === 'recording' || recordingState === 'paused';
  };

  const getMainButtonStyles = () => {
    const baseStyles = "w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-300";
    
    // ✅ MODIFICAR: Agregar estilos para estado deshabilitado
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
      // ✅ MODIFICAR: Cambiar color del icono cuando está disabled
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

  const showSideButtons = recordingState === 'recording' || recordingState === 'paused';
  const showTimer = recordingState !== 'idle' && recordingState !== 'uploading';

  return (
    <div className="pb-8 pt-6">
      <div className="flex items-center justify-center space-x-8">
        
        {/* Left Button: Pause/Resume */}
        {showSideButtons && (
          <button
            onClick={recordingState === 'recording' ? onPauseRecording : onResumeRecording}
            className={`w-14 h-14 backdrop-blur-sm border rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
              recordingState === 'paused' 
                ? 'bg-purple-100/80 hover:bg-purple-100 border-purple-200' 
                : 'bg-white/80 hover:bg-white border-orange-100'
            }`}
            title={recordingState === 'recording' ? 'Pausar' : 'Reanudar'}
          >
            {recordingState === 'recording' ? (
              <Pause className="w-6 h-6 text-orange-600" />
            ) : (
              <Play className="w-6 h-6 text-purple-600 ml-0.5" />
            )}
          </button>
        )}

        {/* Center: Main Record Button */}
        <div className="text-center">
          <button
            onClick={getMainButtonAction()}
            disabled={isMainButtonDisabled()}
            className={getMainButtonStyles()}
            title={
              recordingState === 'idle' 
                ? disabled 
                  ? 'Acepta los términos para grabar'  // ✅ NUEVO: Tooltip cuando está disabled
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

        {/* Right Button: Stop */}
        {showSideButtons && (
          <button
            onClick={onStopRecording}
            className="w-14 h-14 bg-white/80 backdrop-blur-sm hover:bg-white border border-red-100 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            title="Detener grabación"
          >
            <Square className="w-6 h-6 text-red-500 fill-current" />
          </button>
        )}
      </div>

      {/* Status Indicator */}
      <div className="text-center mt-6">
        {recordingState === 'paused' && (
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
            <p className="text-purple-600 text-sm font-medium">Pausado</p>
          </div>
        )}
        {recordingState === 'stopped' && (
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <p className="text-green-600 text-sm font-medium">Listo para procesar</p>
          </div>
        )}
        {recordingState === 'recording' && (
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-red-600 text-sm font-medium">Grabando...</p>
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