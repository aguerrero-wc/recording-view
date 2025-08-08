import React, { useState, useRef, useEffect } from 'react';
import { Pause, Play, X } from 'lucide-react';

const AudioRecorder = () => {
  const [recordingState, setRecordingState] = useState('idle'); // idle, recording, paused, stopped, uploading
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState(new Array(40).fill(0));
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 2,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleSize: 16
        }
      });

      streamRef.current = stream;
      
      // Setup audio visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioData = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const newAudioData = [];
        for (let i = 0; i < 40; i++) {
          const index = Math.floor((i / 40) * bufferLength);
          newAudioData.push(dataArray[index] || 0);
        }
        setAudioData(newAudioData);
        
        if (recordingState === 'recording') {
          animationRef.current = requestAnimationFrame(updateAudioData);
        }
      };

      const options = {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond: 128000
      };

      if (MediaRecorder.isTypeSupported('audio/wav')) {
        options.mimeType = 'audio/wav';
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current.mimeType 
        });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        setRecordingState('stopped');
      };

      mediaRecorderRef.current.start(100);
      setRecordingState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      updateAudioData();

    } catch (err) {
      setError('Error al acceder al micrófono');
      console.error('Error accessing microphone:', err);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioData(new Array(40).fill(0));
    }
  };

  const resetRecorder = () => {
    setRecordingState('idle');
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setAudioData(new Array(40).fill(0));
    audioChunksRef.current = [];
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;
    
    setRecordingState('uploading');
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording_${Date.now()}.${audioBlob.type.includes('wav') ? 'wav' : 'webm'}`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Audio procesado exitosamente!');
      resetRecorder();
    } catch (err) {
      setError('Error al procesar el audio');
      setRecordingState('stopped');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMainContent = () => {
    if (recordingState === 'idle') {
      return (
        <div className="text-center space-y-8">
          <p className="text-gray-600 text-lg leading-relaxed px-4">
            Prepárate para grabar tu mensaje con calidad profesional. 
            Presiona el botón central cuando estés listo.
          </p>
        </div>
      );
    }

    if (recordingState === 'uploading') {
      return (
        <div className="text-center space-y-8">
          <p className="text-gray-600 text-lg">
            Procesando tu audio...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      );
    }

    if (recordingState === 'stopped') {
      return (
        <div className="text-center space-y-8">
          <p className="text-gray-600 text-lg">
            Grabación completada. Puedes reproducir, guardar o grabar nuevamente.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                if (audioUrl) {
                  const audio = new Audio(audioUrl);
                  audio.play();
                }
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-full transition-colors"
            >
              Reproducir
            </button>
            <button
              onClick={uploadAudio}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full transition-colors"
            >
              Procesar Audio
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center space-y-8">
        <p className="text-gray-600 text-lg">
          {recordingState === 'recording' ? 'Grabando tu mensaje...' : 'Grabación pausada'}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button className="p-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-12">
        
        {/* Artistic Circle */}
        <div className="relative">
          <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-100 via-emerald-50 to-blue-50 flex items-center justify-center shadow-lg">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-200/30 via-emerald-100/50 to-cyan-100/40 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/20 via-transparent to-blue-300/20"></div>
              <div className="absolute top-8 left-12 w-16 h-16 bg-emerald-200/40 rounded-full blur-sm"></div>
              <div className="absolute bottom-12 right-8 w-20 h-20 bg-blue-200/40 rounded-full blur-sm"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-300/60 rounded-full"></div>
            </div>
          </div>
          {recordingState === 'recording' && (
            <div className="absolute inset-0 w-64 h-64 rounded-full border-4 border-emerald-400 animate-ping"></div>
          )}
        </div>

        {/* Content */}
        {getMainContent()}

        {/* Audio Visualization */}
        {(recordingState === 'recording' || recordingState === 'paused') && (
          <div className="w-full max-w-sm">
            <div className="flex items-end justify-center space-x-1 h-20">
              {audioData.map((value, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full transition-all duration-150 ease-out"
                  style={{
                    width: '6px',
                    height: `${Math.max(4, (value / 255) * 60)}px`,
                    opacity: recordingState === 'paused' ? 0.5 : 1
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="pb-8 pt-4">
        <div className="flex items-center justify-center space-x-12">
          
          {/* Pause/Resume Button */}
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <button
              onClick={recordingState === 'recording' ? pauseRecording : resumeRecording}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shadow-md"
            >
              {recordingState === 'recording' ? (
                <Pause className="w-5 h-5 text-gray-700" />
              ) : (
                <Play className="w-5 h-5 text-gray-700 ml-0.5" />
              )}
            </button>
          )}

          {/* Main Record Button */}
          <div className="text-center">
            <button
              onClick={recordingState === 'idle' ? startRecording : (recordingState === 'stopped' ? resetRecorder : null)}
              disabled={recordingState === 'uploading'}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                recordingState === 'idle' || recordingState === 'stopped' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-95' 
                  : 'bg-emerald-400 cursor-not-allowed'
              }`}
            >
              <div className={`w-6 h-6 rounded-full ${
                recordingState === 'idle' || recordingState === 'stopped' ? 'bg-white' : 'bg-white animate-pulse'
              }`} />
            </button>
            
            {/* Timer */}
            {(recordingState !== 'idle' && recordingState !== 'uploading') && (
              <div className="mt-2 text-emerald-600 font-mono text-lg font-semibold">
                {formatDuration(duration)}
              </div>
            )}
          </div>

          {/* Stop Button */}
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <button
              onClick={stopRecording}
              className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shadow-md"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          )}
        </div>

        {/* Bottom Status */}
        <div className="text-center mt-6">
          {recordingState === 'paused' && (
            <p className="text-gray-500 text-sm">Pausado</p>
          )}
          {recordingState === 'stopped' && (
            <p className="text-gray-500 text-sm">Listo</p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-100 border border-red-300 rounded-lg p-3">
          <p className="text-red-700 text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;