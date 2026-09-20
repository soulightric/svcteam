import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { KATEGORI_LIST } from "@/lib/constants";

const TIER_BY_RANK = ["S", "A", "A", "B", "B", "C", "C", "C"] as const;

export async function GET() {
  try {
    const [total, grouped] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.groupBy({
        by: ["kategori"],
        _count: { _all: true },
      }),
    ]);

    const counts = new Map(
      grouped.map((item) => [item.kategori, item._count._all])
    );

    const categories = KATEGORI_LIST.map((category, index) => ({
      value: category.value,
      label: category.label,
      color: category.color,
      count: counts.get(category.value) ?? 0,
      percentage: total > 0 ? Math.round(((counts.get(category.value) ?? 0) / total) * 100) : 0,
      rank: 0,
      tier: "C" as (typeof TIER_BY_RANK)[number],
      sourceIndex: index,
    }))
      .sort((a, b) => b.count - a.count || a.sourceIndex - b.sourceIndex)
      .map((category, index) => ({
        ...category,
        rank: index + 1,
        tier: TIER_BY_RANK[index] ?? "C",
      }))
      .map(({ sourceIndex: _sourceIndex, ...category }) => category);

    return NextResponse.json(
      {
        total,
        categories,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/top:", error);
    return NextResponse.json({ error: "Gagal mengambil peringkat aduan" }, { status: 500 });
  }
}
