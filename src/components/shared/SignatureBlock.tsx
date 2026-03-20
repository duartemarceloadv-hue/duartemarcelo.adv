"use client";

import React from "react";
import { format } from "date-fns";

interface Signatario {
  cargo: string;
  nome?: string;
  registro?: string;
}

interface SignatureBlockProps {
  signatarios?: Signatario[];
  data?: string;
}

const DEFAULT_SIGNATARIOS: Signatario[] = [
  { cargo: "Paciente", nome: "", registro: "CPF:" },
  { cargo: "Biomédica", nome: "", registro: "CRBM:" },
  {
    cargo: "Prescritora",
    nome: "Dra. Maria Eugênia R. Beirão",
    registro: "CRBM/5 9078",
  },
];

export function SignatureBlock({
  signatarios = DEFAULT_SIGNATARIOS,
  data,
}: SignatureBlockProps) {
  const displayDate = data || format(new Date(), "dd/MM/yyyy");

  return (
    <div className="w-full mt-8">
      <p className="text-sm text-gray-600 mb-8 text-center">
        Data: {displayDate}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {signatarios.map((sig) => (
          <div key={sig.cargo} className="flex flex-col items-center text-center">
            <div className="w-full border-b border-gray-800 mb-2" />
            <p className="text-sm font-medium text-gray-800">
              {sig.nome || `(${sig.cargo})`}
            </p>
            <p className="text-xs text-gray-500">{sig.cargo}</p>
            {sig.registro && (
              <p className="text-xs text-gray-500">{sig.registro}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
