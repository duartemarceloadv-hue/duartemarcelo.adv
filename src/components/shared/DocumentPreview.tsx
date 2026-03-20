"use client";

import React from "react";
import { Printer } from "lucide-react";
import { format } from "date-fns";

interface DocumentPreviewProps {
  title: string;
  children: React.ReactNode;
  onPrint?: () => void;
}

export function DocumentPreview({
  title,
  children,
  onPrint,
}: DocumentPreviewProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-end mb-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Printer size={16} />
          Imprimir
        </button>
      </div>
      <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-wide">
                DR HAIR
              </h1>
              <p className="text-xs text-gray-500">Clínica Capilar</p>
            </div>
            <p className="text-sm text-gray-500">
              {format(new Date(), "dd/MM/yyyy")}
            </p>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-gray-800">{title}</h2>
        </div>

        {/* Content */}
        <div className="min-h-[200px]">{children}</div>
      </div>
    </div>
  );
}
