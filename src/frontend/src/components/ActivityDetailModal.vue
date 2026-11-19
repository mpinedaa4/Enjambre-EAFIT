<script setup lang="ts">
/* Internal Imports */
import AppButton from '@/components/AppButton.vue';
import type { ActivityInterface } from '@/interfaces/ActivityInterface';
import type { Nullable } from '@/types/Nullable';

/* Props */
defineProps<{ activity: Nullable<ActivityInterface> }>();

/* Emits */
const emit = defineEmits<{ close: [] }>();

/* Functions */
function handleClose(): void {
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div v-if="activity !== null" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-ink/40" @click="handleClose" />

      <div
        class="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold tracking-wide text-slate-400 uppercase">Actividad</p>
            <h2 class="mt-1 text-lg font-bold break-words text-ink">{{ activity.name }}</h2>
          </div>
          <button
            type="button"
            class="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-ink"
            title="Cerrar"
            @click="handleClose"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <dl class="mt-5 space-y-4">
          <div>
            <dt class="text-sm font-semibold text-slate-700">Descripción</dt>
            <!-- `whitespace-pre-line`: la descripción se guarda tal cual se
                 escribió, así que se respetan sus saltos de línea. -->
            <dd class="mt-1 text-sm whitespace-pre-line text-slate-600">
              <template v-if="activity.description.trim() !== ''">
                {{ activity.description }}
              </template>
              <span v-else class="text-slate-400 italic">Sin descripción.</span>
            </dd>
          </div>

          <div>
            <dt class="text-sm font-semibold text-slate-700">Porcentaje</dt>
            <dd class="mt-1">
              <span
                class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-bold text-brand-700"
              >
                {{ activity.weight }}%
              </span>
            </dd>
          </div>
        </dl>

        <div class="mt-6 flex justify-end">
          <AppButton variant="ghost" @click="handleClose">Cerrar</AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
