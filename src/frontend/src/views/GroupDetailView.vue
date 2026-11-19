<script setup lang="ts">
/* External Imports */
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

/* Internal Imports */
import AppButton from '@/components/AppButton.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import type { CommitteeInterface } from '@/interfaces/CommitteeInterface';
import type { GroupInterface } from '@/interfaces/GroupInterface';
import type { Nullable } from '@/types/Nullable';
import type { MemberStatusInterface } from '@/interfaces/MemberStatusInterface';
import { CommitteeService } from '@/services/CommitteeService';
import { GroupService } from '@/services/GroupService';
import { MemberStatusService } from '@/services/MemberStatusService';
import { ROUTE_NAMES } from '@/constants/routeNames';
import { ToastService } from '@/services/ToastService';
import { resolveErrorMessage } from '@/utils/resolveErrorMessage';

/* Types */
interface StatusWithTarget {
  id: number;
  name: string;
  percentage: number;
}

/* Variables */
const route = useRoute();
const router = useRouter();

/* Reactive Variables */
const isLoading = ref<boolean>(true);
const isDeleteOpen = ref<boolean>(false);
const group = ref<Nullable<GroupInterface>>(null);
const committees = ref<CommitteeInterface[]>([]);
const memberStatuses = ref<StatusWithTarget[]>([]);
const memberCount = ref<number>(0);

/* Selectors */
const groupId = computed<number>(() => Number(route.params.id));
const deleteMessage = computed<string>(
  () =>
    `Se eliminará «${group.value?.name ?? ''}», sus ${committees.value.length} comité(s), sus estados, actividades y la cuenta de su junta directiva. Esta acción no se puede deshacer.`,
);

/* Functions */
async function load(): Promise<void> {
  isLoading.value = true;
  try {
    const [foundGroup, foundCommittees, foundStatuses, count] = await Promise.all([
      GroupService.getGroupById(groupId.value),
      CommitteeService.getCommitteesByGroupId(groupId.value),
      MemberStatusService.getMemberStatusesByGroupId(groupId.value),
      GroupService.getMemberCount(groupId.value),
    ]);

    group.value = foundGroup;
    committees.value = foundCommittees;
    memberStatuses.value = foundStatuses.map((status: MemberStatusInterface) => ({
      id: status.id,
      name: status.name,
      percentage: status.target,
    }));
    memberCount.value = count;
  } catch (error: unknown) {
    ToastService.error(resolveErrorMessage(error));
  } finally {
    isLoading.value = false;
  }
}

function goBack(): void {
  void router.push({ name: ROUTE_NAMES.ADMIN_GROUPS });
}

function goToEdit(): void {
  void router.push({ name: ROUTE_NAMES.ADMIN_GROUP_EDIT, params: { id: String(groupId.value) } });
}

async function handleDelete(): Promise<void> {
  const groupName = group.value?.name ?? '';
  isDeleteOpen.value = false;

  try {
    await GroupService.deleteGroup(groupId.value);
    ToastService.success(`Grupo «${groupName}» eliminado.`);
    void router.push({ name: ROUTE_NAMES.ADMIN_GROUPS });
  } catch (error: unknown) {
    ToastService.error(resolveErrorMessage(error));
  }
}

onMounted(() => {
  void load();
});
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6">
    <button
      type="button"
      class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-brand-700"
      @click="goBack"
    >
      <i class="fa-solid fa-arrow-left" />
      Volver a grupos
    </button>

    <p v-if="isLoading" class="text-sm text-slate-500">Cargando grupo…</p>

    <div
      v-else-if="group === null"
      class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"
    >
      <p class="text-sm text-slate-500">El grupo solicitado no existe.</p>
      <AppButton class="mt-4" variant="secondary" @click="goBack">Volver</AppButton>
    </div>

    <template v-else>
      <div class="rounded-2xl border border-slate-200 bg-white p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span class="text-xs font-semibold tracking-wide text-brand-700 uppercase">
              Grupo #{{ group.id }}
            </span>
            <h2 class="mt-2 text-2xl font-black text-ink">{{ group.name }}</h2>
          </div>
          <div class="flex gap-2">
            <AppButton variant="secondary" @click="goToEdit">
              <i class="fa-solid fa-pen" />
              Editar
            </AppButton>
            <AppButton variant="danger" @click="isDeleteOpen = true">
              <i class="fa-solid fa-trash" />
              Eliminar
            </AppButton>
          </div>
        </div>

        <div class="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 class="text-sm font-bold text-slate-500">Comités / Departamentos</h3>
            <ul class="mt-2 space-y-1.5">
              <li
                v-for="committee in committees"
                :key="committee.id"
                class="flex items-center gap-2 text-sm text-ink"
              >
                <i class="fa-solid fa-sitemap text-slate-400" />
                {{ committee.name }}
              </li>
              <li v-if="committees.length === 0" class="text-sm text-slate-400">
                Sin comités registrados.
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-500">Estados de miembro (% permanencia)</h3>
            <ul class="mt-2 flex flex-wrap gap-1.5">
              <li
                v-for="status in memberStatuses"
                :key="status.id"
                class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
              >
                {{ status.name }} · {{ status.percentage }}%
              </li>
              <li v-if="memberStatuses.length === 0" class="text-sm text-slate-400">
                Sin estados registrados.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <RouterLink
          :to="{ name: ROUTE_NAMES.ADMIN_GROUP_MEMBERS, params: { id: String(group.id) } }"
          class="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white"
            >
              <i class="fa-solid fa-database" />
            </span>
            <p class="text-sm font-bold text-ink">Miembros del Grupo</p>
          </div>
          <p class="mt-3 text-sm text-slate-500">
            {{ memberCount }} integrante(s) registrado(s). Abre la tabla para gestionarlos.
          </p>
          <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
            Abrir <i class="fa-solid fa-arrow-right text-xs" />
          </span>
        </RouterLink>

        <RouterLink
          :to="{ name: ROUTE_NAMES.ADMIN_GROUP_PERMANENCE, params: { id: String(group.id) } }"
          class="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white"
            >
              <i class="fa-solid fa-list-check" />
            </span>
            <p class="text-sm font-bold text-ink">Tabla de permanencia</p>
          </div>
          <p class="mt-3 text-sm text-slate-500">
            Hoja general y por comité. Registra actividades y valores; verde/rojo según el objetivo
            de cada estado.
          </p>
          <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
            Abrir <i class="fa-solid fa-arrow-right text-xs" />
          </span>
        </RouterLink>
      </div>

      <ConfirmDialog
        :open="isDeleteOpen"
        title="Eliminar grupo"
        :message="deleteMessage"
        confirm-label="Eliminar grupo"
        tone="danger"
        @confirm="handleDelete"
        @cancel="isDeleteOpen = false"
      />
    </template>
  </section>
</template>
