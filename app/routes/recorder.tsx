// app/routes/recorder.tsx
import { useState } from "react";
import RecordingControls from "~/components/RecordingControls";

export function meta() {
  return [
    { title: "Audio Recorder - Controls Test" },
    { name: "description", content: "Test de controles de grabación" },
  ];
}

export default function RecorderPage() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped' | 'uploading'>('idle');
  const [duration, setDuration] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex flex-col items-center justify-center p-4">
      {/* Panel de control de estados */}
      <div className="mb-8 bg-white rounded-xl shadow-lg p-4 max-w-2xl w-full">
        <h2 className="text-lg font-bold text-gray-800 mb-4">🎨 Control de Estados</h2>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setRecordingState('idle')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              recordingState === 'idle' 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Idle
          </button>
          <button
            onClick={() => setRecordingState('recording')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              recordingState === 'recording' 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Recording
          </button>
          <button
            onClick={() => setRecordingState('paused')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              recordingState === 'paused' 
                ? 'bg-purple-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Paused
          </button>
          <button
            onClick={() => setRecordingState('stopped')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              recordingState === 'stopped' 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Stopped
          </button>
          <button
            onClick={() => setRecordingState('uploading')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              recordingState === 'uploading' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Uploading
          </button>
          <button
            onClick={() => setTermsAccepted(!termsAccepted)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              termsAccepted 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-red-600 text-white shadow-lg'
            }`}
          >
            Terms: {termsAccepted ? '✓' : '✗'}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Estado actual:</span>
          <span className="font-bold text-orange-600">{recordingState}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Duración:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setDuration(Math.max(0, duration - 5))}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              -5s
            </button>
            <span className="font-bold text-purple-600">{duration}s</span>
            <button
              onClick={() => setDuration(duration + 5)}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              +5s
            </button>
          </div>
        </div>
      </div>

      {/* Componente de controles */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <RecordingControls
          recordingState={recordingState}
          duration={duration}
          onStartRecording={() => {
            console.log('Start Recording');
            setRecordingState('recording');
          }}
          onPauseRecording={() => {
            console.log('Pause Recording');
            setRecordingState('paused');
          }}
          onResumeRecording={() => {
            console.log('Resume Recording');
            setRecordingState('recording');
          }}
          onStopRecording={() => {
            console.log('Stop Recording');
            setRecordingState('stopped');
          }}
          onResetRecorder={() => {
            console.log('Reset Recorder');
            setRecordingState('idle');
            setDuration(0);
          }}
          disabled={!termsAccepted}
        />
      </div>

      {/* Info adicional */}
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Usa los botones de arriba para cambiar el estado y ver cómo se comportan los controles</p>
      </div>
    </div>
  );
}