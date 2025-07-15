"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Undo2, Divide, XCircle } from "lucide-react";
import { useRef } from "react";

interface DistribuiVolumesTableProps {
  itens: any[];
  distrib: { [idProduto: string]: number[] };
  setDistrib: (idProduto: string, idx: number, valor: number) => void;
  paleteCount: number;
  onDistribuirIgual: (idProduto: string) => void;
  onLimparLinha: (idProduto: string) => void;
  onUndo: (idProduto: string) => void;
  erros: { [idProduto: string]: boolean };
  flash?: { [key: string]: boolean };
}

export default function DistribuiVolumesTable({
  itens,
  distrib,
  setDistrib,
  paleteCount,
  onDistribuirIgual,
  onLimparLinha,
  onUndo,
  erros,
  flash = {},
}: DistribuiVolumesTableProps) {
  // Soma por palete (total de volumes de todos os produtos em cada palete)
  const totaisPalete = Array.from({ length: paleteCount }, (_, pidx) =>
    itens.reduce(
      (acc: number, item: any) => acc + (distrib[item.item.id_produto][pidx] || 0),
      0
    )
  );

  // Para foco automático no próximo input (mantido caso queira ativar com Enter)
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // Handler: permite campo vazio, não força 0, limpa zeros à esquerda
  function handleInputString(idProduto: string, idx: number, valorStr: string, max: number) {
    // Aceita string vazia, ou limpa zeros à esquerda
    let valClean = valorStr.replace(/^0+(?=\d)/, "");
    if (valClean === "") {
      setDistrib(idProduto, idx, NaN); // Sinaliza input vazio
      return;
    }
    let valor = Number(valClean);
    const arr = distrib[idProduto];
    const distribuidoOutros = arr.reduce((acc, v, i) => acc + (i !== idx ? (isNaN(v) ? 0 : v) : 0), 0);
    const maxPerm = max - distribuidoOutros;
    if (valor > maxPerm) valor = maxPerm;
    if (valor < 0) valor = 0;
    setDistrib(idProduto, idx, valor);

    // Removido: foco automático ao digitar
    // Se quiser ativar foco no próximo campo ao pressionar Enter, veja onKeyDown no <Input>
  }

  return (
    <TooltipProvider>
      <div className="w-full px-0 sm:px-4 overflow-x-auto">
        <table className="min-w-full table-auto border mt-2 text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="px-2 py-1 border whitespace-nowrap">
                Produto
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 cursor-help text-xs text-muted-foreground">?</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>
                      Distribua manualmente os volumes de cada produto entre os paletes.
                      <br />Use as setas ou digite valores. Não é permitido passar do total da nota.
                    </div>
                  </TooltipContent>
                </Tooltip>
              </th>
              <th className="px-2 py-1 border">Total Nota</th>
              {[...Array(paleteCount)].map((_, idx) => (
                <th key={idx} className="px-2 py-1 border whitespace-nowrap">
                  Palete {idx + 1}
                  <br />
                  <span className="text-xs text-muted-foreground font-normal">
                    ({totaisPalete[idx] || 0} vols)
                  </span>
                </th>
              ))}
              <th className="px-2 py-1 border">Distribuído</th>
              <th className="px-2 py-1 border text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item: any, i) => {
              const id = item.item.id_produto;
              const quantidadeTotal = Number(item.item.quantidade);
              const arr = distrib[id];
              const soma = arr.reduce((acc: number, v: number) => acc + (isNaN(v) ? 0 : v), 0);
              const falta = quantidadeTotal - soma;
              inputRefs.current[id] = inputRefs.current[id] || [];
              return (
                <tr key={id} className={falta === 0 ? "" : "bg-yellow-50 dark:bg-yellow-900/10"}>
                  <td className="px-2 py-1 border max-w-[320px] whitespace-pre-wrap">{item.item.descricao}</td>
                  <td className="px-2 py-1 border text-center">{quantidadeTotal}</td>
                  {[...Array(paleteCount)].map((_, idx2) => {
                    const maxPerm = quantidadeTotal - arr.reduce((a, v, k) => a + (k !== idx2 ? (isNaN(v) ? 0 : v) : 0), 0);
                    const isErro = arr[idx2] > maxPerm;
                    const flashKey = `${item.item.id_produto}-${idx2}`;
                    // Valor do input como string (para permitir "" e evitar 0200)
                    const valorInput = isNaN(arr[idx2]) ? "" : arr[idx2]?.toString() ?? "";
                    return (
                      <td
                        key={idx2}
                        className={`
                          px-1 py-1 border
                          ${arr[idx2] === 0 ? "bg-gray-100 dark:bg-gray-800/80" : ""}
                          ${flash[`${item.item.id_produto}-${idx2}`] ? "animate-pulse bg-green-200 dark:bg-green-700" : ""}
                        `}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              type="number"
                              min={0}
                              max={maxPerm}
                              step={1}
                              value={valorInput}
                              className={`w-16 text-center ${isErro ? "border-red-500 ring-2 ring-red-300" : ""}`}
                              onChange={e =>
                                handleInputString(id, idx2, e.target.value, quantidadeTotal)
                              }
                              ref={el => (inputRefs.current[id][idx2] = el)}
                              inputMode="numeric"
                              aria-label={`Produto ${item.item.descricao}, palete ${idx2 + 1}`}
                              onBlur={e => {
                                // Ao sair do campo, se estiver vazio, vira 0
                                if (e.target.value === "") {
                                  setDistrib(id, idx2, 0);
                                }
                              }}
                              onKeyDown={e => {
                                // Se quiser ativar pulo ao pressionar Enter, descomente abaixo:
                                /*
                                if (e.key === "Enter") {
                                  if (inputRefs.current[id][idx2 + 1]) {
                                    inputRefs.current[id][idx2 + 1]?.focus();
                                  }
                                }
                                */
                              }}
                            />
                          </TooltipTrigger>
                          {isErro && (
                            <TooltipContent>
                              Limite excedido para esse palete! Máximo permitido: {maxPerm}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </td>
                    );
                  })}
                  <td className={`px-2 py-1 border text-center font-semibold ${soma === quantidadeTotal ? "text-green-600" : "text-red-600"}`}>
                    {soma}/{quantidadeTotal}
                  </td>
                  <td className="px-2 py-1 border flex gap-1 items-center justify-center min-w-[110px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDistribuirIgual(id)}
                          aria-label="Distribuir igual"
                        >
                          <Divide className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Distribuir igual entre os paletes</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onUndo(id)}
                          aria-label="Desfazer último ajuste"
                        >
                          <Undo2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Desfazer último ajuste</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onLimparLinha(id)}
                          aria-label="Limpar distribuição"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Limpar linha</TooltipContent>
                    </Tooltip>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Rodapé: totais dos paletes */}
          <tfoot>
            <tr className="font-bold bg-muted">
              <td className="px-2 py-1 border text-right" colSpan={2}>
                Totais dos paletes:
              </td>
              {totaisPalete.map((total, idx) => (
                <td key={idx} className="px-2 py-1 border text-center">
                  {total}
                </td>
              ))}
              <td className="px-2 py-1 border" colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </TooltipProvider>
  );
}
