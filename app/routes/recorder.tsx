// app/routes/recorder.tsx
import AudioRecorder from "~/components/AudioRecorder";

export function meta() {
  return [
    { title: "Audio Recorder" },
    { name: "description", content: "Graba audio con calidad profesional" },
  ];
}

export default function RecorderPage() {
  return <AudioRecorder />;
}