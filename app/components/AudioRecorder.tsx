import React, { useState, useRef, useEffect } from 'react';
import { InfoIcon, Smartphone, X } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import RecordingControls from './RecordingControls';
import UploadProgress from './UploadProgress';
import TermsCheckbox from './TermsCheckbox';


const AudioRecorder = () => {
  const [recordingState, setRecordingState] = useState('idle');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isClient, setIsClient] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const [termsAccepted, setTermsAccepted] = useState(false);

  // Detectar si estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sistema de detección de dispositivo (solo en cliente)
  const getDeviceInfo = () => {
    if (!isClient || typeof navigator === 'undefined') {
      return {
        deviceType: 'Unknown',
        os: 'Unknown',
        browser: 'Unknown',
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        userAgent: 'Unknown',
        screen: { width: 0, height: 0, pixelRatio: 1 },
        viewport: { width: 0, height: 0 },
        capabilities: {
          mediaDevices: false,
          getUserMedia: false,
          audioContext: false,
          mediaRecorder: false
        },
        platform: 'Unknown',
        language: 'Unknown',
        cookieEnabled: false,
        onLine: false
      };
    }

    const ua = navigator.userAgent;
    console.log('User Agent completo:', ua);
    
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isWindows = /Windows|Win32|Win64/.test(ua);
    const isMac = /Mac|Macintosh/.test(ua) && !isIOS;
    const isLinux = /Linux/.test(ua) && !isAndroid;
    const isMobile = isIOS || isAndroid || /Mobile|Phone|Tablet/.test(ua);
    
    let deviceType = 'Desktop';
    let os = 'Unknown';
    
    if (isIOS) {
      deviceType = 'Mobile';
      if (/iPad/.test(ua)) {
        deviceType = 'Tablet';
        os = 'iPadOS';
      } else {
        os = 'iOS';
      }
      
      let version = ua.match(/(?:iPhone OS|CPU OS|OS) (\d+)[_.](\d+)(?:[_.](\d+))?/);
      if (!version) version = ua.match(/Version\/(\d+)\.(\d+)/);
      
      if (version) {
        os += ` ${version[1]}.${version[2]}`;
        if (version[3]) os += `.${version[3]}`;
      }
    } 
    else if (isAndroid) {
      deviceType = 'Mobile';
      if (/Tablet|Tab/.test(ua)) deviceType = 'Tablet';
      
      os = 'Android';
      const version = ua.match(/Android (\d+(?:\.\d+)?)/);
      if (version) os += ` ${version[1]}`;
    } 
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
    } 
    else if (isMac) {
      os = 'macOS';
      const version = ua.match(/Mac OS X (\d+)[_.](\d+)/);
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
    else if (isLinux) {
      os = 'Linux';
      if (/Ubuntu/.test(ua)) os += ' (Ubuntu)';
      else if (/Debian/.test(ua)) os += ' (Debian)';
      else if (/Fedora/.test(ua)) os += ' (Fedora)';
    }

    const browser = getBrowserInfo();
    
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
    
    return deviceInfo;
  };

  const getBrowserInfo = () => {
    if (!isClient || typeof navigator === 'undefined') {
      return 'Unknown Browser';
    }

    const ua = navigator.userAgent;
    
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
    
    return 'Unknown Browser';
  };

  // Sistema de logs
  const addLog = (level, message, data = null) => {
    if (!isClient) return;
    
    const deviceInfo = getDeviceInfo();
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      device: deviceInfo.os,
      browser: deviceInfo.browser,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown'
    };
    
    setLogs(prev => [logEntry, ...prev.slice(0, 49)]);
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
  };

  // Generar session ID único
  useEffect(() => {
    if (!isClient) return;
    
    if (!sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    
    const deviceInfo = getDeviceInfo();
    addLog('info', 'App iniciada', {
      device: deviceInfo,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }, [isClient]);

  // Efecto de limpieza
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!isClient) return;

    if (!termsAccepted) {
    setError('Debes aceptar los términos y condiciones para continuar');
    addLog('warning', 'Intento de grabar sin aceptar términos');
    return;
  }
    
    try {
      setError(null);
      addLog('info', 'Iniciando grabación');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Tu navegador no soporta grabación de audio o necesitas HTTPS';
        addLog('error', 'API no soportada', { mediaDevices: !!navigator.mediaDevices });
        setError(errorMsg);
        return;
      }

      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        const errorMsg = 'La grabación de audio requiere HTTPS para funcionar correctamente';
        addLog('error', 'Contexto inseguro', { protocol: location.protocol, hostname: location.hostname });
        setError(errorMsg);
        return;
      }
      
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
          sampleRate: 44100,
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
      
      if (!isIOS) {
        try {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          analyserRef.current.fftSize = 256;
        } catch (audioContextError) {
          console.warn('AudioContext no disponible, continuando sin visualización:', audioContextError);
        }
      }

      let options = {};
      
      if (isIOS) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        }
      } else {
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

      mediaRecorderRef.current.start(isIOS ? 1000 : 100);
      setRecordingState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error detallado:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Acceso al micrófono denegado. Ve a Configuración > Safari > Micrófono y permite el acceso.');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró micrófono. Verifica que tu dispositivo tenga micrófono.');
      } else if (err.name === 'NotReadableError') {
        setError('Micrófono en uso por otra aplicación. Cierra otras apps que usen audio.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Configuración de audio no compatible. Intentando configuración básica...');
        
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
      addLog('info', 'Grabación detenida', { finalDuration: duration });
    }
  };

  const resetRecorder = () => {
    setRecordingState('idle');
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadSpeed('');
    setShowSuccessModal(false);
    setUploadResult(null);
    audioChunksRef.current = [];
    addLog('info', 'Grabador reiniciado');
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addLog('success', 'URL copiada al portapapeles');
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      addLog('success', 'URL copiada al portapapeles (fallback)');
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;
    
    setRecordingState('uploading');
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSpeed('');
    
    addLog('info', 'Iniciando subida por chunks', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(audioBlob.size / chunkSize);
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `recording_${Date.now()}.${audioBlob.type.includes('wav') ? 'wav' : 'webm'}`;
    
    const startTime = Date.now();
    let uploadedBytes = 0;
    
    try {
      // Subir cada chunk
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, audioBlob.size);
        const chunk = audioBlob.slice(start, end);
        
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('uploadId', uploadId);
        formData.append('fileName', fileName);
        formData.append('mimeType', audioBlob.type);
        
        const chunkStartTime = Date.now();

        const response = await fetch('https://record-voice-api.kalmsystem.com/api/upload-chunk', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Error en chunk ${chunkIndex}: ${response.status} - ${errorData.message || 'Error desconocido'}`);
        }
        
        const responseData = await response.json();
        
        if (!responseData.success) {
          throw new Error(`Chunk ${chunkIndex} falló: ${responseData.message}`);
        }
        
        const chunkEndTime = Date.now();
        uploadedBytes += chunk.size;
        
        // Calcular velocidad de subida
        const timeElapsed = (chunkEndTime - startTime) / 1000; // segundos
        const speed = uploadedBytes / timeElapsed; // bytes por segundo
        const speedMBps = (speed / (1024 * 1024)).toFixed(1); // MB/s
        setUploadSpeed(`${speedMBps} MB/s`);
        
        // Actualizar progreso
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setUploadProgress(progress);
        
        addLog('info', `Chunk ${chunkIndex + 1}/${totalChunks} subido exitosamente`, {
          chunkSize: chunk.size,
          progress: progress,
          speed: speedMBps,
          uploadId: responseData.uploadId
        });
        
        // Pequeña pausa para no saturar el servidor
        if (chunkIndex < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Finalizar upload en el servidor
      addLog('info', 'Finalizando subida en el servidor', { uploadId, totalChunks });
      
      const completeResponse = await fetch('https://record-voice-api.kalmsystem.com/api/complete-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uploadId, 
          totalChunks, 
          fileName,
          mimeType: audioBlob.type,
          totalSize: audioBlob.size
        })
      });
      
      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => ({}));
        throw new Error(`Error al finalizar subida: ${completeResponse.status} - ${errorData.message || 'Error desconocido'}`);
      }
      
      const result = await completeResponse.json();
      console.log('resultttttttttt', result.url);
      
      
      if (!result.success) {
        throw new Error(`Error al finalizar subida: ${result.message}`);
      }
      
      addLog('success', 'Audio subido exitosamente por chunks', {
        uploadId,
        totalChunks,
        finalSize: audioBlob.size,
        result: result
      });
      
      // Pequeña pausa para mostrar 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mostrar modal de éxito
      setUploadResult({
        fileName,
        fileSize: (audioBlob.size / (1024 * 1024)).toFixed(2),
        totalChunks,
        url: result.url
      });
      setShowSuccessModal(true);
      
    } catch (err) {
      console.error('Error en subida por chunks:', err);
      addLog('error', 'Error al subir por chunks', {
        error: err.message,
        uploadId,
        uploadedChunks: Math.floor(uploadedBytes / chunkSize),
        totalChunks
      });
      setError(`Error al subir: ${err.message}`);
      setRecordingState('stopped');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSpeed('');
    }
  };

  const getMainContent = () => {
    if (recordingState === 'idle') {
      return (
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Listo para grabar</h2>
            <p className="text-gray-600 text-lg leading-relaxed px-4 max-w-md">
              Prepárate para capturar tu mensaje. 
              Presiona el micrófono cuando estés listo.
            </p>
          </div>
        </div>
      );
    }

    if (recordingState === 'uploading') {
      return (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">Procesando audio</h2>
            <p className="text-gray-600">Esto tomará unos segundos...</p>
          </div>
        </div>
      );
    }

    if (recordingState === 'stopped') {
      return (
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">¡Grabación completada!</h2>
            <p className="text-gray-600 text-lg">
              Tu audio está listo. Puedes reproducirlo o procesarlo ahora.
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                if (audioUrl) {
                  const audio = new Audio(audioUrl);
                  audio.play();
                }
              }}
              className="bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white text-gray-700 px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-lg font-medium"
            >
              Reproducir
            </button>
            <button
              onClick={uploadAudio}
              className="bg-gradient-to-r from-orange-500 via-orange-600 to-purple-600 hover:from-orange-400 hover:via-orange-500 hover:to-purple-500 text-white px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-lg font-medium"
            >
              Procesar Audio
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {recordingState === 'recording' ? 'Grabando tu mensaje' : 'Grabación en pausa'}
          </h2>
          <p className="text-gray-600">
            {recordingState === 'recording' 
              ? 'Habla claramente hacia el micrófono' 
              : 'Presiona play para continuar'
            }
          </p>
        </div>
      </div>
    );
  };

  // Si no estamos en el cliente, mostrar un loading básico
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500"></div>
          </div>
          <p className="text-gray-600">Cargando grabadora...</p>
        </div>
      </div>
    );
  }

return (
  <div 
    className="bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex flex-col overflow-hidden relative"
    style={{
      height: '100dvh', // Dynamic viewport height - mejor para iOS
      minHeight: '-webkit-fill-available', // Fallback para iOS Safari
    }}
  >

    {/* Main Content - Ajustado para iOS */}
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 min-h-0">
      
      {/* Logo Kalmsystem - Solo en estado idle */}
      {recordingState === 'idle' && (
        <div className="w-full h-24 px-6 mb-8 flex flex-col items-center">
          <div className="relative w-full max-w-sm mx-auto">
            <div className="w-full rounded-3xl flex items-center justify-center ">
              <img 
                src="/assets/KALM.png" 
                alt="Kalmsystem" 
                className="w-full h-18 object-contain z-10"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Central Art Piece - Responsivo */}
      <div className="relative mb-3">
        <div 
          className="rounded-full bg-gradient-to-br from-orange-100 to-purple-50 flex items-center justify-center shadow-xl border border-white/20"
          style={{
            width: 'min(40vw, 180px)',
            height: 'min(40vw, 180px)',
          }}
        >
          <div 
            className="rounded-full bg-gradient-to-br from-orange-200/40 via-purple-100/30 to-white/70 flex items-center justify-center relative overflow-hidden"
            style={{
              width: 'min(32vw, 144px)',
              height: 'min(32vw, 144px)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-300/20 via-purple-200/15 to-orange-200/30"></div>
            
            {/* Elementos flotantes - Escalados */}
            <div 
              className="absolute bg-orange-200/40 rounded-full blur-lg"
              style={{
                top: '15%',
                left: '20%',
                width: 'min(8vw, 36px)',
                height: 'min(8vw, 36px)',
              }}
            ></div>
            <div 
              className="absolute bg-purple-100/50 rounded-full blur-lg"
              style={{
                bottom: '20%',
                right: '15%',
                width: 'min(10vw, 45px)',
                height: 'min(10vw, 45px)',
              }}
            ></div>
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-orange-300/60 to-purple-300/40 rounded-full"
              style={{
                width: 'min(6vw, 28px)',
                height: 'min(6vw, 28px)',
              }}
            ></div>
            
            {/* Floating elements pequeños */}
            <div className="absolute top-3 right-3 w-2 h-2 bg-purple-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-orange-300/40 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
        {recordingState === 'recording' && (
          <>
            <div 
              className="absolute inset-0 rounded-full border-4 border-orange-400/60 animate-ping"
              style={{
                width: 'min(40vw, 180px)',
                height: 'min(40vw, 180px)',
              }}
            ></div>
            <div 
              className="absolute inset-0 rounded-full border-2 border-purple-300/40 animate-pulse"
              style={{
                width: 'min(40vw, 180px)',
                height: 'min(40vw, 180px)',
              }}
            ></div>
          </>
        )}
      </div>

      {/* Content - Más compacto para iOS */}
      <div className="text-center space-y-2 max-w-xs px-2 mb-3">
        {recordingState === 'idle' && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-800">Listo para grabar</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Presiona el micrófono cuando estés listo.
            </p>
          </div>
        )}

      {recordingState === 'uploading' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">Subiendo audio</h2>
            <p className="text-gray-600 text-xs">Enviando por chunks para mejor estabilidad...</p>
          </div>
          <UploadProgress 
            progress={uploadProgress}
            isVisible={isUploading}
            fileName={`recording_${Date.now()}.webm`}
            uploadSpeed={uploadSpeed}
          />
        </div>
      )}

        {recordingState === 'stopped' && (
          <div className="flex flex-col space-y-2 mt-8">
            <button
              onClick={() => {
                  if (audioUrl) {
                    const audio = new Audio(audioUrl);
                    audio.play();
                  }
                }}
                className="w-full bg-white/90 border border-gray-200 hover:bg-white text-gray-700 px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-md font-medium text-md"
              >
                ▶️ Reproducir
            </button>

            <button
              onClick={uploadAudio}
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-400 hover:to-purple-500 text-white px-4 py-2 mt-2 rounded-xl transition-all duration-300 hover:shadow-md font-medium text-md"
            >
              📤 Enviar Audio
            </button>
          </div>
        )}

        {(recordingState === 'recording' || recordingState === 'paused') && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-800">
              {recordingState === 'recording' ? '🎙️ Grabando' : '⏸️ Pausado'}
            </h2>
            <p className="text-gray-600 text-sm">
              {recordingState === 'recording' 
                ? 'Habla claramente' 
                : 'Presiona play para continuar'
              }
            </p>
          </div>
        )}
      </div>

      {/* Audio Visualization - Altura fija pequeña */}
      <div className="h-12 mb-2">
        <AudioVisualizer 
          isRecording={recordingState === 'recording' || recordingState === 'paused'}
          isPaused={recordingState === 'paused'}
        />
      </div>

      {/* Checkbox de términos */}
      <div className="text-center space-y-2 max-w-xs px-2 mb-3">
        {recordingState === 'idle' && (
          <div className="space-y-3">
            <TermsCheckbox 
              checked={termsAccepted}       
              onChange={setTermsAccepted}
            />
          </div>
        )}
      </div>
    </div>

    

    {/* Bottom Controls - Compacto para iOS */}
    <div className="pb-safe pb-4 flex-shrink-0">
      <RecordingControls
        recordingState={recordingState}
        duration={duration}
        onStartRecording={startRecording}
        onPauseRecording={pauseRecording}
        onResumeRecording={resumeRecording}
        onStopRecording={stopRecording}
        onResetRecorder={resetRecorder}
        disabled={!termsAccepted} 
      />
    </div>

    {/* Floating System Info Button - Más pequeño */}
    {/* <button
      onClick={() => setShowSystemInfo(!showSystemInfo)}
      className="fixed top-3 right-3 w-8 h-8 bg-gradient-to-br from-orange-500/90 to-purple-500/90 hover:from-orange-400 hover:to-purple-400 rounded-lg shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 border border-white/20 z-20"
      style={{ top: 'max(12px, env(safe-area-inset-top))' }}
    >
      <Smartphone className="w-3.5 h-3.5 text-white" />
    </button> */}

    {/* Panel de información del sistema */}
    {showSystemInfo && (
      <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-30 p-3">
        <div 
          className="bg-white/95 rounded-t-2xl w-full max-w-sm border-t border-orange-100"
          style={{
            maxHeight: '60vh',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
          }}
        >
          <div className="sticky top-0 bg-white/95 rounded-t-2xl border-b border-orange-100/50 p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-gray-800 text-sm">Sistema</h3>
            </div>
            <button
              onClick={() => setShowSystemInfo(false)}
              className="p-1 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="p-3 overflow-y-auto">
            <div className="space-y-2">
              <div className="bg-orange-50/50 rounded-lg p-2">
                <h4 className="font-semibold text-gray-800 mb-1 text-xs">User Agent</h4>
                <div className="text-xs font-mono text-gray-700 break-all leading-relaxed bg-white/50 p-2 rounded">
                  {isClient && typeof navigator !== 'undefined' ? navigator.userAgent : 'Loading...'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-blue-600 font-medium text-xs">Plataforma</div>
                  <div className="text-blue-800 font-mono text-xs mt-0.5">
                    {isClient && typeof navigator !== 'undefined' ? navigator.platform : 'Loading...'}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="text-green-600 font-medium text-xs">Idioma</div>
                  <div className="text-green-800 font-mono text-xs mt-0.5">
                    {isClient && typeof navigator !== 'undefined' ? navigator.language : 'Loading...'}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <div className="text-purple-600 font-medium text-xs">Pantalla</div>
                  <div className="text-purple-800 font-mono text-xs mt-0.5">
                    {isClient && typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'Loading...'}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                  <div className="text-orange-600 font-medium text-xs">Viewport</div>
                  <div className="text-orange-800 font-mono text-xs mt-0.5">
                    {isClient && typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Loading...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Error Toast - Posicionado para iOS */}
    {error && (
      <div 
        className="fixed left-3 right-3 bg-red-50 border border-red-200 rounded-lg p-2.5 max-w-sm mx-auto shadow-lg z-10"
        style={{
          bottom: 'max(16px, env(safe-area-inset-bottom) + 16px)'
        }}
      >
        <div className="flex items-start space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 mt-0.5"></div>
          <div className="flex-1">
            <p className="text-red-800 text-xs font-medium">{error}</p>
            {error.includes('Safari') && (
              <div className="mt-1 text-xs text-red-600 bg-red-100/50 rounded p-1.5">
                <p><strong>📱 Para iPhone:</strong></p>
                <p>Configuración → Safari → Micrófono → Permitir</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            className="p-0.5 hover:bg-red-100 rounded transition-colors"
          >
            <X className="w-3 h-3 text-red-600" />
          </button>
        </div>
      </div>
    )}

    {/* Modal de éxito */}
    {showSuccessModal && uploadResult && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm mx-auto shadow-2xl border border-orange-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-6 text-center relative">
            <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">¡Éxito!</h2>
            <p className="text-orange-100 text-sm">Audio procesado correctamente</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Info del archivo */}


            {/* URL con botón de copiar */}
            <div className="space-y-2">
              <label className="text-gray-600 text-sm font-medium">URL del archivo:</label>
              <div className="relative">
                <input
                  type="text"
                  value={uploadResult.url}
                  readOnly
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl pr-12 text-gray-700 font-mono"
                />
                <button
                  onClick={() => copyToClipboard(uploadResult.url)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-lg hover:from-orange-400 hover:to-purple-500 transition-all duration-200"
                  title="Copiar URL"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                resetRecorder();
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-400 hover:to-purple-500 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Grabar nuevo audio
            </button>
          </div>
        </div>
      </div>
    )}

    {/* CSS adicional para iOS */}
    <style jsx>{`
      @supports (-webkit-touch-callout: none) {
        /* Solo para iOS */
        .ios-height {
          height: -webkit-fill-available;
        }
      }
    `}</style>
  </div>
);
}
export default AudioRecorder;