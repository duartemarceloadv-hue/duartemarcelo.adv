"use client";

import React from "react";
import { ChipSelector } from "@/components/shared/ChipSelector";

interface AutoTextOption {
  value: string;
  label: string;
  autoText: string;
}

interface AutoTextQuestionProps {
  question: string;
  options: AutoTextOption[];
  value?: string;
  onChange: (val: string) => void;
  observacao?: string;
  onObservacaoChange?: (val: string) => void;
  generatedText?: string;
}

export function AutoTextQuestion({
  question,
  options,
  value = "",
  onChange,
  observacao,
  onObservacaoChange,
  generatedText,
}: AutoTextQuestionProps) {
  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = generatedText || selectedOption?.autoText || "";

  return (
    <div className="w-full space-y-3">
      <ChipSelector
        label={question}
        options={options.map((opt) => opt.label)}
        value={selectedOption?.label || ""}
        onChange={(selected) => {
          const label = Array.isArray(selected) ? selected[0] : selected;
          const opt = options.find((o) => o.label === label);
          onChange(opt?.value || "");
        }}
      />

      {displayText && (
        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Texto clínico gerado:</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{displayText}</p>
        </div>
      )}

      {onObservacaoChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observação
          </label>
          <textarea
            value={observacao || ""}
            onChange={(e) => onObservacaoChange(e.target.value)}
            placeholder="Observações adicionais..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
          />
        </div>
      )}
    </div>
  );
}
