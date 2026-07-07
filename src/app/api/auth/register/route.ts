import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

const accountTypeEnum = z.enum(["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"]);

const baseSchema = z.object({
  accountType: accountTypeEnum,
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  telefone: z.string().optional(),
  nome: z.string().min(1, "O nome é obrigatório"),
});

const empresaSchema = baseSchema.extend({
  accountType: z.literal("EMPRESA"),
  nomeEmpresa: z.string().min(1, "Nome da empresa é obrigatório"),
  nif: z.string().optional(),
  registoComercial: z.string().optional(),
  anoFundacao: z.string().optional(),
  numColaboradores: z.string().optional(),
  descricao: z.string().optional(),
  missao: z.string().optional(),
  visao: z.string().optional(),
  valores: z.string().optional(),
  pais: z.string().optional(),
  provincia: z.string().optional(),
  municipio: z.string().optional(),
  bairro: z.string().optional(),
  endereco: z.string().optional(),
  gpsLocation: z.string().optional(),
  ramoActividade: z.string().optional(),
  categoria: z.string().optional(),
  website: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
});

const ongSchema = baseSchema.extend({
  accountType: z.literal("ONG"),
  nomeInstituicao: z.string().optional(),
  missao: z.string().optional(),
  areaActuacao: z.string().optional(),
  website: z.string().optional(),
  nif: z.string().optional(),
  descricao: z.string().optional(),
  redesSociais: z.string().optional(),
  pais: z.string().optional(),
  provincia: z.string().optional(),
  municipio: z.string().optional(),
  bairro: z.string().optional(),
  endereco: z.string().optional(),
});

const educacaoSchema = baseSchema.extend({
  accountType: z.literal("EDUCACAO"),
  nomeInstituicao: z.string().optional(),
  tipoInstituicao: z.string().optional(),
  cursos: z.string().optional(),
  website: z.string().optional(),
  nif: z.string().optional(),
  descricao: z.string().optional(),
  redesSociais: z.string().optional(),
  pais: z.string().optional(),
  provincia: z.string().optional(),
  municipio: z.string().optional(),
  bairro: z.string().optional(),
  endereco: z.string().optional(),
});

const inviteSchema = z.object({
  invite: z.string().optional(),
});

const otherSchema = baseSchema.extend({
  accountType: z.enum(["EMPREENDEDOR", "ASSOCIACAO", "COOPERATIVA"]),
  nomeComercial: z.string().optional(),
  nif: z.string().optional(),
  bi: z.string().optional(),
  dataNascimento: z.string().optional(),
  sexo: z.string().optional(),
  pais: z.string().optional(),
  provincia: z.string().optional(),
  municipio: z.string().optional(),
  bairro: z.string().optional(),
  endereco: z.string().optional(),
  areaActividade: z.string().optional(),
  profissao: z.string().optional(),
  servicosDescricao: z.string().optional(),
  redesSociais: z.string().optional(),
  descricao: z.string().optional(),
  gpsLocation: z.string().optional(),
  nomeInstituicao: z.string().optional(),
  ramoActividade: z.string().optional(),
  missao: z.string().optional(),
  areaActuacao: z.string().optional(),
  website: z.string().optional(),
});

