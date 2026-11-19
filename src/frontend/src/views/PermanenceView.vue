<script setup lang="ts">
/* External Imports */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/* Internal Imports */
import ActivityDetailModal from '@/components/ActivityDetailModal.vue';
import ActivityFormModal from '@/components/ActivityFormModal.vue';
import AppButton from '@/components/AppButton.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import PermanenceTable from '@/components/PermanenceTable.vue';
import type { ActivityFormPayload } from '@/components/ActivityFormModal.vue';
import type { ActivityInterface } from '@/interfaces/ActivityInterface';
import type { GroupInterface } from '@/interfaces/GroupInterface';
import type { Nullable } from '@/types/Nullable';
import type {
  PermanenceSheetKey,
  PermanenceSheetOption,
  PermanenceSheetView,
} from '@/services/PermanenceSheetService';
import { ActivityService } from '@/services/ActivityService';
import { AuthService } from '@/services/AuthService';
import { ExcelExportService } from '@/services/ExcelExportService';
import { GroupService } from '@/services/GroupService';
import { LIMITS } from '@/constants/limits';
import { PermanenceSheetService } from '@/services/PermanenceSheetService';
import { ROUTE_NAMES } from '@/constants/routeNames';
import { ToastService } from '@/services/ToastService';
import { downloadBlob } from '@/utils/downloadBlob';
import { resolveErrorMessage } from '@/utils/resolveErrorMessage';
import { slugify } from '@/utils/slugify';

/* Variables */
const route = useRoute();
const router = useRouter();

/* Reactive Variables */
const activeSheetKey = ref<PermanenceSheetKey>('general');
const isFormOpen = ref<boolean>(false);
const editingActivity = ref<Nullable<ActivityInterface>>(null);
const viewingActivity = ref<Nullable<ActivityInterface>>(null);
const activityPendingDelete = ref<Nullable<ActivityInterface>>(null);
const isExporting = ref<boolean>(false);
const isLoading = ref<boolean>(true);

const group = ref<Nullable<GroupInterface>>(null);
const sheetOptions = ref<PermanenceSheetOption[]>([]);
const sheet = ref<Nullable<PermanenceSheetView>>(null);

/* Selectors */
const isAdminRoute = computed<boolean>(() => route.name === ROUTE_NAMES.ADMIN_GROUP_PERMANENCE);

