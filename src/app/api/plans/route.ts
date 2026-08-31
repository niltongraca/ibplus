import { NextResponse } from "next/server";
import { PLAN_LIST } from "@/config/plans";

export async function GET() {
  return NextResponse.json({ plans: PLAN_LIST });
}
