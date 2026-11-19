<script setup lang="ts">
/* Internal Imports */
import type { Nullable } from '@/types/Nullable';
import type { PermanenceRow, PermanenceSheetView } from '@/services/PermanenceSheetService';
import { MemberService } from '@/services/MemberService';

/* Props */
withDefaults(defineProps<{ sheet: PermanenceSheetView; readonly?: boolean }>(), {
  readonly: false,
});

/* Emits */
const emit = defineEmits<{
  // `null` = celda vacía (se borra el puntaje registrado, si lo había).
  setValue: [activityId: number, memberId: number, value: Nullable<number>];
  viewActivity: [activityId: number];
  editActivity: [activityId: number];
  deleteActivity: [activityId: number];
}>();

/* Functions */
function roundPercentage(value: number): number {
  return Math.round(value);
}

// Una celda sin puntaje registrado se muestra vacía, no como 0.
function valueText(row: PermanenceRow, activityId: number): string {
  const value = row.values[activityId] ?? null;
  return value === null ? '' : String(value);
}

function onValueInput(activityId: number, memberId: number, event: Event): void {
  const raw = (event.target as HTMLInputElement).value.trim();
  emit('setValue', activityId, memberId, raw === '' ? null : Number(raw));
}

function rowClass(row: PermanenceRow): string {
  return row.meets ? 'bg-emerald-50/70' : 'bg-red-50/70';
}
</script>

<template>
  <div
    v-if="sheet.activityColumns.length === 0"
    class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"
  >
    <p class="text-sm text-slate-500">
      Esta hoja no tiene actividades todavía. Usa «Agregar actividad» para empezar.
    </p>
  </div>

  <div v-else class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table class="w-full min-w-225 border-collapse text-sm">
      <thead>
        <tr class="bg-slate-50 text-left text-xs font-bold tracking-wide text-slate-500 uppercase">
          <th class="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            Integrante
          </th>
          <th class="border-b border-slate-200 px-3 py-2.5">Estado</th>

          <th
            v-for="activity in sheet.activityColumns"
            :key="`act-${activity.id}`"
            class="border-b border-slate-200 px-3 py-2.5 align-bottom"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="normal-case">
                {{ activity.name }}
                <span class="block text-[10px] font-semibold text-slate-400">
                  peso {{ activity.weight }}%
                </span>
              </span>
              <span class="flex shrink-0 gap-1">
                <!-- Ver detalle no modifica nada, por eso también está
                     disponible en modo solo lectura. -->
                <button
                  type="button"
                  class="rounded p-1 text-slate-400 transition hover:bg-slate-200 hover:text-brand-700"
                  title="Ver actividad"
                  @click="emit('viewActivity', activity.id)"
                >
                  <i class="fa-solid fa-eye text-[10px]" />
                </button>
                <button
                  v-if="!readonly"
                  type="button"
                  class="rounded p-1 text-slate-400 transition hover:bg-slate-200 hover:text-brand-700"
                  title="Editar actividad"
                  @click="emit('editActivity', activity.id)"
                >
                  <i class="fa-solid fa-pen text-[10px]" />
                </button>
                <button
                  v-if="!readonly"
                  type="button"
                  class="rounded p-1 text-slate-400 transition hover:bg-red-100 hover:text-red-500"
                  title="Eliminar actividad"
                  @click="emit('deleteActivity', activity.id)"
                >
                  <i class="fa-solid fa-trash text-[10px]" />
                </button>
              </span>
            </div>
          </th>

          <th
            v-for="subtotal in sheet.subtotalColumns"
            :key="`sub-${subtotal.committeeId}`"
            class="border-b border-slate-200 px-3 py-2.5 normal-case"
          >
            {{ subtotal.committeeName }}
            <span class="block text-[10px] font-semibold text-slate-400">subtotal comité</span>
          </th>

          <th class="border-b border-slate-200 px-3 py-2.5 text-right">Puntaje</th>
          <th class="border-b border-slate-200 px-3 py-2.5 text-right">Objetivo</th>
          <th class="border-b border-slate-200 px-3 py-2.5 text-center">Cumple</th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="sheet.rows.length === 0">
          <td
            :colspan="sheet.activityColumns.length + sheet.subtotalColumns.length + 5"
            class="px-3 py-10 text-center text-slate-400"
          >
            No hay integrantes en esta hoja.
          </td>
        </tr>

        <tr
          v-for="row in sheet.rows"
          :key="row.member.id"
          class="border-b border-slate-100 last:border-0"
          :class="rowClass(row)"
        >
          <td
            class="sticky left-0 z-10 border-r border-slate-100 px-3 py-2 font-medium text-ink"
            :class="rowClass(row)"
          >
            {{ MemberService.getDisplayName(row.member) }}
          </td>
          <td class="px-3 py-2 text-xs text-slate-500">{{ row.statusLabel }}</td>

          <td
            v-for="activity in sheet.activityColumns"
            :key="`c-${activity.id}`"
            class="px-2 py-1.5"
          >
            <span class="flex items-center justify-end gap-1">
              <input
                :value="valueText(row, activity.id)"
                placeholder="—"
                type="number"
                min="0"
                :max="activity.weight"
                step="1"
                :disabled="readonly"
                class="w-16 rounded-md border border-transparent bg-white/70 px-2 py-1.5 text-right text-ink outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed"
                @change="onValueInput(activity.id, row.member.id, $event)"
              />
              <span class="text-[10px] text-slate-400">/ {{ activity.weight }}%</span>
            </span>
          </td>

          <td
            v-for="subtotal in sheet.subtotalColumns"
            :key="`s-${subtotal.committeeId}`"
            class="px-3 py-2 text-right text-slate-500"
          >
            {{ roundPercentage(row.subtotals[subtotal.committeeId] ?? 0) }}%
          </td>

          <td
            class="px-3 py-2 text-right font-bold"
            :class="row.meets ? 'text-emerald-700' : 'text-red-700'"
          >
            {{ roundPercentage(row.score) }}%
          </td>
          <td class="px-3 py-2 text-right text-slate-500">{{ row.target }}%</td>
          <td class="px-3 py-2 text-center">
            <span
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="row.meets ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
            >
              <i class="fa-solid" :class="row.meets ? 'fa-check' : 'fa-xmark'" />
              {{ row.meets ? 'Sí' : 'No' }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
