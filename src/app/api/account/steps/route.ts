import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAccountSteps } from "@/lib/accountSteps";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const result = await getAccountSteps(user.id, user.accountType);
  return NextResponse.json(result);
}