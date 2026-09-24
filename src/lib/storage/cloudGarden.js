// Alle Supabase-aanroepen rond tuinen, leden en uitnodigingen. Net als
// garden.js (localStorage) is dit de enige module die deze tabellen
// aanraakt; garden.svelte.js beslist wanneer.
//
// Toegang wordt afgedwongen door RLS (supabase/migrations/0001_init.sql):
// je ziet en bewerkt alleen tuinen waar je lid van bent.

import { supabase } from "../supabase.js";

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

/** Tuinen waar de ingelogde gebruiker lid van is, met de eigen rol. */
export async function listGardens(userId) {
  const rows = unwrap(
    await supabase
      .from("garden_members")
      .select("role, gardens(id, name, updated_at)")
      .eq("user_id", userId)
  );
  return rows
    .filter((r) => r.gardens)
    .map((r) => ({ id: r.gardens.id, name: r.gardens.name, role: r.role, updatedAt: r.gardens.updated_at }))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

/** @returns {Promise<{ id: string, name: string, data: object, version: number }>} */
export async function fetchGarden(id) {
  return unwrap(await supabase.from("gardens").select("id, name, data, version").eq("id", id).single());
}

/** Maakt een tuin met jou als eigenaar; geeft het nieuwe id. */
export async function createGarden(name, data) {
  return unwrap(await supabase.rpc("create_garden", { p_name: name, p_data: data }));
}

/**
 * Schrijft de tuin weg als de serverversie nog `version` is.
 * @returns {Promise<{ ok: true, version: number } | { ok: false }>} ok:false = iemand anders was eerder
 */
export async function pushGarden(id, data, version) {
  const rows = unwrap(
    await supabase.from("gardens").update({ data }).eq("id", id).eq("version", version).select("version")
  );
  return rows.length > 0 ? { ok: true, version: rows[0].version } : { ok: false };
}

export async function renameGarden(id, name) {
  unwrap(await supabase.from("gardens").update({ name }).eq("id", id).select("id"));
}

export async function deleteGarden(id) {
  unwrap(await supabase.from("gardens").delete().eq("id", id));
}

export async function listMembers(gardenId) {
  return unwrap(
    await supabase
      .from("garden_members")
      .select("user_id, role, email, created_at")
      .eq("garden_id", gardenId)
      .order("created_at")
  );
}

export async function removeMember(gardenId, userId) {
  unwrap(await supabase.from("garden_members").delete().eq("garden_id", gardenId).eq("user_id", userId));
}

/** Maakt een eenmalige uitnodiging; geeft het token. */
export async function createInvite(gardenId) {
  return unwrap(await supabase.from("garden_invites").insert({ garden_id: gardenId }).select("token").single())
    .token;
}

/** Wordt lid via een uitnodiging; geeft het tuin-id. */
export async function acceptInvite(token) {
  return unwrap(await supabase.rpc("accept_invite", { p_token: token }));
}

/**
 * Live wijzigingen aan één tuin (van mede-tuiniers of je andere apparaten).
 * Verwijderen komt hier niet door (Realtime kan DELETE niet filteren); dat
 * merkt de app bij de volgende fetchGarden().
 * @param {(row: { data: object, version: number, name: string }) => void} onUpdate
 * @returns {() => void} afmelden
 */
export function subscribeToGarden(id, onUpdate) {
  const channel = supabase
    .channel(`garden:${id}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "gardens", filter: `id=eq.${id}` }, (payload) =>
      onUpdate(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
