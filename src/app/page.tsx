"use client";
import { useState } from "react";
import StepBuscaNota from "./components/Wizard/StepBuscaNota";
import StepOrganizaPaletes from "./components/Wizard/StepOrganizaPaletes";
import StepRevisaoEtiquetas from "./components/Wizard/StepRevisaoEtiquetas";

export default function Home() {
  const [step, setStep] = useState(0);
  const [notas, setNotas] = useState<any[]>([]);
  const [etiquetas, setEtiquetas] = useState<any[]>([]);

  function handleStep1Next(dadosNotas: any[]) {
    setNotas(dadosNotas);
    setStep(1);
  }

  function handleStep2Next(etiquetasGeradas: any[]) {
    setEtiquetas(etiquetasGeradas);
    setStep(2);
  }

  // Agora Step 3 aceita (formato, etiquetasFinal)
  function handleImprimir(formato: "zebra" | "a4", etiquetasFinal: any[]) {
    window.localStorage.setItem("etiquetasParaImpressao", JSON.stringify(etiquetasFinal));
    window.open(`/print?formato=${formato}`, "_blank");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {step === 0 && (
        <StepBuscaNota
          onNext={handleStep1Next}
        />
      )}
      {step === 1 && (
        <StepOrganizaPaletes
          notas={notas}
          onBack={() => setStep(0)}
          onNext={handleStep2Next}
        />
      )}
      {step === 2 && (
        <StepRevisaoEtiquetas
          etiquetas={etiquetas}
          onBack={() => setStep(1)}
          onImprimir={handleImprimir}
        />
      )}
    </main>
  );
}
