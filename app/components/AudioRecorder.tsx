import React, { useState, useRef, useEffect } from 'react';
import { Pause, Play, X, Info, Smartphone } from 'lucide-react';

const AudioRecorder = () => {
  const [recordingState, setRecordingState] = useState('idle'); // idle, recording, paused, stopped, uploading
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState(new Array(40).fill(0));
  const [error, setError] = useState(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  // Sistema de detección de dispositivo
  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    console.log('User Agent completo:', ua); // Para debugging
    
    // Detección más robusta
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isWindows = /Windows|Win32|Win64/.test(ua);
    const isMac = /Mac|Macintosh/.test(ua) && !isIOS;
    const isLinux = /Linux/.test(ua) && !isAndroid;
    const isMobile = isIOS || isAndroid || /Mobile|Phone|Tablet/.test(ua);
    
    let deviceType = 'Desktop';
    let os = 'Unknown';
    
    console.log('Flags de detección:', { isIOS, isAndroid, isWindows, isMac, isLinux });
    
    // Detección de iOS (incluyendo iPad que se reporta como macOS en nuevos Safari)
    if (isIOS) {
      deviceType = 'Mobile';
      if (/iPad/.test(ua)) {
        deviceType = 'Tablet';
        os = 'iPadOS';
      } else {
        os = 'iOS';
      }
      
      // Múltiples patrones para detectar versión de iOS
      let version = ua.match(/(?:iPhone OS|CPU OS|OS) (\d+)[_.](\d+)(?:[_.](\d+))?/);
      if (!version) version = ua.match(/Version\/(\d+)\.(\d+)/);
      
      console.log('Versión iOS encontrada:', version);
      
      if (version) {
        os += ` ${version[1]}.${version[2]}`;
        if (version[3]) os += `.${version[3]}`;
      }
    } 
    // Detección de Android
    else if (isAndroid) {
      deviceType = 'Mobile';
      if (/Tablet|Tab/.test(ua)) deviceType = 'Tablet';
      
      os = 'Android';
      const version = ua.match(/Android (\d+(?:\.\d+)?)/);
      console.log('Versión Android encontrada:', version);
      if (version) os += ` ${version[1]}`;
    } 
    // Detección de Windows
    else if (isWindows) {
      os = 'Windows';
      if (/Windows NT 10\.0/.test(ua)) {
        os += ' 10/11';
      } else if (/Windows NT 6\.3/.test(ua)) {
        os += ' 8.1';
      } else if (/Windows NT 6\.2/.test(ua)) {
        os += ' 8';
      } else if (/Windows NT 6\.1/.test(ua)) {
        os += ' 7';
      } else {
        const version = ua.match(/Windows NT (\d+\.\d+)/);
        if (version) os += ` NT ${version[1]}`;
      }
      console.log('Windows detectado:', os);
    } 
    // Detección de macOS
    else if (isMac) {
      os = 'macOS';
      const version = ua.match(/Mac OS X (\d+)[_.](\d+)/);
      console.log('macOS detectado, versión:', version);
      if (version) {
        const major = parseInt(version[1]);
        const minor = parseInt(version[2]);
        if (major === 10) {
          if (minor >= 15) os += ' Catalina+';
          else if (minor >= 14) os += ' Mojave';
          else if (minor >= 13) os += ' High Sierra';
          else os += ` 10.${minor}`;
        } else if (major >= 11) {
          os += ` ${major}`;
        }
      }
    } 
    // Detección de Linux
    else if (isLinux) {
      os = 'Linux';
      if (/Ubuntu/.test(ua)) os += ' (Ubuntu)';
      else if (/Debian/.test(ua)) os += ' (Debian)';
      else if (/Fedora/.test(ua)) os += ' (Fedora)';
      console.log('Linux detectado:', os);
    }

    console.log('OS final detectado:', os);
    const browser = getBrowserInfo();
    console.log('Browser detectado:', browser);
    
    const deviceInfo = {
      deviceType,
      os,
      browser,
      isMobile,
      isIOS,
      isAndroid,
      userAgent: ua,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      capabilities: {
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        audioContext: !!(window.AudioContext || window.webkitAudioContext),
        mediaRecorder: !!window.MediaRecorder
      },
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
    
    console.log('Device info completo:', deviceInfo);
    return deviceInfo;
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    
    // Detección más precisa de navegadores
    if (/CriOS\//.test(ua)) {
      const version = ua.match(/CriOS\/(\d+)/);
      return `Chrome iOS ${version ? version[1] : 'Unknown'}`;
    } else if (/FxiOS\//.test(ua)) {
      const version = ua.match(/FxiOS\/(\d+)/);
      return `Firefox iOS ${version ? version[1] : 'Unknown'}`;
    } else if (/EdgiOS\//.test(ua)) {
      const version = ua.match(/EdgiOS\/(\d+)/);
      return `Edge iOS ${version ? version[1] : 'Unknown'}`;
    } else if (/Edg\//.test(ua)) {
      const version = ua.match(/Edg\/(\d+)/);
      return `Edge ${version ? version[1] : 'Unknown'}`;
    } else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
      const version = ua.match(/Chrome\/(\d+)/);
      return `Chrome ${version ? version[1] : 'Unknown'}`;
    } else if (/Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/CriOS\//.test(ua)) {
      const version = ua.match(/Version\/(\d+)/);
      return `Safari ${version ? version[1] : 'Unknown'}`;
    } else if (/Firefox\//.test(ua)) {
      const version = ua.match(/Firefox\/(\d+)/);
      return `Firefox ${version ? version[1] : 'Unknown'}`;
    } else if (/Opera|OPR\//.test(ua)) {
      const version = ua.match(/(?:Opera|OPR\/)\/(\d+)/);
      return `Opera ${version ? version[1] : 'Unknown'}`;
    } else if (/Samsung/.test(ua)) {
      return 'Samsung Internet';
    } else if (/UCBrowser/.test(ua)) {
      return 'UC Browser';
    }
    
    console.log('Browser no detectado para UA:', ua);
    return `Unknown Browser`;
  };

  // Sistema de logs
  const addLog = (level, message, data = null) => {
    const deviceInfo = getDeviceInfo();
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level, // 'info', 'error', 'warn', 'success'
      message,
      data,
      device: deviceInfo.os,
      browser: deviceInfo.browser,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown'
    };
    
    setLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Mantener máximo 50 logs
    
    // También log a consola para debugging
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    
    // Aquí podrías enviar a tu servidor de analytics
    // sendToAnalytics(logEntry);
  };

  // Generar session ID único
  useEffect(() => {
    if (!sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    
    const deviceInfo = getDeviceInfo();
    addLog('info', 'App iniciada', {
      device: deviceInfo,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }, []);

  const getSystemInfo = () => {
    const deviceInfo = getDeviceInfo();
    
    return {
      session: sessionStorage.getItem('sessionId'),
      device: deviceInfo,
      recording: {
        state: recordingState,
        duration: duration,
        hasAudioBlob: !!audioBlob,
        mimeType: mediaRecorderRef.current?.mimeType || 'N/A'
      },
      audio: {
        supportedFormats: [
          'audio/wav',
          'audio/webm',
          'audio/webm;codecs=opus',
          'audio/mp4'
        ].filter(format => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(format)),
        context: audioContextRef.current ? {
          state: audioContextRef.current.state,
          sampleRate: audioContextRef.current.sampleRate
        } : 'No disponible'
      },
      permissions: {
        https: location.protocol === 'https:',
        localhost: ['localhost', '127.0.0.1'].includes(location.hostname)
      },
      errors: logs.filter(log => log.level === 'error').length,
      totalLogs: logs.length
    };
  };

  // Efecto de limpieza
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

  // Efecto para forzar animación de barras cuando está grabando
  useEffect(() => {
    let intervalId;
    
    if (recordingState === 'recording') {
      let frameCount = 0;
      
      intervalId = setInterval(() => {
        frameCount++;
        const newAudioData = [];
        
        for (let i = 0; i < 40; i++) {
          // Ondas que realmente se ven moverse
          const wave1 = Math.sin((frameCount * 0.2) + (i * 0.4)) * 40;
          const wave2 = Math.sin((frameCount * 0.1) + (i * 0.2)) * 20; 
          const spike = Math.random() > 0.95 ? Math.random() * 50 : 0;
          
          // Altura entre 30 y 100 pixels
          const height = Math.max(30, Math.min(100, 60 + wave1 + wave2 + spike));
          newAudioData.push(height);
        }
        
        setAudioData(newAudioData);
      }, 100); // Cada 100ms
      
      addLog('info', 'Animación forzada iniciada');
    } else {
      // Resetear a barras pequeñas cuando no está grabando
      setAudioData(new Array(40).fill(10));
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [recordingState]); // Se ejecuta cada vez que cambia el estado de grabación

  const startRecording = async () => {
    try {
      setError(null);
      addLog('info', 'Iniciando grabación');
      
      // Validar soporte de la API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Tu navegador no soporta grabación de audio o necesitas HTTPS';
        addLog('error', 'API no soportada', { mediaDevices: !!navigator.mediaDevices });
        setError(errorMsg);
        return;
      }

      // Validar contexto seguro
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        const errorMsg = 'La grabación de audio requiere HTTPS para funcionar correctamente';
        addLog('error', 'Contexto inseguro', { protocol: location.protocol, hostname: location.hostname });
        setError(errorMsg);
        return;
      }
      
      // Configuración más simple para iOS Safari
      const deviceInfo = getDeviceInfo();
      const isIOS = deviceInfo.isIOS;
      
      addLog('info', 'Dispositivo detectado', { 
        os: deviceInfo.os, 
        browser: deviceInfo.browser,
        isIOS,
        capabilities: deviceInfo.capabilities 
      });
      
      const audioConstraints = isIOS ? {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100, // Más compatible con iOS
        }
      } : {
        audio: {
          sampleRate: 48000,
          channelCount: 2,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleSize: 16
        }
      };
      
      addLog('info', 'Solicitando permisos de micrófono', audioConstraints);
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      addLog('success', 'Acceso al micrófono concedido', { 
        tracks: stream.getTracks().length,
        trackSettings: stream.getTracks().map(track => track.getSettings())
      });

      streamRef.current = stream;
      
      // Setup audio visualization con verificación iOS
      if (!isIOS) {
        try {
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
          updateAudioData();
        } catch (audioContextError) {
          console.warn('AudioContext no disponible, continuando sin visualización:', audioContextError);
        }
      }

      // MediaRecorder con mejor compatibilidad iOS
      let options = {};
      
      if (isIOS) {
        // iOS Safari prefiere estos formatos
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        }
      } else {
        // Android/Desktop - mejor calidad
        if (MediaRecorder.isTypeSupported('audio/wav')) {
          options = { mimeType: 'audio/wav', bitsPerSecond: 128000 };
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus', bitsPerSecond: 128000 };
        }
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

      mediaRecorderRef.current.start(isIOS ? 1000 : 100); // iOS prefiere chunks más grandes
      setRecordingState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error detallado:', err);
      
      // Mensajes de error específicos para iOS
      if (err.name === 'NotAllowedError') {
        setError('Acceso al micrófono denegado. Ve a Configuración > Safari > Micrófono y permite el acceso.');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró micrófono. Verifica que tu dispositivo tenga micrófono.');
      } else if (err.name === 'NotReadableError') {
        setError('Micrófono en uso por otra aplicación. Cierra otras apps que usen audio.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Configuración de audio no compatible. Intentando configuración básica...');
        
        // Fallback con configuración mínima
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = basicStream;
          
          const basicRecorder = new MediaRecorder(basicStream);
          mediaRecorderRef.current = basicRecorder;
          audioChunksRef.current = [];

          basicRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          basicRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: basicRecorder.mimeType 
            });
            setAudioBlob(audioBlob);
            setAudioUrl(URL.createObjectURL(audioBlob));
            setRecordingState('stopped');
          };

          basicRecorder.start(1000);
          setRecordingState('recording');
          setDuration(0);
          setError(null);

          timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
          }, 1000);

        } catch (fallbackErr) {
          setError('Error al inicializar grabación básica. Reinicia Safari e intenta nuevamente.');
        }
      } else {
        setError(`Error de micrófono: ${err.message || 'Desconocido'}. Intenta recargar la página.`);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      addLog('info', 'Grabación pausada', { duration });
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      addLog('info', 'Grabación reanudada', { duration });
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
      addLog('info', 'Grabación detenida', { finalDuration: duration });
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
    addLog('info', 'Grabador reiniciado');
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;
    
    setRecordingState('uploading');
    addLog('info', 'Iniciando subida de audio', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording_${Date.now()}.${audioBlob.type.includes('wav') ? 'wav' : 'webm'}`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addLog('success', 'Audio procesado exitosamente', {
        size: audioBlob.size,
        duration: duration
      });
      alert('Audio procesado exitosamente!');
      resetRecorder();
    } catch (err) {
      addLog('error', 'Error al procesar audio', err.message);
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
            <div className="flex items-end justify-center space-x-1.5 h-32">
              {audioData.map((height, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full transition-all duration-100 ease-out"
                  style={{
                    width: '8px',
                    height: `${height}px`, // Usar directamente el valor del array
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

      {/* Botón flotante de información del sistema */}
      <button
        onClick={() => setShowSystemInfo(!showSystemInfo)}
        className="fixed top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 z-20"
        title="Información del sistema"
      >
        <Smartphone className="w-4 h-4 text-gray-600" />
      </button>

      {/* Panel de información del sistema */}
      {showSystemInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-30 p-4">
          <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            {/* Header del panel */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Información del Sistema</h3>
              </div>
              <button
                onClick={() => setShowSystemInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Contenido del panel */}
            <div className="p-4">
              {/* Solo User Agent */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">User Agent</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs font-mono text-gray-700 break-all leading-relaxed">
                    {navigator.userAgent}
                  </div>
                </div>
                
                {/* Info adicional básica */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="text-blue-600 font-medium">Plataforma</div>
                    <div className="text-blue-800 font-mono">{navigator.platform}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <div className="text-green-600 font-medium">Idioma</div>
                    <div className="text-green-800 font-mono">{navigator.language}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2">
                    <div className="text-purple-600 font-medium">Pantalla</div>
                    <div className="text-purple-800 font-mono">{window.screen.width}x{window.screen.height}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2">
                    <div className="text-orange-600 font-medium">Viewport</div>
                    <div className="text-orange-800 font-mono">{window.innerWidth}x{window.innerHeight}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-100 border border-red-300 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-700 text-sm text-center font-medium">{error}</p>
          {error.includes('Safari') && (
            <div className="mt-2 text-xs text-red-600">
              <p>📱 <strong>Para iPhone:</strong></p>
              <p>Configuración → Safari → Cámara y micrófono → Permitir</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;