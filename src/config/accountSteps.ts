import type { AccountType } from "@prisma/client";

export interface StepContext {
  accountType: AccountType;
  user: {
    name: string;
    avatar?: string | null;
    coverPhoto?: string | null;
    phone?: string | null;
  };
  profile?: {
    descricao?: string | null;
    endereco?: string | null;
    provincia?: string | null;
    telefone?: string | null;
  } | null;
  company?: {
    name?: string | null;
    nif?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    provinciaOperacao?: string | null;
    horarioFuncionamento?: string | null;
    descricaoLoja?: string | null;
    sobreNos?: string | null;
    whatsappStore?: string | null;
  } | null;
  companyProfile?: {
    descricao?: string | null;
    nif?: string | null;
  } | null;
  ngoProfile?: {
    missao?: string | null;
    areaActuacao?: string | null;
  } | null;
  educationProfile?: {
    nomeInstituicao?: string | null;
    cursos?: string | null;
  } | null;
}

export interface AccountStep {
  key: string;
  label: string;
  description: string;
  icon: string;
  tab: string;
  done: (ctx: StepContext) => boolean;
}

const BUSINESS = ["EMPRESA", "ONG", "ASSOCIACAO", "COOPERATIVA"] as const;

export const ACCOUNT_STEPS: AccountStep[] = [
  {
    key: "avatar",
    label: "Adicionar foto de perfil",
    description: "Uma foto sua ajuda os clientes a reconhecerem a sua conta.",
    icon: "user",
    tab: "perfil",
    done: (c) => Boolean(c.user.avatar),
  },
  {
    key: "coverPhoto",
    label: "Adicionar foto de capa",
    description: "Personalize a capa da sua conta com uma imagem de destaque.",
    icon: "image",
    tab: "perfil",
    done: (c) => Boolean(c.user.coverPhoto),
  },
  {
    key: "contacto",
    label: "Adicionar contacto",
    description: "Partilhe um número para os clientes o contactarem.",
    icon: "phone",
    tab: "contactos",
    done: (c) =>
      Boolean(c.user.phone || c.profile?.telefone || c.company?.phone || c.company?.whatsappStore),
  },
  {
    key: "bio",
    label: "Descrever o que faz",
    description: "Conte um pouco sobre si ou sobre a sua organização.",
    icon: "bio",
    tab: "loja",
    done: (c) => {
      if (c.accountType === "EMPREENDEDOR") return Boolean(c.profile?.descricao);
      if (c.accountType === "ONG") return Boolean(c.ngoProfile?.missao || c.ngoProfile?.areaActuacao);
      if (c.accountType === "EDUCACAO") return Boolean(c.educationProfile?.nomeInstituicao);
      return Boolean(c.company?.descricaoLoja || c.company?.sobreNos || c.companyProfile?.descricao);
    },
  },
  {
    key: "endereco",
    label: "Adicionar endereço",
    description: "Defina a localização da sua operação.",
    icon: "map",
    tab: "endereco",
    done: (c) => Boolean(c.company?.address || c.company?.provinciaOperacao || c.profile?.endereco || c.profile?.provincia),
  },
  {
    key: "horarios",
    label: "Definir horários",
    description: "Informe quando está disponível para os clientes.",
    icon: "clock",
    tab: "horarios",
    done: (c) => Boolean(c.company?.horarioFuncionamento),
  },
  {
    key: "nif",
    label: "Adicionar NIF",
    description: "Registe o NIF da sua organização para documentos fiscais.",
    icon: "file",
    tab: "loja",
    done: (c) => Boolean(c.accountType === "EMPREENDEDOR" || c.company?.nif || c.companyProfile?.nif),
  },
];

export function getAccountSteps(accountType: AccountType): AccountStep[] {
  if (accountType === "EMPREENDEDOR") {
    return ACCOUNT_STEPS.filter((s) => s.key !== "nif");
  }
  if (accountType === "EDUCACAO" || (BUSINESS as readonly string[]).includes(accountType)) {
    return ACCOUNT_STEPS;
  }
  return ACCOUNT_STEPS;
}

export function isBusinessType(accountType: AccountType): boolean {
  return (BUSINESS as readonly string[]).includes(accountType);
}