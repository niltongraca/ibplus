import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountType, email, password } = body;

    if (!email || !password || !accountType) {
      return NextResponse.json({ error: "Email, senha e tipo de conta são obrigatórios." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const validTypes = ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"];
    if (!validTypes.includes(accountType)) {
      return NextResponse.json({ error: "Tipo de conta inválido." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este email já está registado." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const {
      nome, telefone,
      nomeComercial, nif, bi, dataNascimento, sexo,
      pais, provincia, municipio, bairro, endereco,
      areaActividade, profissao, servicosDescricao, redesSociais, descricao,
      // empresa-specific
      nomeEmpresa, registoComercial, anoFundacao, numColaboradores,
      missao, visao, valores, gpsLocation, ramoActividade, categoria,
      website, facebook, instagram, linkedin,
      // ONG-specific
      areaActuacao,
      // education-specific
      nomeInstituicao, tipoInstituicao, cursos,
    } = body;

    let user;

    if (accountType === "EMPRESA") {
      if (!nome || !nomeEmpresa) {
        return NextResponse.json({ error: "Nome do responsável e nome da empresa são obrigatórios." }, { status: 400 });
      }

      const company = await prisma.company.create({
        data: { name: nomeEmpresa, nif, phone: telefone, address: endereco },
      });

      user = await prisma.user.create({
        data: {
          name: nome,
          email,
          password: hashedPassword,
          phone: telefone,
          accountType: "EMPRESA",
          role: "user",
          companyId: company.id,
          profile: {
            create: { nome, nif, telefone, endereco, provincia, municipio, bairro, descricao },
          },
          companyProfile: {
            create: {
              nomeEmpresa, nif, registoComercial,
              anoFundacao: anoFundacao ? parseInt(anoFundacao) : null,
              numColaboradores: numColaboradores ? parseInt(numColaboradores) : null,
              descricao, missao, visao, valores,
              pais, provincia, municipio, bairro, endereco, gpsLocation,
              ramoActividade, categoria, website, facebook, instagram, linkedin,
            },
          },
        },
        include: { profile: true, companyProfile: true },
      });
    } else {
      if (!nome) {
        return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });
      }

      const profileData: any = {
        nome,
        nomeComercial, nif, bi, telefone,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        sexo, pais, provincia, municipio, bairro, endereco,
        areaActividade, profissao, servicosDescricao, redesSociais, descricao,
      };

      const extra: any = { profile: { create: profileData } };

      if (accountType === "ONG") {
        extra.ngoProfile = {
          create: { nome, missao: missao || "", areaActuacao: areaActuacao || "", website, facebook, instagram },
        };
      }

      if (accountType === "EDUCACAO") {
        extra.educationProfile = {
          create: {
            nomeInstituicao: nomeInstituicao || nome,
            tipo: tipoInstituicao || "",
            cursos, website, facebook, instagram,
          },
        };
      }

      user = await prisma.user.create({
        data: {
          name: nome,
          email,
          password: hashedPassword,
          phone: telefone,
          accountType,
          role: "user",
          ...extra,
        },
        include: { profile: true, companyProfile: true, ngoProfile: true, educationProfile: true },
      });
    }

    const token = signToken({ userId: user.id, companyId: user.companyId, email: user.email, role: user.role, accountType: user.accountType });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
        plan: user.plan,
        role: user.role,
        companyId: user.companyId,
      },
    });

    response.cookies.set("ibplus_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}