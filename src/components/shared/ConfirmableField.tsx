"use client";

import React, { useState } from "react";
import { Check, Edit2 } from "lucide-react";

interface ConfirmableFieldProps {
  label: string;
  value: string;
  onConfirm: (newVal: string) => void;
  confirmed?: boolean;
}

export function ConfirmableField({
  label,
  value,
  onConfirm,
  confirmed = false,
}: ConfirmableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isConfirmed, setIsConfirmed] = useState(confirmed);

  const handleConfirm = () => {
    setEditing(false);
    setIsConfirmed(true);
    onConfirm(editValue);
  };

  const handleEdit = () => {
    setEditing(true);
    setIsConfirmed(false);
  };

  return (
    <div
      className={`rounded-md border p-3 ${
        isConfirmed
          ? "bg-green-50 border-green-300"
          : "bg-yellow-50 border-yellow-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-1">
          {isConfirmed && <Check size={16} className="text-green-600" />}
          {!editing && (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              title="Editar"
            >
              <Edit2 size={16} />
            </button>
          )}
          {editing && (
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded p-1 text-green-600 hover:bg-green-100"
              title="Confirmar"
            >
              <Check size={16} />
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
          }}
        />
      ) : (
        <p className="mt-1 text-sm text-gray-800">{editValue}</p>
      )}
    </div>
  );
}
