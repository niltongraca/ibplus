import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este email já está registado." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    if (tipo === "empresa") {
      const {
        nomeResponsavel, telefone,
        nomeEmpresa, nif, registoComercial, anoFundacao, numColaboradores,
        descricao, missao, visao, valores,
        pais, provincia, municipio, bairro, endereco, gpsLocation,
        ramoActividade, categoria, website, facebook, instagram, linkedin,
      } = body;

      if (!nomeResponsavel || !nomeEmpresa) {
        return NextResponse.json({ error: "Nome do responsável e nome da empresa são obrigatórios." }, { status: 400 });
      }

      const company = await prisma.company.create({
        data: { name: nomeEmpresa, nif, phone: telefone, address: endereco },
      });

      user = await prisma.user.create({
        data: {
          name: nomeResponsavel,
          email,
          password: hashedPassword,
          phone: telefone,
          tipo: "empresa",
          role: "empresa",
          companyId: company.id,
          empresa: {
            create: {
              nome: nomeEmpresa,
              nif,
              registoComercial,
              anoFundacao: anoFundacao ? parseInt(anoFundacao) : null,
              numColaboradores: numColaboradores ? parseInt(numColaboradores) : null,
              descricao,
              missao,
              visao,
              valores,
              pais,
              provincia,
              municipio,
              bairro,
              endereco,
              gpsLocation,
              ramoActividade,
              categoria,
              website,
              facebook,
              instagram,
              linkedin,
            },
          },
        },
        include: { empresa: true },
      });
    } else {
      const {
        nomeCompleto, telefone,
        nomeComercial, nif, bi, dataNascimento, sexo,
        pais, provincia, municipio, bairro, endereco,
        areaActividade, profissao, servicosDescricao, redesSociais,
      } = body;

      if (!nomeCompleto) {
        return NextResponse.json({ error: "O nome completo é obrigatório." }, { status: 400 });
      }

      user = await prisma.user.create({
        data: {
          name: nomeCompleto,
          email,
          password: hashedPassword,
          phone: telefone,
          tipo: "empreendedor",
          role: "user",
          empreendedor: {
            create: {
              nomeCompleto,
              nomeComercial,
              nif,
              bi,
              dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
              sexo,
              pais,
              provincia,
              municipio,
              bairro,
              endereco,
              areaActividade,
              profissao,
              servicosDescricao,
              redesSociais,
            },
          },
        },
        include: { empreendedor: true },
      });
    }

    const token = signToken({ userId: user.id, companyId: user.companyId, email: user.email, role: user.role });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        tipo: user.tipo,
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
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
