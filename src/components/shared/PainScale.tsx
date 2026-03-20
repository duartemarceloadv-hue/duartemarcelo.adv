"use client";

import React from "react";

interface PainScaleProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
}

function getPainColor(n: number): string {
  if (n <= 2) return "bg-green-500";
  if (n <= 4) return "bg-yellow-400";
  if (n <= 6) return "bg-orange-500";
  if (n <= 8) return "bg-red-500";
  return "bg-red-800";
}

function getPainTextColor(n: number): string {
  if (n <= 2) return "text-white";
  if (n <= 4) return "text-gray-900";
  return "text-white";
}

function getPainDescription(n: number): string {
  if (n === 0) return "Sem dor";
  if (n <= 3) return "Dor leve";
  if (n <= 6) return "Dor moderada";
  if (n <= 9) return "Dor intensa";
  return "Pior dor possível";
}

export function PainScale({ value, onChange, label = "Escala de Dor" }: PainScaleProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 w-10 rounded-lg text-sm font-bold transition-all ${getPainColor(n)} ${getPainTextColor(n)} ${
              value === n
                ? "ring-3 ring-offset-2 ring-blue-600 scale-110"
                : "opacity-80 hover:opacity-100"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-gray-600">
        <span className="font-medium">{value}</span> — {getPainDescription(value)}
      </p>
    </div>
  );
}
