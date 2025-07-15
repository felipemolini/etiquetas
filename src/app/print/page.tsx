"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function getEtiquetasFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const data = window.localStorage.getItem("etiquetasParaImpressao");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export default function PrintEtiquetasPage() {
  const searchParams = useSearchParams();
  const formato = searchParams.get("formato") as "zebra" | "a4" | null;
  const [etiquetas, setEtiquetas] = useState<(any|null)[]>([]);

  // Força tema claro ao abrir o /print e garante background branco sempre
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.body.style.background = "#fff";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  useEffect(() => {
    setEtiquetas(getEtiquetasFromStorage());
  }, []);

  if (!formato) {
    return <div className="text-center mt-10 text-red-500">Selecione o formato de impressão!</div>;
  }

  return (
    <div className={formato === "a4" ? "p-0 print:p-0 bg-white" : "bg-white"}>
      {/* CSS de impressão embutido */}
      <style>
        {`
        @media screen, print {
          html, body {
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-muted, .bg-background, .bg-white {
            background: #fff !important;
          }
          .text-muted-foreground, .text-gray-400, .text-gray-600, .text-muted {
            color: #000 !important;
          }
          .border-muted, .border-gray-300, .border-gray-400 {
            border-color: #bbb !important;
          }
          .print\\:hidden { display: none !important; }
        }
        /* Zebra: 1 por página */
        @media screen, print {
          .etiqueta-zebra {
            width: 100mm;
            height: 150mm;
            margin: 0 auto 12mm auto;
            border: 1px solid #bbb;
            background: #fff;
            color: #000;
            font-family: sans-serif;
            font-size: 14pt;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            box-sizing: border-box;
            padding: 14mm 10mm;
          }
        }
        /* A4: 4 por página, 2x2 */
        @media screen, print {
          .etiquetas-a4-sheet {
            width: 210mm !important;
            height: 297mm !important;
            display: flex !important;
            flex-wrap: wrap !important;
            align-content: flex-start !important;
            margin: 0 !important;
            background: #fff !important;
            box-sizing: border-box !important;
          }
          .etiqueta-a4 {
            width: 105mm !important;
            height: 148.5mm !important;
            box-sizing: border-box !important;
            background: #fff !important;
            color: #000 !important;
            font-family: sans-serif !important;
            font-size: 12pt !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            border: 1px solid #bbb !important;
            padding: 10mm 7mm !important;
          }
          .etiqueta-a4.vaga {
            border: none !important;
            background: #fff !important;
          }
        }
        `}
      </style>

      {/* Zebra: 1 etiqueta por página */}
      {formato === "zebra" && (
        <div>
          <div className="flex flex-col items-center print:bg-white">
            {etiquetas.map((et, idx, arr) =>
              et ? (
                <div
                  key={idx}
                  className="etiqueta-zebra"
                  style={{
                    pageBreakAfter: idx < arr.length - 1 ? "always" : "auto"
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "22pt",
                      background: "#000",
                      color: "#fff",
                      padding: "2mm 4mm",
                      borderRadius: "6px",
                      display: "inline-block",
                      marginBottom: "6mm",
                      letterSpacing: "1px"
                    }}
                  >
                    Nota: {et.numeroNota}
                  </div>
                  <div className="font-bold text-base mb-1" style={{ fontSize: "15pt" }}>
                    {et.cliente.nome}
                  </div>
                  <div>
                    <span className="text-xs" style={{ fontSize: "10pt" }}>
                      CNPJ: {et.cliente.cpf_cnpj}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs" style={{ fontSize: "11pt", marginTop: "2mm" }}>
                    Palete {et.idxPalete} de {et.totalPaletes}
                  </div>
                  <div className="border-t border-black my-1" style={{ margin: "2mm 0" }}></div>
                  <ul className="text-xs mt-2" style={{ fontSize: "11pt" }}>
                    {et.produtos.map((prod: any) => (
                      <li key={prod.codigo}>
                        {prod.descricao} — <b>{prod.quantidade}</b> {prod.unidade}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                // vaga: espaço vazio (sem nada)
                <div
                  key={idx}
                  className="etiqueta-zebra"
                  style={{
                    border: "none",
                    background: "#fff",
                    pageBreakAfter: idx < arr.length - 1 ? "always" : "auto"
                  }}
                ></div>
              )
            )}
          </div>
        </div>
      )}

      {/* A4: 4 etiquetas por página (2x2, sem margens extras) */}
      {formato === "a4" && (
        <div>
          <div className="flex flex-col items-center print:bg-white">
            {Array.from({ length: Math.ceil(etiquetas.length / 4) }).map((_, i, arr) => (
              <div
                className="etiquetas-a4-sheet"
                key={i}
                style={{
                  width: "210mm",
                  height: "297mm",
                  display: "flex",
                  flexWrap: "wrap",
                  alignContent: "flex-start",
                  boxSizing: "border-box",
                  pageBreakAfter: i < arr.length - 1 ? "always" : "auto",
                  margin: 0,
                  background: "#fff"
                }}
              >
                {etiquetas.slice(i * 4, i * 4 + 4).map((et, idx) =>
                  et ? (
                    <div
                      key={idx}
                      className="etiqueta-a4"
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "20pt",
                          background: "#000",
                          color: "#fff",
                          padding: "2mm 4mm",
                          borderRadius: "5px",
                          display: "inline-block",
                          marginBottom: "4mm",
                          letterSpacing: "1px"
                        }}
                      >
                        Nota: {et.numeroNota}
                      </div>
                      <div className="font-bold text-base mb-1" style={{ fontSize: "14pt" }}>
                        {et.cliente.nome}
                      </div>
                      <div>
                        <span className="text-xs" style={{ fontSize: "10pt" }}>
                          CNPJ: {et.cliente.cpf_cnpj}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs" style={{ fontSize: "10pt", marginTop: "1mm" }}>
                        Palete {et.idxPalete} de {et.totalPaletes}
                      </div>
                      <div className="border-t border-black my-1" style={{ margin: "2mm 0" }}></div>
                      <ul className="text-xs mt-2" style={{ fontSize: "10pt" }}>
                        {et.produtos.map((prod: any) => (
                          <li key={prod.codigo}>
                            {prod.descricao} — <b>{prod.quantidade}</b> {prod.unidade}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    // VAGA: só espaço branco, sem borda, sem texto
                    <div
                      key={idx}
                      className="etiqueta-a4 vaga"
                      style={{
                        border: "none",
                        background: "#fff"
                      }}
                    ></div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão de imprimir */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-black text-white rounded-lg shadow-lg hover:bg-gray-800 text-lg"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
}
