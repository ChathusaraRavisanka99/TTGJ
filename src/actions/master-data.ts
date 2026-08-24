"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { slugify } from "@/lib/utils";
import { mineralSchema, clarityGradeSchema, simpleMasterDataSchema } from "@/lib/validation/catalog";
import type { ActionResult } from "./auth";

function obj(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createMineral(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = mineralSchema.safeParse(obj(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid mineral." };
  const d = parsed.data;
  await prisma.mineral.create({ data: { ...d, description: d.description || undefined, slug: slugify(d.name) } });
  revalidatePath("/admin/master-data/minerals");
  return { ok: true };
}

export async function updateMineral(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = mineralSchema.safeParse(obj(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid mineral." };
  const d = parsed.data;
  await prisma.mineral.update({ where: { id }, data: { ...d, description: d.description || undefined } });
  revalidatePath("/admin/master-data/minerals");
  return { ok: true };
}

export async function deleteMineral(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.mineral.delete({ where: { id } });
  revalidatePath("/admin/master-data/minerals");
  return { ok: true };
}

export async function createClarityGrade(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = clarityGradeSchema.safeParse(obj(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid clarity grade." };
  const d = parsed.data;
  await prisma.clarityGrade.create({ data: { ...d, slug: slugify(d.name) } });
  revalidatePath("/admin/master-data/clarity");
  return { ok: true };
}

export async function updateClarityGrade(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = clarityGradeSchema.safeParse(obj(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid clarity grade." };
  await prisma.clarityGrade.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/master-data/clarity");
  return { ok: true };
}

export async function deleteClarityGrade(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.clarityGrade.delete({ where: { id } });
  revalidatePath("/admin/master-data/clarity");
  return { ok: true };
}

type SimpleModel = "cut" | "treatment" | "origin";

async function createSimple(model: SimpleModel, formData: FormData, extra: Record<string, unknown> = {}): Promise<ActionResult> {
  await requireAdmin();
  const parsed = simpleMasterDataSchema.safeParse(obj(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid entry." };
  const d = parsed.data;
  const data = { name: d.name, active: d.active, slug: slugify(d.name), ...extra };
  if (model === "cut") await prisma.cut.create({ data: data as never });
  if (model === "treatment") await prisma.treatment.create({ data: data as never });
  if (model === "origin") await prisma.origin.create({ data: data as never });
  revalidatePath(`/admin/master-data/${model === "cut" ? "cuts" : model + "s"}`);
  return { ok: true };
}

export async function createTreatment(formData: FormData) {
  return createSimple("treatment", formData);
}

export async function createOrigin(formData: FormData) {
  const isCeylon = formData.get("isCeylon") === "on";
  return createSimple("origin", formData, { isCeylon });
}

export async function toggleTreatmentActive(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.treatment.update({ where: { id }, data: { active } });
  revalidatePath("/admin/master-data/treatments");
  return { ok: true };
}

export async function toggleOriginActive(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.origin.update({ where: { id }, data: { active } });
  revalidatePath("/admin/master-data/origins");
  return { ok: true };
}

export async function toggleCutActive(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.cut.update({ where: { id }, data: { active } });
  revalidatePath("/admin/master-data/cuts");
  return { ok: true };
}

export async function toggleMineralActive(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.mineral.update({ where: { id }, data: { active } });
  revalidatePath("/admin/master-data/minerals");
  return { ok: true };
}
