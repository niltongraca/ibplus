import { prisma } from "@/lib/prisma";
import { getAccountSteps as getAccountStepsConfig, isBusinessType, type StepContext } from "@/config/accountSteps";

export interface AccountStepsResult {
  steps: {
    key: string;
    label: string;
    description: string;
    icon: string;
    tab: string;
    done: boolean;
  }[];
  total: number;
  done: number;
  pending: number;
  completed: boolean;
}

export async function getAccountSteps(userId: string, accountType: string): Promise<AccountStepsResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      avatar: true,
      coverPhoto: true,
      phone: true,
      profile: {
        select: {
          descricao: true,
          endereco: true,
          provincia: true,
          telefone: true,
        },
      },
      company: {
        select: {
          name: true,
          nif: true,
          email: true,
          phone: true,
          address: true,
          provinciaOperacao: true,
          horarioFuncionamento: true,
          descricaoLoja: true,
          sobreNos: true,
          whatsappStore: true,
        },
      },
      companyProfile: {
        select: {
          descricao: true,
          nif: true,
        },
      },
      ngoProfile: {
        select: {
          missao: true,
          areaActuacao: true,
        },
      },
      educationProfile: {
        select: {
          nomeInstituicao: true,
          cursos: true,
        },
      },
    },
  });

  if (!user) {
    return { steps: [], total: 0, done: 0, pending: 0, completed: true };
  }

  const ctx: StepContext = {
    accountType: accountType as StepContext["accountType"],
    user,
    profile: user.profile,
    company: user.company,
    companyProfile: user.companyProfile,
    ngoProfile: user.ngoProfile,
    educationProfile: user.educationProfile,
  };

  const steps = getAccountStepsConfig(ctx.accountType).map((step) => ({
    key: step.key,
    label: step.label,
    description: step.description,
    icon: step.icon,
    tab: step.tab,
    done: step.done(ctx),
  }));

  const done = steps.filter((s) => s.done).length;

  return {
    steps,
    total: steps.length,
    done,
    pending: steps.length - done,
    completed: done === steps.length,
  };
}

export { isBusinessType };