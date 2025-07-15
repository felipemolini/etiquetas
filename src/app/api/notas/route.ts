import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const PRIMARY_TOKEN = process.env.TINY_API_TOKEN || "";
const SECONDARY_TOKEN = process.env.TINY_API_TOKEN2 || "";

async function buscarNota(numero: string, token: string) {
  const pesquisa = await axios.post(
    "https://api.tiny.com.br/api2/notas.fiscais.pesquisa.php",
    new URLSearchParams({
      token,
      numero,
      formato: "json",
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return pesquisa.data.retorno;
}

async function buscarDetalhesNota(id: string, token: string) {
  const detalhes = await axios.post(
    "https://api.tiny.com.br/api2/nota.fiscal.obter.php",
    new URLSearchParams({
      token,
      id,
      formato: "json",
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return detalhes.data.retorno.nota_fiscal;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const numeroNota = url.searchParams.get("numero");

  if (!numeroNota) {
    return NextResponse.json(
      { error: "Informe o número da nota." },
      { status: 400 }
    );
  }

  const notas = numeroNota.split(",").map((n) => n.trim());

  const results = await Promise.all(
    notas.map(async (numero) => {
      try {
        // 1. Tenta na API 1 (token principal)
        let retornoPesquisa = await buscarNota(numero, PRIMARY_TOKEN);

        if (
          retornoPesquisa.status === "OK" &&
          retornoPesquisa.notas_fiscais &&
          retornoPesquisa.notas_fiscais.length > 0
        ) {
          const id = retornoPesquisa.notas_fiscais[0].nota_fiscal.id;
          const detalhes = await buscarDetalhesNota(id, PRIMARY_TOKEN);
          return { numero, detalhes };
        }

        // 2. Se não achou, tenta na API 2 (token secundário)
        retornoPesquisa = await buscarNota(numero, SECONDARY_TOKEN);

        if (
          retornoPesquisa.status === "OK" &&
          retornoPesquisa.notas_fiscais &&
          retornoPesquisa.notas_fiscais.length > 0
        ) {
          const id = retornoPesquisa.notas_fiscais[0].nota_fiscal.id;
          const detalhes = await buscarDetalhesNota(id, SECONDARY_TOKEN);
          return { numero, detalhes };
        }

        // Não achou em nenhuma
        return { numero, erro: retornoPesquisa.erros || "Nota não encontrada." };
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido.";
        return { numero, erro: errorMessage };
      }
    })
  );

  return NextResponse.json({ resultados: results });
}
