// Schrijfacties op de catalogus (alleen voor admins). De database weigert
// dit voor iedereen die niet in `admins` staat (RLS, zie de migratie) —
// deze module doet zelf geen rechtencheck.

import { supabase } from "../supabase.js";

function check({ error }) {
  if (error) {
    if (error.code === "42501") throw new Error("Geen rechten: alleen beheerders mogen plantendata wijzigen.");
    throw error;
  }
}

export async function saveSpecies(species) {
  check(await supabase.from("species").upsert({ id: species.id, data: species }, { onConflict: "id" }));
}

export async function deleteSpecies(id) {
  check(await supabase.from("species").delete().eq("id", id));
}

export async function saveTaskType(taskType, sort) {
  check(
    await supabase.from("task_types").upsert({ id: taskType.id, sort, data: taskType }, { onConflict: "id" })
  );
}
