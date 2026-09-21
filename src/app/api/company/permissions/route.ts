import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { requireOwner } from "@/lib/permissions";
import { getCompanyAccessMatrix } from "@/lib/permissions";
import {
  CARGO_LEVELS,
  DEFAULT_FEATURE_PERMISSIONS,
  FEATURE_KEYS,
  type CargoLevel,
  type FeatureKey,
} from "@/config/permissions";
import { logAction } from "@/lib/audit";
import { parseBody } from "@/lib/validations/helpers";
import { companyPermissionsSchema } from "@/lib/validations/company";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const matrix = await getCompanyAccessMatrix(user.companyId);
  return NextResponse.json({ matrix, defaults: DEFAULT_FEATURE_PERMISSIONS });
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const denied = await requireOwner(user);
  if (denied) return denied;

  try {
    const parsed = await parseBody(request, companyPermissionsSchema);
    if ("error" in parsed) return parsed.error;
    const matrix = parsed.data.matrix;

    const levels = CARGO_LEVELS as readonly string[];

    for (const [level, features] of Object.entries(matrix)) {
      if (!levels.includes(level)) {
        return NextResponse.json({ error: `Nível "${level}" inválido.` }, { status: 400 });
      }
      for (const feature of Object.keys(features)) {
        if (!(FEATURE_KEYS as readonly string[]).includes(feature)) {
          return NextResponse.json({ error: `Funcionalidade "${feature}" inválida.` }, { status: 400 });
        }
        const value = features[feature];
        if (typeof value !== "boolean") {
          return NextResponse.json({ error: `Valor inválido para "${feature}".` }, { status: 400 });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      const companyId = user.companyId!;
      for (const [level, features] of Object.entries(matrix)) {
        const lvl = level as CargoLevel;
        for (const [feature, value] of Object.entries(features)) {
          const fk = feature as FeatureKey;
          const sameAsDefault = value === DEFAULT_FEATURE_PERMISSIONS[lvl][fk];
          if (sameAsDefault) {
            await tx.cargoPermission.deleteMany({
              where: { companyId, cargoLevel: lvl, feature: fk },
            });
          } else {
            await tx.cargoPermission.upsert({
              where: {
                companyId_cargoLevel_feature: {
                  companyId,
                  cargoLevel: lvl,
                  feature: fk,
                },
              },
              create: { companyId, cargoLevel: lvl, feature: fk, access: value },
              update: { access: value },
            });
          }
        }
      }
    });

    await logAction("update", "cargoPermission", user.companyId!, "Permissões por cargo atualizadas", user);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao guardar permissões." }, { status: 400 });
  }
}