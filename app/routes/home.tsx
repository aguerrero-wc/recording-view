// app/routes/home.tsx (o donde tengas tu página principal)
import { Link } from "react-router";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold text-gray-800">
          Audio Recorder App
        </h1>
        <Link 
          to="/recorder"
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 inline-block"
        >
          Comenzar Grabación
        </Link>
      </div>
    </div>
  );
}