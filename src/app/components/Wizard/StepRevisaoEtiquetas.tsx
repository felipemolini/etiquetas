"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface EtiquetaPalete {
  numeroNota: string;
  cliente: any;
  produtos: any[];
  idxPalete: number;
  totalPaletes: number;
}

interface StepRevisaoEtiquetasProps {
  etiquetas: EtiquetaPalete[];
  onBack: () => void;
  onImprimir: (formato: "zebra" | "a4", etiquetasFinal: (EtiquetaPalete|null)[]) => void;
}

export default function StepRevisaoEtiquetas({
  etiquetas,
  onBack,
  onImprimir,
}: StepRevisaoEtiquetasProps) {
  const [formato, setFormato] = useState<"zebra" | "a4">("zebra");
  const [pular, setPular] = useState(0);

  // Etiquetas para impressão considerando as posições puladas no A4
  const etiquetasComPulo = formato === "a4"
    ? [
        ...Array(pular).fill(null), // null para vaga vazia
        ...etiquetas
      ]
    : etiquetas;

  return (
    <div className="w-full max-w-3xl mx-auto bg-card p-4 md:p-6 rounded-xl shadow transition-colors">
      <h2 className="text-xl font-bold mb-4">Revisão das Etiquetas</h2>
      <div className="flex gap-2 mb-6">
        <Button variant={formato === "zebra" ? "default" : "outline"} onClick={() => setFormato("zebra")}>Zebra 100x150</Button>
        <Button variant={formato === "a4" ? "default" : "outline"} onClick={() => setFormato("a4")}>A4 - Laser</Button>
      </div>
      {formato === "a4" && (
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="pular" className="text-sm">
            Pular etiquetas iniciais (folha já usada):
          </label>
          <input
            id="pular"
            type="number"
            min={0}
            max={3}
            value={pular}
            onChange={e => setPular(Math.max(0, Math.min(3, Number(e.target.value))))}
            className="w-14 px-2 py-1 rounded border text-center font-semibold"
          />
          <span className="text-xs text-muted-foreground">{pular === 1 ? "1 etiqueta será pulada" : `${pular} etiquetas serão puladas`}</span>
        </div>
      )}
      <div className="space-y-4 max-h-[60vh] overflow-auto">
        {etiquetasComPulo.map((et, idx) =>
          et ? (
            <div key={idx} className="border rounded-lg p-3 bg-background shadow-sm print:border-0 print:p-0">
              <div className="font-semibold">
                Nota: {et.numeroNota} — Cliente: {et.cliente.nome}
              </div>
              <div className="text-xs text-muted-foreground">
                CNPJ: {et.cliente.cpf_cnpj}
              </div>
              <div className="mt-1 text-xs">
                <b>Palete {et.idxPalete} de {et.totalPaletes}</b>
              </div>
              <ul className="mt-2 text-sm">
                {et.produtos.map(prod => (
                  <li key={prod.codigo}>
                    <span className="font-medium">{prod.descricao}</span> — {prod.quantidade} {prod.unidade}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div
              key={idx}
              className="border-dashed border-2 border-muted rounded-lg p-3 bg-muted text-muted-foreground text-center print:border-0 print:bg-white"
            >
              (vaga)
            </div>
          )
        )}
      </div>
      <div className="flex gap-4 justify-end mt-8">
        <Button variant="secondary" onClick={onBack}>Voltar</Button>
        <Button onClick={() => onImprimir(formato, etiquetasComPulo)}>Imprimir</Button>
      </div>
    </div>
  );
}
