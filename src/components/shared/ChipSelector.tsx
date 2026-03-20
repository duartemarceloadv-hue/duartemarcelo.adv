"use client";

import React, { useState } from "react";

interface ChipSelectorProps {
  label: string;
  options: string[];
  value: string | string[];
  onChange: (val: string | string[]) => void;
  multi?: boolean;
  allowOther?: boolean;
  otherLabel?: string;
}

export function ChipSelector({
  label,
  options,
  value,
  onChange,
  multi = false,
  allowOther = false,
  otherLabel = "Outro",
}: ChipSelectorProps) {
  const [otherText, setOtherText] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const isSelected = (option: string) => selectedValues.includes(option);

  const handleChipClick = (option: string) => {
    if (multi) {
      const current = [...selectedValues];
      const idx = current.indexOf(option);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(option);
      }
      onChange(current);
    } else {
      onChange(option === value ? "" : option);
    }
  };

  const handleOtherClick = () => {
    if (showOtherInput) {
      setShowOtherInput(false);
      // Remove "other" values from selection
      if (multi) {
        const filtered = selectedValues.filter((v) => options.includes(v));
        onChange(filtered);
      } else {
        if (!options.includes(value as string)) {
          onChange("");
        }
      }
      setOtherText("");
    } else {
      setShowOtherInput(true);
    }
  };

  const handleOtherTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setOtherText(text);
    if (text) {
      if (multi) {
        const filtered = selectedValues.filter((v) => options.includes(v));
        onChange([...filtered, text]);
      } else {
        onChange(text);
      }
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleChipClick(option)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
              isSelected(option)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
            }`}
          >
            {option}
          </button>
        ))}
        {allowOther && (
          <button
            type="button"
            onClick={handleOtherClick}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
              showOtherInput
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
            }`}
          >
            {otherLabel}
          </button>
        )}
      </div>
      {showOtherInput && (
        <input
          type="text"
          value={otherText}
          onChange={handleOtherTextChange}
          placeholder={`Especifique ${otherLabel.toLowerCase()}...`}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      )}
    </div>
  );
}
