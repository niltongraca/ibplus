import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { signToken } from "@/lib/auth";
import { ensureCompanyOwner } from "@/lib/ownership";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { parseDateOnly } from "@/lib/utils";

const accountTypeEnum = z.enum(["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"]);

interface RegisterPayload {
  accountType: z.infer<typeof accountTypeEnum>;
  email: string;
  password: string;
  telefone?: string;
  nome: string;
  cargoName?: string;
  cargoDescription?: string;
  cargoId?: string;
  nomeEmpresa?: string;
  nif?: string;
  registoComercial?: string;
  anoFundacao?: string;
  numColaboradores?: string;
  descricao?: string;
  missao?: string;
  visao?: string;
  valores?: string;
  pais?: string;
  provincia?: string;
  municipio?: string;
  bairro?: string;
  endereco?: string;
  gpsLocation?: string;
  ramoActividade?: string;
  categoria?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  nomeInstituicao?: string;
  tipoInstituicao?: string;
  cursos?: string;
  nomeComercial?: string;
  bi?: string;
  dataNascimento?: string;
  sexo?: string;
  areaActividade?: string;
  profissao?: string;
  servicosDescricao?: string;
  redesSociais?: string;
  areaActuacao?: string;
}

const baseSchema = z.object({
  accountType: accountTypeEnum,
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  telefone: z.string().optional(),
  nome: z.string().min(1, "O nome é obrigatório"),
  cargoName: z.string().optional(),
  cargoDescription: z.string().optional(),
  cargoId: z.string().optional(),
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

    let parsed: RegisterPayload;

    if (inviteToken) {
      const inviteParse = baseSchema.safeParse(body);
      if (!inviteParse.success) {
        const firstError = inviteParse.error.errors[0];
        return NextResponse.json({ error: firstError.message }, { status: 400 });
      }
      parsed = inviteParse.data as RegisterPayload;
    } else {
      const registerParse = registerSchema.safeParse(body);
      if (!registerParse.success) {
        const firstError = registerParse.error.errors[0];
        return NextResponse.json({ error: firstError.message }, { status: 400 });
      }
      parsed = registerParse.data as RegisterPayload;
    }

    const data = { ...parsed };

    if (inviteToken) {
      const existingInvite = await prisma.invite.findUnique({
        where: { token: inviteToken },
        select: { accountType: true },
      });
      if (existingInvite?.accountType) {
        data.accountType = existingInvite.accountType;
      }
    }

    if (!inviteToken && data.accountType !== "EMPREENDEDOR" && !data.cargoName) {
      return NextResponse.json({ error: "Indique o seu cargo na organização." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Este email já está registado." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const created = await prisma.$transaction(async (tx) => {
      let companyId: string;
      let ownerCargoId: string | undefined;
      let invited: boolean;

      if (inviteToken) {
        const invite = await tx.invite.findUnique({ where: { token: inviteToken } });
        if (!invite) throw new Error("Link de convite inválido.");
        if (invite.used) throw new Error("Este convite já foi utilizado.");
        if (invite.expiresAt < new Date()) throw new Error("Este convite expirou.");
        companyId = invite.companyId;
        invited = true;
        await tx.invite.update({ where: { id: invite.id }, data: { used: true } });

        const defaultCargo = await tx.cargo.findFirst({
          where: { companyId, active: true, isDefault: true },
        });
        if (defaultCargo) ownerCargoId = defaultCargo.id;
      } else {
        const companyName = data.accountType === "EMPRESA" ? data.nomeEmpresa! : `${data.nome} (${data.accountType})`;
        const company = await tx.company.create({
          data: { name: companyName, nif: data.nif, phone: data.telefone, address: data.endereco },
        });
        companyId = company.id;
        invited = false;
      }

      let cargoId: string | null;

      if (inviteToken) {
        cargoId = data.cargoId || ownerCargoId || null;
        if (cargoId) {
          const cargoExists = await tx.cargo.findFirst({
            where: { id: cargoId, companyId, active: true },
          });
          if (!cargoExists) throw new Error("Cargo selecionado inválido.");
        }
      } else if (data.accountType !== "EMPREENDEDOR") {
        const cargo = await tx.cargo.create({
          data: {
            companyId,
            name: data.cargoName!,
            description: data.cargoDescription || null,
            level: "owner",
            isDefault: true,
          },
        });
        cargoId = cargo.id;
      } else {
        cargoId = ownerCargoId || null;
      }

      const profileData: Prisma.ProfileUncheckedCreateWithoutUserInput = {
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
        profileData.nomeComercial = data.nomeComercial;
        profileData.bi = data.bi;
        profileData.dataNascimento = data.dataNascimento ? (parseDateOnly(data.dataNascimento) ?? new Date(data.dataNascimento)) : null;
        profileData.sexo = data.sexo;
        profileData.pais = data.pais;
        profileData.areaActividade = data.areaActividade;
        profileData.profissao = data.profissao;
        profileData.servicosDescricao = data.servicosDescricao;
        profileData.redesSociais = data.redesSociais;
      } else {
        profileData.pais = data.pais;
        profileData.redesSociais = "redesSociais" in data ? data.redesSociais : undefined;
      }

      const createData: Prisma.UserUncheckedCreateInput = {
        name: data.nome,
        email: data.email,
        password: hashedPassword,
        phone: data.telefone,
        accountType: data.accountType,
        role: "user",
        companyId: companyId || null,
        profile: { create: profileData },
      };

      if (!invited && data.accountType === "EMPRESA") {
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

      if (!invited && data.accountType === "ONG") {
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

      if (!invited && data.accountType === "EDUCACAO") {
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

      const createdUser = await tx.user.create({
        data: createData,
        select: { id: true, name: true, email: true, phone: true, accountType: true, plan: true, role: true, companyId: true, tokenVersion: true },
      });

      let cargoLevel: string | null = null;

      if (companyId && data.accountType !== "EMPREENDEDOR") {
        await tx.employee.create({
          data: {
            companyId,
            userId: createdUser.id,
            name: data.nome,
            email: data.email,
            phone: data.telefone,
            position: data.cargoName || data.cargoDescription || null,
            cargoId,
            isOwner: !invited,
          },
        });
        if (cargoId) {
          const cargo = await tx.cargo.findFirst({ where: { id: cargoId, companyId }, select: { level: true } });
          cargoLevel = cargo?.level ?? null;
        }
      }

      return { ...createdUser, isOwner: !invited && companyId !== null && data.accountType !== "EMPREENDEDOR", cargoLevel };
    });

    // Qualquer utilizador que registe/possua uma empresa passa a dono automaticamente
    const ownerInfo = await ensureCompanyOwner({
      id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      companyId: created.companyId,
    });
    const user = { ...created, isOwner: ownerInfo.isOwner, cargoLevel: ownerInfo.cargoLevel };

    const mail = welcomeEmail(user.name, user.accountType);
    await sendEmail(user.email, mail.subject, mail.html);

    const token = signToken({
      userId: user.id, companyId: user.companyId, email: user.email, role: user.role, accountType: user.accountType, plan: user.plan, tokenVersion: user.tokenVersion, cargoLevel: user.cargoLevel,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("Link") || message.includes("convite") || message.includes("expirou") || message.includes("Cargo")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