const registerSchema = z.discriminatedUnion("accountType", [
  empresaSchema,
  ongSchema,
  educacaoSchema,
  otherSchema,
]);

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const check = checkRateLimit(`register:${ip}`, "strict");
  if (!check.allowed) return rateLimitResponse(check.retryAfter!);

  try {
    const body = await request.json();

    const inviteToken = body.invite || null;

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const data = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Este email já está registado." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.$transaction(async (tx) => {
      let companyId: string;

      if (inviteToken) {
        const invite = await tx.invite.findUnique({ where: { token: inviteToken } });
        if (!invite) throw new Error("Link de convite inválido.");
        if (invite.used) throw new Error("Este convite já foi utilizado.");
        if (invite.expiresAt < new Date()) throw new Error("Este convite expirou.");
        companyId = invite.companyId;
        await tx.invite.update({ where: { id: invite.id }, data: { used: true } });
      } else {
        const companyName = data.accountType === "EMPRESA" ? data.nomeEmpresa! : `${data.nome} (${data.accountType})`;
        const company = await tx.company.create({
          data: { name: companyName, nif: data.nif, phone: data.telefone, address: data.endereco },
        });
        companyId = company.id;
      }

      const profileData: any = {
        nome: data.nome,
        nif: data.nif,
        telefone: data.telefone,
        endereco: data.endereco,
        provincia: data.provincia,
        municipio: data.municipio,
        bairro: data.bairro,
        descricao: data.descricao,
      };

      if (data.accountType !== "EMPRESA" && data.accountType !== "ONG" && data.accountType !== "EDUCACAO") {
        profileData.nomeComercial = (data as any).nomeComercial;
        profileData.bi = (data as any).bi;
        profileData.dataNascimento = (data as any).dataNascimento ? new Date((data as any).dataNascimento) : null;
        profileData.sexo = (data as any).sexo;
        profileData.pais = data.pais;
        profileData.areaActividade = (data as any).areaActividade;
        profileData.profissao = (data as any).profissao;
        profileData.servicosDescricao = (data as any).servicosDescricao;
        profileData.redesSociais = (data as any).redesSociais;
      } else {
        profileData.pais = data.pais;
        profileData.redesSociais = (data as any).redesSociais;
      }

      const createData: any = {
        name: data.nome,
        email: data.email,
        password: hashedPassword,
        phone: data.telefone,
        accountType: data.accountType,
        role: "user",
        companyId: companyId || null,
        profile: { create: profileData },
      };

      if (data.accountType === "EMPRESA") {
        const ed = data as z.infer<typeof empresaSchema>;
        createData.companyProfile = {
          create: {
            nomeEmpresa: ed.nomeEmpresa,
            nif: ed.nif, registoComercial: ed.registoComercial,
            anoFundacao: ed.anoFundacao ? parseInt(ed.anoFundacao) : null,
            numColaboradores: ed.numColaboradores ? parseInt(ed.numColaboradores) : null,
            descricao: ed.descricao, missao: ed.missao, visao: ed.visao, valores: ed.valores,
            pais: ed.pais, provincia: ed.provincia, municipio: ed.municipio,
            bairro: ed.bairro, endereco: ed.endereco, gpsLocation: ed.gpsLocation,
            ramoActividade: ed.ramoActividade, categoria: ed.categoria,
            website: ed.website, facebook: ed.facebook, instagram: ed.instagram, linkedin: ed.linkedin,
          },
        };
      }

      if (data.accountType === "ONG") {
        const od = data as z.infer<typeof ongSchema>;
        createData.ngoProfile = {
          create: {
            nome: od.nomeInstituicao || od.nome,
            missao: od.missao || "",
            areaActuacao: od.areaActuacao || "",
            website: od.website,
          },
        };
      }

      if (data.accountType === "EDUCACAO") {
        const ed = data as z.infer<typeof educacaoSchema>;
        createData.educationProfile = {
          create: {
            nomeInstituicao: ed.nomeInstituicao || ed.nome,
            tipo: ed.tipoInstituicao || "",
            cursos: ed.cursos,
            website: ed.website,
          },
        };
      }

      return tx.user.create({
        data: createData,
        select: { id: true, name: true, email: true, phone: true, accountType: true, plan: true, role: true, companyId: true },
      });
    });

    const token = signToken({
      userId: user.id, companyId: user.companyId, email: user.email, role: user.role, accountType: user.accountType, plan: user.plan,
    });

    const response = NextResponse.json({ user });

    response.cookies.set("ibplus_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    const message = err?.message || "Erro interno do servidor.";
    const status = message.includes("Link") || message.includes("convite") || message.includes("expirou") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
