"use client";

import React, { useRef } from "react";
import { Camera, Check } from "lucide-react";

interface FotoData {
  url: string;
  conforme: boolean;
}

interface PhotoCaptureProps {
  angulos?: string[];
  fotos: Record<string, FotoData>;
  onFotoUpload: (angulo: string, file: File) => void;
  onConforme: (angulo: string, conforme: boolean) => void;
}

const DEFAULT_ANGULOS = [
  "Frontal",
  "Topo (Vertex)",
  "Lateral Direita",
  "Lateral Esquerda",
  "Posterior",
  "Topo Posterior",
  "Close Área Tratada",
];

function PhotoSlot({
  angulo,
  foto,
  onUpload,
  onConforme,
}: {
  angulo: string;
  foto?: FotoData;
  onUpload: (file: File) => void;
  onConforme: (conforme: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-medium text-gray-600 mb-1 text-center">{angulo}</p>
      {foto ? (
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto.url}
            alt={angulo}
            className="w-full h-full object-cover"
          />
          <label className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={foto.conforme}
              onChange={(e) => onConforme(e.target.checked)}
              className="rounded"
            />
            <span>Conforme</span>
            {foto.conforme && <Check size={12} className="text-green-600" />}
          </label>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <Camera size={24} />
          <span className="text-xs">Upload</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

export function PhotoCapture({
  angulos = DEFAULT_ANGULOS,
  fotos,
  onFotoUpload,
  onConforme,
}: PhotoCaptureProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Registro Fotográfico
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {angulos.map((angulo) => (
          <PhotoSlot
            key={angulo}
            angulo={angulo}
            foto={fotos[angulo]}
            onUpload={(file) => onFotoUpload(angulo, file)}
            onConforme={(conforme) => onConforme(angulo, conforme)}
          />
        ))}
      </div>
    </div>
  );
}