const groupId = computed<Nullable<number>>(() => {
  // El administrador no pertenece a ningún grupo: el grupo sale de la URL. La
  // junta directiva solo ve el suyo, que viene en la sesión.
  if (isAdminRoute.value) {
    const id = Number(route.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
  return AuthService.getSession()?.groupId ?? null;
});

const activeSheetLabel = computed<string>(
  () =>
    sheetOptions.value.find((option: PermanenceSheetOption) => option.key === activeSheetKey.value)
      ?.label ?? 'General',
);

const deleteMessage = computed<string>(() =>
  activityPendingDelete.value === null
    ? ''
    : `Se eliminará la actividad «${activityPendingDelete.value.name}» y todos los valores registrados de los integrantes. Esta acción no se puede deshacer.`,
);

// Suma de los pesos de la hoja activa: como son porcentajes, el máximo es 100.
const sheetWeightTotal = computed<number>(() =>
  (sheet.value?.activityColumns ?? []).reduce(
    (sum: number, activity: ActivityInterface) => sum + activity.weight,
    0,
  ),
);

// Lo que puede pesar la actividad del formulario sin que la hoja pase de 100:
// al editar no se cuenta su propio peso actual.
const availableWeight = computed<number>(
  () => LIMITS.MAX_PERCENTAGE - sheetWeightTotal.value + (editingActivity.value?.weight ?? 0),
);

/* Watchers */
watch(sheetOptions, (options: PermanenceSheetOption[]): void => {
  const stillExists = options.some(
    (option: PermanenceSheetOption) => option.key === activeSheetKey.value,
  );
  if (!stillExists) {
    activeSheetKey.value = 'general';
  }
});

watch(activeSheetKey, () => {
  void loadSheet();
});

watch(groupId, () => {
  void load();
});

/* Functions */
// Cada carga de la hoja lleva un número de secuencia: si mientras llega la
// respuesta se pidió otra carga más nueva, la vieja se descarta para que no
// pise los datos recientes con valores anteriores.
let sheetRequestId = 0;

// Los guardados de celdas se encadenan para que lleguen a la API en el orden
// en que se editaron.
let saveQueue: Promise<void> = Promise.resolve();

async function loadSheet(): Promise<void> {
  if (groupId.value === null) {
    return;
  }
  const requestId = ++sheetRequestId;
  try {
    const built = await PermanenceSheetService.buildSheet(groupId.value, activeSheetKey.value);
    if (requestId === sheetRequestId) {
      sheet.value = built;
    }
  } catch (error: unknown) {
    if (requestId === sheetRequestId) {
      ToastService.error(resolveErrorMessage(error));
    }
  }
}

async function load(): Promise<void> {
  if (groupId.value === null) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    const [foundGroup, options] = await Promise.all([
      GroupService.getGroupById(groupId.value),
      PermanenceSheetService.getSheetOptions(groupId.value),
    ]);
    group.value = foundGroup;
    sheetOptions.value = options;
    await loadSheet();
  } catch (error: unknown) {
    ToastService.error(resolveErrorMessage(error));
  } finally {
    isLoading.value = false;
  }
}

function selectSheet(key: PermanenceSheetKey): void {
  activeSheetKey.value = key;
}

function openCreate(): void {
  editingActivity.value = null;
  isFormOpen.value = true;
}

function openView(activityId: number): void {
  viewingActivity.value =
    sheet.value?.activityColumns.find((activity) => activity.id === activityId) ?? null;
}

function openEdit(activityId: number): void {
  editingActivity.value =
    sheet.value?.activityColumns.find((activity) => activity.id === activityId) ?? null;
  isFormOpen.value = true;
}

async function onFormSubmit(payload: ActivityFormPayload): Promise<void> {
  if (groupId.value === null) {
    return;
  }

  try {
    if (editingActivity.value !== null) {
      await ActivityService.updateActivity(editingActivity.value.id, payload);
      ToastService.success('Actividad actualizada.');
    } else {
      const key = activeSheetKey.value;
      await ActivityService.createActivity({
        groupId: groupId.value,
        committeeId: key === 'general' ? null : key,
        name: payload.name,
        description: payload.description,
        weight: payload.weight,
      });
      ToastService.success(`Actividad «${payload.name}» agregada.`);
    }

    isFormOpen.value = false;
    editingActivity.value = null;
    await loadSheet();
  } catch (error: unknown) {
    ToastService.error(resolveErrorMessage(error));
  }
}

function requestDeleteActivity(activityId: number): void {
  activityPendingDelete.value =
    sheet.value?.activityColumns.find((activity) => activity.id === activityId) ?? null;
}

async function confirmDeleteActivity(): Promise<void> {
  const target = activityPendingDelete.value;
  activityPendingDelete.value = null;
  if (target === null) {
    return;
  }

  try {
    await ActivityService.deleteActivity(target.id);
    ToastService.success(`Actividad «${target.name}» eliminada.`);
    await loadSheet();
  } catch (error: unknown) {
    ToastService.error(resolveErrorMessage(error));
  }
}

function onSetValue(activityId: number, memberId: number, value: Nullable<number>): void {
  const maxValue =
    sheet.value?.activityColumns.find((activity) => activity.id === activityId)?.weight ??
    LIMITS.MAX_PERCENTAGE;

  saveQueue = saveQueue.then(async (): Promise<void> => {
    try {
      await PermanenceSheetService.setValue(activityId, memberId, value, maxValue);
      ToastService.success('Cambios guardados.', 'permanence-save');
    } catch (error: unknown) {
      ToastService.error(resolveErrorMessage(error), 'permanence-save');
    }
    // Tras un error la recarga devuelve la celda al valor guardado.
    await loadSheet();
  });
}

async function exportToExcel(): Promise<void> {
  if (groupId.value === null || isExporting.value) {
    return;
  }
  isExporting.value = true;
  try {
    const groupName = group.value?.name ?? 'Permanencia';
    const blob = await ExcelExportService.buildPermanenceBlob(groupId.value);
    downloadBlob(blob, `${slugify(groupName) || 'grupo'}-permanencia.xlsx`);
    ToastService.success('Tabla de permanencia exportada a Excel.');
  } catch {
    ToastService.error('No se pudo generar el archivo de Excel.');
  } finally {
    isExporting.value = false;
  }
}

function handleExportClick(): void {
  void exportToExcel();
}

function goBack(): void {
  if (isAdminRoute.value && groupId.value !== null) {
    void router.push({
      name: ROUTE_NAMES.ADMIN_GROUP_DETAIL,
      params: { id: String(groupId.value) },
    });
    return;
  }
  void router.push({ name: ROUTE_NAMES.BOARD_HOME });
}

onMounted(() => {
  void load();
});
</script>

<template>
  <section class="mx-auto max-w-[110rem] space-y-6">
    <button
      type="button"
      class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-brand-700"
      @click="goBack"
    >
      <i class="fa-solid fa-arrow-left" />
      Volver
    </button>

    <p v-if="isLoading" class="text-sm text-slate-500">Cargando tabla de permanencia…</p>

    <div
      v-else-if="group === null"
      class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"
    >
      <p class="text-sm text-slate-500">No se encontró el grupo estudiantil.</p>
    </div>

    <template v-else>
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-ink">Tabla de permanencia</h2>
          <p class="text-sm text-slate-500">{{ group.name }} — hoja «{{ activeSheetLabel }}»</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppButton variant="secondary" @click="openCreate">
            <i class="fa-solid fa-plus" />
            Agregar actividad
          </AppButton>
          <AppButton :disabled="isExporting" @click="handleExportClick">
            <i class="fa-solid fa-file-excel" />
            {{ isExporting ? 'Exportando…' : 'Exportar a Excel' }}
          </AppButton>
        </div>
      </div>

      <div class="flex flex-wrap gap-1 border-b border-slate-200">
        <button
          v-for="option in sheetOptions"
          :key="String(option.key)"
          type="button"
          class="-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition"
          :class="
            option.key === activeSheetKey
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-brand-700'
          "
          @click="selectSheet(option.key)"
        >
          {{ option.label }}
        </button>
      </div>

      <p class="text-xs text-slate-400">
        En cada celda escribe los puntos obtenidos en esa actividad (número entero, máximo = su
        peso); una celda vacía significa que aún no se ha calificado. El
        <strong>puntaje</strong> es la suma de los puntos obtenidos en la hoja. Verde = cumple el
        objetivo de su estado de miembro; rojo = no lo cumple.
      </p>

      <p
        v-if="sheet !== null && sheet.activityColumns.length > 0"
        class="text-xs font-semibold"
        :class="sheetWeightTotal > LIMITS.MAX_PERCENTAGE ? 'text-red-600' : 'text-slate-500'"
      >
        Pesos de esta hoja: {{ sheetWeightTotal }}% de {{ LIMITS.MAX_PERCENTAGE }}%.
      </p>

      <PermanenceTable
        v-if="sheet !== null"
        :sheet="sheet"
        @set-value="onSetValue"
        @view-activity="openView"
        @edit-activity="openEdit"
        @delete-activity="requestDeleteActivity"
      />

      <ActivityDetailModal :activity="viewingActivity" @close="viewingActivity = null" />

      <ActivityFormModal
        :open="isFormOpen"
        :sheet-label="activeSheetLabel"
        :activity="editingActivity"
        :available-weight="availableWeight"
        @submit="onFormSubmit"
        @close="isFormOpen = false"
      />

      <ConfirmDialog
        :open="activityPendingDelete !== null"
        title="Eliminar actividad"
        :message="deleteMessage"
        confirm-label="Eliminar actividad"
        tone="danger"
        @confirm="confirmDeleteActivity"
        @cancel="activityPendingDelete = null"
      />
    </template>
  </section>
</template>
