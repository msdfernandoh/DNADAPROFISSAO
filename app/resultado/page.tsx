"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ResultPDF } from "@/components/dna/result-pdf";

function ResultadoContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    name: string;
    primaryProfile: string;
    secondaryProfile: string;
    percentages: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    const name = searchParams.get("name") || "Participante";
    const primary = searchParams.get("primary") || "B";
    const secondary = searchParams.get("secondary") || "A";
    const percentagesParam = searchParams.get("percentages");

    let percentages: Record<string, number> = { A: 20, B: 30, C: 15, D: 20, E: 15 };

    if (percentagesParam) {
      try {
        percentages = JSON.parse(decodeURIComponent(percentagesParam));
      } catch {
        // usa valores padrao
      }
    }

    setData({ name, primaryProfile: primary, secondaryProfile: secondary, percentages });
  }, [searchParams]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ResultPDF
      name={data.name}
      primaryProfile={data.primaryProfile}
      secondaryProfile={data.secondaryProfile}
      percentages={data.percentages}
    />
  );
}

export default function ResultadoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResultadoContent />
    </Suspense>
  );
}
