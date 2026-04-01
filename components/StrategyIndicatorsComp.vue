<template>
  <div class="strategy-indicators-page">
    <div class="page-header">
      <div class="page-header-top">
        <div>
          <h1><i class="pi pi-chart-line"></i> Strategy Indicators</h1>
          <p class="subtitle">{{ strategies.length }} strategies loaded from the engine</p>
        </div>
        <Button label="Reset to Defaults" icon="pi pi-refresh" severity="secondary" outlined size="small"
          @click="resetStrategies" :loading="resetting" />
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner text-4xl"></i>
    </div>

    <div v-else class="strategies-grid">
      <div v-for="strategy in strategies" :key="strategy.strategyId" class="strategy-card">
        <!-- Card Header -->
        <div class="strategy-header">
          <div class="strategy-title-row">
            <div class="strategy-meta">
              <Tag :value="strategy.enabled ? 'ENABLED' : 'DISABLED'" :severity="strategy.enabled ? 'success' : 'danger'"
                class="status-tag" />
              <Tag :value="formatTimeframe(strategy.timeframeSeconds)" severity="info" icon="pi pi-clock" class="tf-tag" />
            </div>
            <div class="strategy-actions">
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" title="Edit Strategy"
                @click="openEditDialog(strategy)" />
            </div>
          </div>
          <h2 class="strategy-name">{{ strategy.name }}</h2>
          <div class="strategy-id">{{ strategy.strategyId }}</div>
          <div v-if="strategy.pythonStrategyPath" class="strategy-path" v-tooltip.bottom="strategy.pythonStrategyPath">
            <i class="pi pi-code"></i> {{ truncatePath(strategy.pythonStrategyPath) }}
          </div>
        </div>

        <!-- Indicators -->
        <div class="strategy-section">
          <div class="section-label"><i class="pi pi-list"></i> Required Indicators</div>
          <div class="indicators-list">
            <div v-for="(ind, index) in strategy.indicators" :key="index" class="indicator-item">
              <span class="ind-name">{{ ind.indicator }}</span>
              <Tag :value="ind.InstrumentType" :severity="getInstrumentSeverity(ind.InstrumentType)" class="inst-tag" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:visible="editDialogVisible" modal :header="'Edit Strategy: ' + (editingStrategy?.strategyId || '')"
      :style="{ width: '500px' }" class="edit-dialog">
      <div v-if="editingStrategy" class="edit-form">
        <div class="edit-field">
          <label>Display Name</label>
          <InputText v-model="editForm.name" class="w-full" />
        </div>
        <div class="edit-row">
          <div class="edit-field flex-1">
            <label>Timeframe (Seconds)</label>
            <InputNumber v-model="editForm.timeframeSeconds" :min="1" class="w-full" />
          </div>
          <div class="edit-field">
            <label>Enabled</label>
            <ToggleSwitch v-model="editForm.enabled" />
          </div>
        </div>
        <div class="edit-field">
            <label>Python Strategy Path</label>
            <InputText v-model="editForm.pythonStrategyPath" class="w-full" placeholder="e.g. packages/tradeflow/strategies.py:MyStrategy" />
        </div>
      </div>
      <template #footer>
        <div class="edit-footer">
          <Button label="Cancel" text severity="secondary" @click="editDialogVisible = false" />
          <Button label="Save" icon="pi pi-check" @click="saveStrategy" :loading="saving" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import ToggleSwitch from 'primevue/toggleswitch';
import Dialog from 'primevue/dialog';
import Tooltip from 'primevue/tooltip';

const vTooltip = Tooltip;

const strategies = ref([]);
const loading = ref(true);
const resetting = ref(false);

// Edit dialog state
const editDialogVisible = ref(false);
const editingStrategy = ref(null);
const editForm = reactive({ 
  name: '', 
  enabled: true, 
  timeframeSeconds: 180,
  pythonStrategyPath: ''
});
const saving = ref(false);

