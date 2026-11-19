<script setup lang="ts">
/* External Imports */
import { reactive, ref, watch } from 'vue';

/* Internal Imports */
import AlertBanner from '@/components/AlertBanner.vue';
import AppButton from '@/components/AppButton.vue';
import AppTextField from '@/components/AppTextField.vue';
import MultiSelect from '@/components/MultiSelect.vue';
import type { CommitteeInterface } from '@/interfaces/CommitteeInterface';
import type { CreateMemberDTO } from '@/dtos/CreateMemberDTO';
import type { MemberFormErrors, MemberFormValues } from '@/utils/memberFormValidation';
import type { MemberStatusInterface } from '@/interfaces/MemberStatusInterface';
import { DOCUMENT_TYPE_OPTIONS } from '@/constants/documentTypes';
import { LIMITS } from '@/constants/limits';
import { PROGRAM_OPTIONS } from '@/constants/programs';
import { hasMemberFormErrors, validateMemberForm } from '@/utils/memberFormValidation';

/* Types */
interface MemberModalForm extends MemberFormValues {
  committeeNames: string[];
}

/* Props */
const props = defineProps<{
  open: boolean;
  groupId: number;
  committees: CommitteeInterface[];
  statuses: MemberStatusInterface[];
}>();

/* Emits */
const emit = defineEmits<{ submit: [dto: CreateMemberDTO]; close: [] }>();

/* Reactive Variables */
const form = reactive<MemberModalForm>(buildEmptyForm());
const errors = ref<MemberFormErrors>({});

/* Watchers */
watch(
  () => props.open,
  (open: boolean): void => {
    if (open) {
      resetForm();
    }
  },
);

// El segundo programa no puede repetir al principal: si el usuario cambia el
// programa y coincide con el segundo, se limpia el segundo.
watch(
  () => form.program,
  (program: string): void => {
    if (program !== '' && form.secondProgram === program) {
      form.secondProgram = '';
    }
  },
);

/* Functions */
// Todos los campos arrancan vacíos (también los selects) para que nada se
// guarde con un valor que el usuario no eligió.
function buildEmptyForm(): MemberModalForm {
  return {
    email: '',
    idEpik: '',
    fullName: '',
    documentType: '',
    documentNumber: '',
    phone: '',
    program: '',
    secondProgram: '',
    memberStatusId: null,
    committeeNames: [],
  };
}

function resetForm(): void {
  Object.assign(form, buildEmptyForm());
  errors.value = {};
}

function onStatusChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  form.memberStatusId = value === '' ? null : Number(value);
}

function committeeIdsFromNames(names: string[]): number[] {
  return props.committees
    .filter((committee: CommitteeInterface) => names.includes(committee.name))
    .map((committee: CommitteeInterface) => committee.id);
}

function handleSubmit(): void {
  errors.value = validateMemberForm(form);
  if (
    hasMemberFormErrors(errors.value) ||
    form.memberStatusId === null ||
    form.documentType === ''
  ) {
    return;
  }

  emit('submit', {
    groupId: props.groupId,
    memberStatusId: form.memberStatusId,
    idEpik: Number(form.idEpik.trim()),
    fullName: form.fullName.trim(),
    documentType: form.documentType,
    documentNumber: form.documentNumber.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    program: form.program.trim(),
    secondProgram: form.secondProgram.trim(),
    committeeIds: committeeIdsFromNames(form.committeeNames),
  });
}

