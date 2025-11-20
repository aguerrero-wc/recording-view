// app/routes/recorder.tsx
import AudioRecorder from "~/components/AudioRecorder";

export function meta() {
  return [
    { title: "Qtal" },
    { name: "description", content: "Graba audio" },
  ];
}

export default function RecorderPage() {
  return <AudioRecorder />;
}