// --- Data ---
async function fetchStrategies() {
  loading.value = true;
  try {
    const res = await fetch('/api/strategy-indicators');
    if (res.ok) {
      strategies.value = await res.json();
    }
  } catch (e) {
    console.error('Failed to fetch strategy indicators:', e);
  } finally {
    loading.value = false;
  }
}

// --- Edit Dialog ---
function openEditDialog(strategy) {
  editingStrategy.value = strategy;
  editForm.name = strategy.name;
  editForm.enabled = strategy.enabled;
  editForm.timeframeSeconds = strategy.timeframeSeconds;
  editForm.pythonStrategyPath = strategy.pythonStrategyPath || '';
  editDialogVisible.value = true;
}

async function saveStrategy() {
  saving.value = true;
  try {
    const body = {
      ...editingStrategy.value,
      name: editForm.name,
      enabled: editForm.enabled,
      timeframeSeconds: editForm.timeframeSeconds,
      pythonStrategyPath: editForm.pythonStrategyPath || null
    };
    
    const res = await fetch(`/api/strategy-indicators/${editingStrategy.value.strategyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (res.ok) {
      const idx = strategies.value.findIndex(s => s.strategyId === editingStrategy.value.strategyId);
      if (idx !== -1) {
        strategies.value[idx] = { ...strategies.value[idx], ...body };
      }
      editDialogVisible.value = false;
    }
  } catch (e) {
    console.error('Failed to save strategy:', e);
  } finally {
    saving.value = false;
  }
}

async function resetStrategies() {
  resetting.value = true;
  try {
    const res = await fetch('/api/strategy-indicators/reset', { method: 'POST' });
    if (res.ok) {
      await fetchStrategies();
    }
  } catch (e) {
    console.error('Failed to reset strategies:', e);
  } finally {
    resetting.value = false;
  }
}

// --- Formatters ---
function formatTimeframe(tf) {
  if (!tf) return 'N/A';
  if (tf >= 3600) return `${tf / 3600}h`;
  if (tf >= 60) return `${tf / 60}m`;
  return `${tf}s`;
}

function truncatePath(path) {
  if (!path) return '';
  const parts = path.split(':');
  const file = parts[0].split('/').pop();
  const cls = parts[1] || '';
  return cls ? `${file} › ${cls}` : file;
}

function getInstrumentSeverity(type) {
  const map = {
    'SPOT': 'info',
    'OPTIONS_BOTH': 'warn',
    'FUTURES': 'success'
  };
  return map[type] || 'secondary';
}

onMounted(fetchStrategies);
</script>

<style scoped>
.strategy-indicators-page {
  padding: 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-header h1 i {
  color: var(--primary-color);
}

.subtitle {
  margin: 0.35rem 0 0 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: var(--text-secondary);
}

/* Strategies Grid */
.strategies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

/* Strategy Card */
.strategy-card {
  background: var(--layout-glass-bg);
  border: 1px solid var(--layout-border);
  border-radius: var(--card-border-radius);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: all 0.3s ease;
}

.strategy-card:hover {
  border-color: rgba(var(--p-primary-500), 0.3);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* Header */
.strategy-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.strategy-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.strategy-actions {
  display: flex;
  gap: 0.25rem;
}

.strategy-name {
  margin: 0.75rem 0 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-color);
}

.strategy-id {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  letter-spacing: 0.02em;
}

.strategy-path {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--layout-border);
  width: fit-content;
}

/* Sections */
.strategy-section {
  border-top: 1px solid var(--layout-border);
  padding-top: 1rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.indicators-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.indicator-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(var(--p-primary-500), 0.04);
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(var(--p-primary-500), 0.1);
}

.ind-name {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary-color);
}

.tf-tag, .inst-tag {
  font-size: 0.7rem !important;
  font-weight: 700 !important;
}

/* Edit Dialog */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-field label {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.edit-row {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
}

.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