function handleClose(): void {
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div class="absolute inset-0 bg-ink/40" @click="handleClose" />

      <div
        class="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-lg font-bold text-ink">Agregar integrante</h2>
            <p class="mt-1 text-sm text-slate-500">Completa los datos del nuevo integrante.</p>
          </div>
          <button
            type="button"
            class="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-ink"
            @click="handleClose"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- `novalidate`: la validación (y sus mensajes) la hace el formulario,
             no el navegador. -->
        <form class="mt-5 space-y-4" novalidate @submit.prevent="handleSubmit">
          <div class="grid gap-4 sm:grid-cols-2">
            <AppTextField
              id="member-email"
              v-model="form.email"
              label="Correo electrónico"
              type="email"
              placeholder="usuario@eafit.edu.co"
              :maxlength="LIMITS.NAME_MAX_LENGTH"
              :error="errors.email"
              required
            />
            <AppTextField
              id="member-full-name"
              v-model="form.fullName"
              label="Nombre completo en mayúscula"
              :maxlength="LIMITS.NAME_MAX_LENGTH"
              :error="errors.fullName"
              required
            />
            <AppTextField
              id="member-epik"
              v-model="form.idEpik"
              label="ID EPIK"
              type="number"
              :error="errors.idEpik"
              required
            />
            <div class="space-y-1.5">
              <label for="member-doc-type" class="block text-sm font-semibold text-slate-700">
                Tipo de documento <span class="text-red-500">*</span>
              </label>
              <select
                id="member-doc-type"
                v-model="form.documentType"
                class="w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                :class="errors.documentType ? 'border-red-400' : 'border-slate-300'"
              >
                <option value="" disabled>Selecciona un tipo</option>
                <option v-for="option in DOCUMENT_TYPE_OPTIONS" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
              <p v-if="errors.documentType" class="text-xs font-medium text-red-500">
                {{ errors.documentType }}
              </p>
            </div>
            <AppTextField
              id="member-doc-number"
              v-model="form.documentNumber"
              label="Número de documento"
              :maxlength="20"
              :error="errors.documentNumber"
              required
            />
            <AppTextField
              id="member-phone"
              v-model="form.phone"
              label="Celular"
              :maxlength="15"
              :error="errors.phone"
              required
            />
            <div class="space-y-1.5">
              <label for="member-program" class="block text-sm font-semibold text-slate-700">
                Programa <span class="text-red-500">*</span>
              </label>
              <select
                id="member-program"
                v-model="form.program"
                class="w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                :class="errors.program ? 'border-red-400' : 'border-slate-300'"
              >
                <option value="" disabled>Selecciona un programa</option>
                <option v-for="option in PROGRAM_OPTIONS" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
              <p v-if="errors.program" class="text-xs font-medium text-red-500">
                {{ errors.program }}
              </p>
            </div>
            <div class="space-y-1.5">
              <label for="member-second-program" class="block text-sm font-semibold text-slate-700">
                Programa #2
              </label>
              <select
                id="member-second-program"
                v-model="form.secondProgram"
                class="w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                :class="errors.secondProgram ? 'border-red-400' : 'border-slate-300'"
              >
                <option value="">Sin segundo programa</option>
                <option
                  v-for="option in PROGRAM_OPTIONS.filter((item) => item !== form.program)"
                  :key="option"
                  :value="option"
                >
                  {{ option }}
                </option>
              </select>
              <p v-if="errors.secondProgram" class="text-xs font-medium text-red-500">
                {{ errors.secondProgram }}
              </p>
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="member-status" class="block text-sm font-semibold text-slate-700">
              Estado en el grupo <span class="text-red-500">*</span>
            </label>
            <select
              id="member-status"
              class="w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              :class="errors.memberStatusId ? 'border-red-400' : 'border-slate-300'"
              :value="form.memberStatusId ?? ''"
              @change="onStatusChange"
            >
              <option value="" disabled>Selecciona un estado</option>
              <option v-for="status in statuses" :key="status.id" :value="status.id">
                {{ status.name }}
              </option>
            </select>
            <p v-if="errors.memberStatusId" class="text-xs font-medium text-red-500">
              {{ errors.memberStatusId }}
            </p>
            <p v-else-if="statuses.length === 0" class="text-xs font-medium text-red-500">
              Este grupo no tiene estados de miembro. Un administrador debe crearlos al editar el
              grupo antes de agregar integrantes.
            </p>
          </div>

          <MultiSelect
            v-model="form.committeeNames"
            label="Área a la que pertenece"
            :options="committees.map((committee) => committee.name)"
            placeholder="Selecciona uno o más comités"
          />

          <AlertBanner
            v-if="hasMemberFormErrors(errors)"
            type="error"
            message="Revisa los campos marcados en rojo."
          />

          <div class="flex justify-end gap-3 pt-2">
            <AppButton variant="ghost" type="button" @click="handleClose">Cancelar</AppButton>
            <AppButton type="submit">Agregar integrante</AppButton>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
