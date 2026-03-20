"use client";

import React from "react";
import { Check } from "lucide-react";

interface ExtraField {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

interface ChecklistItemProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  extraFields?: ExtraField[];
}

export function ChecklistItem({
  label,
  checked,
  onChange,
  extraFields,
}: ChecklistItemProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => onChange(!checked)}
          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors cursor-pointer ${
            checked
              ? "bg-green-600 border-green-600"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          {checked && <Check size={14} className="text-white" />}
        </div>
        <span
          className={`text-sm ${
            checked ? "text-gray-500 line-through" : "text-gray-800"
          }`}
        >
          {label}
        </span>
      </label>

      {extraFields && extraFields.length > 0 && (
        <div className="flex items-center gap-2 ml-2">
          {extraFields.map((field) => (
            <div key={field.label} className="flex items-center gap-1">
              <span className="text-xs text-gray-500">{field.label}:</span>
              <input
                type="text"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-24 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={field.label}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
