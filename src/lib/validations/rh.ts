import { z } from "zod";

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "half_day", "justified"] as const;
export const VACATION_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;

// ---- Funcionários ----
export const employeeCreateSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório.").max(200, "O nome excede 200 caracteres."),
  email: z
    .union([z.literal(""), z.string().trim().email("O email não é válido.").max(255)])
    .optional()
    .nullable(),
  phone: z.string().trim().max(50, "O telefone excede 50 caracteres.").optional().nullable(),
  position: z.string().trim().max(200, "O cargo excede 200 caracteres.").optional().nullable(),
  salary: z.coerce.number().finite().min(0, "O salário não pode ser negativo.").max(1e15).optional().nullable(),
  hireDate: z.string().trim().max(50, "Data inválida.").optional().nullable(),
  cargoId: z.string().max(100).optional().nullable(),
  active: z.boolean().optional(),
});
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export const employeeUpdateSchema = employeeCreateSchema.partial();
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;

// ---- Presenças ----
export const attendanceCreateSchema = z.object({
  employeeId: z.string().min(1, "O funcionário é obrigatório.").max(100),
  date: z.string().trim().max(50, "Data inválida.").optional().nullable(),
  checkIn: z.string().trim().max(50, "Hora inválida.").optional().nullable(),
  checkOut: z.string().trim().max(50, "Hora inválida.").optional().nullable(),
  status: z.enum(ATTENDANCE_STATUSES).optional(),
  notes: z.string().trim().max(2000, "As notas excedem 2000 caracteres.").optional().nullable(),
});
export type AttendanceCreateInput = z.infer<typeof attendanceCreateSchema>;
export const attendanceUpdateSchema = attendanceCreateSchema.omit({ employeeId: true }).partial();
export type AttendanceUpdateInput = z.infer<typeof attendanceUpdateSchema>;

// ---- Férias ----
export const vacationCreateSchema = z.object({
  employeeId: z.string().min(1, "O funcionário é obrigatório.").max(100),
  startDate: z.string().trim().min(1, "A data de início não é válida.").max(50),
  endDate: z.string().trim().min(1, "A data de fim não é válida.").max(50),
  status: z.enum(VACATION_STATUSES).optional(),
  notes: z.string().trim().max(2000, "As notas excedem 2000 caracteres.").optional().nullable(),
});
export type VacationCreateInput = z.infer<typeof vacationCreateSchema>;
export const vacationUpdateSchema = vacationCreateSchema.omit({ employeeId: true }).partial();
export type VacationUpdateInput = z.infer<typeof vacationUpdateSchema>;