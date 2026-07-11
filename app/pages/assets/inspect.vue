<!-- app/pages/assets/inspect.vue -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">
      <!-- Breadcrumb -->
      <div class="mb-5">
        <nav
          class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs sm:text-sm shadow-sm flex-wrap">
          <NuxtLink :to="{ path: `/assets` }"
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
            <font-awesome-icon :icon="['fas', 'server']" class="text-[11px]" />Assets Overview
          </NuxtLink>

          <template v-if="selectedAsset">
            <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
            <NuxtLink :to="{ path: `/assets/${selectedAsset.uuid}` }"
              class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
              <font-awesome-icon :icon="['fas', 'hard-drive']" class="text-[11px] text-primary" /><span
                class="truncate max-w-[10rem] sm:max-w-none">{{ selectedAsset.name }} Page</span>
            </NuxtLink>

            <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
            <span class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
              <font-awesome-icon :icon="['fas', 'clipboard-check']" class="text-[11px] text-ribbon-teal" /><span
                class="truncate max-w-[10rem] sm:max-w-none">{{ viewingExisting ? 'Inspection record' :
                `${selectedAsset.name} Inspection` }}</span>
            </span>
          </template>
        </nav>
      </div>

      <!-- Header -->
      <header
        class="g-card relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6">
        <div class="flex items-center gap-4 min-w-0">
          <div
            class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <font-awesome-icon :icon="['fas', 'clipboard-check']" class="text-xl" />
          </div>
          <div class="min-w-0">
            <h1 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold text-on-surface break-words">
              {{ headerTitle }}</h1>
            <p class="text-xs sm:text-sm text-outline mt-0.5">PPM · safety · routine checklists</p>
          </div>
        </div>
      </header>

      <!-- feedback -->
      <div v-if="feedback.msg" :class="feedback.kind === 'error' ? 'alert-error' : 'alert-success'">
        <font-awesome-icon :icon="['fas', feedback.kind === 'error' ? 'circle-exclamation' : 'circle-check']"
          class="mt-0.5" />
        <span class="text-sm sm:text-base break-words">{{ feedback.msg }}</span>
      </div>

      <!-- ═══════════ LOADING an existing record ═══════════ -->
      <SkeletonPanel v-if="showSkeleton" :bars="4" />
      <div v-else-if="loadingRecord" />

      <!-- ═══════════ LANDING (no uuid, no mode chosen) ═══════════ -->
      <template v-else-if="screen === 'landing'">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <button type="button" class="g-card p-6 sm:p-8 text-left hover:-translate-y-0.5 hover:shadow-xl transition-all group"
            @click="startWizard()">
            <div
              class="w-14 h-14 rounded-2xl bg-ribbon-teal/15 text-ribbon-teal flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <font-awesome-icon :icon="['fas', 'clipboard-check']" class="text-2xl" />
            </div>
            <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-1 break-words">Make
              an inspection</h3>
            <p class="text-sm sm:text-base md:text-lg text-on-surface-variant break-words">Run a checklist against an
              asset and record the outcome.</p>
          </button>

          <button type="button" class="g-card p-6 sm:p-8 text-left hover:-translate-y-0.5 hover:shadow-xl transition-all group"
            @click="navigateTo('/assets/overview?tab=inspections')">
            <div
              class="w-14 h-14 rounded-2xl bg-ribbon-purple/15 text-ribbon-purple flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <font-awesome-icon :icon="['fas', 'list-check']" class="text-2xl" />
            </div>
            <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-1 break-words">View
              inspections</h3>
            <p class="text-sm sm:text-base md:text-lg text-on-surface-variant break-words">Browse every previously
              recorded inspection — click one to open its full record.</p>
          </button>
        </div>
      </template>

      <!-- ═══════════ WIZARD ═══════════ -->
      <template v-else-if="screen === 'wizard'">
        <!-- stepper -->
        <div class="g-card p-3 sm:p-4 overflow-x-auto scroll-area">
          <div class="flex items-center gap-2 min-w-fit">
            <template v-for="(s, i) in steps" :key="s.key">
              <div class="flex items-center gap-2 shrink-0">
                <div class="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                  :class="i === stepIdx ? 'bg-primary-gradient text-white shadow-md' : i < stepIdx ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-surface-low text-on-surface-variant'">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold"
                    :class="i === stepIdx ? 'bg-white/25' : i < stepIdx ? 'bg-ribbon-teal/25' : 'bg-white/70'">
                    <font-awesome-icon v-if="i < stepIdx" :icon="['fas', 'check']" />
                    <template v-else>{{ i + 1 }}</template>
                  </span>
                  <span class="text-xs sm:text-sm font-bold whitespace-nowrap">{{ s.label }}</span>
                </div>
                <font-awesome-icon v-if="i < steps.length - 1" :icon="['fas', 'chevron-right']"
                  class="text-outline/50 text-xs shrink-0" />
              </div>
            </template>
          </div>
        </div>

        <!-- ───── STEP: GENERAL ───── -->
        <div v-show="currentKey === 'general'" class="g-card p-6 sm:p-8">
          <h3 class="text-lg sm:text-xl font-bold mb-5 flex items-center gap-2"><span class="ribbon-dot-blue" /> General
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="input-label">Asset *</label>
              <SearchSelect v-model="form.asset_uuid" :options="assets" option-value="uuid" option-label="name"
                :option-subtitle="(a) => `${a.asset_tag} · ${a.type?.name ?? ''}`" icon="cubes"
                placeholder="Select an asset…" search-placeholder="Search by name, tag…" @change="onAssetPick" />
            </div>
            <div>
              <label class="input-label">Asset type *</label>
              <SearchSelect v-model="form.asset_type_id" :options="types" option-value="id"
                :option-label="(t) => `${t.name} (${t.code})`" icon="tag" placeholder="Select type…"
                search-placeholder="Search types…" @change="onTypePick" />
            </div>
            <div>
              <label class="input-label">Inspection type *</label>
              <div class="filter-wrap">
                <select v-model="form.inspection_type" class="filter-select">
                  <option v-for="t in INSPECTION_TYPES" :key="t" :value="t">{{ titleCase(t) }}</option>
                </select>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
              </div>
            </div>
            <div>
              <label class="input-label">Inspection date</label>
              <input v-model="form.inspection_date" type="date" class="input-field" />
            </div>
            <div v-if="form.inspection_type === 'PPM_PROTOCOL'">
              <label class="input-label">Quarter *</label>
              <div class="filter-wrap">
                <select v-model="form.quarter" class="filter-select">
                  <option v-for="q in QUARTERS" :key="q" :value="q">{{ q }}</option>
                </select>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
              </div>
            </div>
          </div>
        </div>

        <!-- ───── STEP: CHECKLIST SOURCE ───── -->
        <div v-show="currentKey === 'checklist'" class="g-card p-6 sm:p-8">
          <h3 class="text-lg sm:text-xl font-bold mb-5 flex items-center gap-2"><span class="ribbon-dot-teal" />
            Checklist</h3>

          <!-- source toggle -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button type="button" class="p-5 rounded-2xl border text-left transition-all"
              :class="mode === 'template' ? 'border-ribbon-blue bg-ribbon-blue/8 shadow-sm' : 'border-outline-variant/40 bg-surface-low hover:bg-white'"
              @click="setMode('template')">
              <div class="flex items-center gap-2 mb-1">
                <font-awesome-icon :icon="['fas', 'clipboard-list']"
                  :class="mode === 'template' ? 'text-ribbon-blue' : 'text-outline'" />
                <span class="font-bold">Use a template</span>
              </div>
              <p class="text-xs text-on-surface-variant">Load an existing PPM / inspection protocol for this asset type.
              </p>
            </button>
            <button type="button" class="p-5 rounded-2xl border text-left transition-all"
              :class="mode === 'manual' ? 'border-ribbon-purple bg-ribbon-purple/8 shadow-sm' : 'border-outline-variant/40 bg-surface-low hover:bg-white'"
              @click="setMode('manual')">
              <div class="flex items-center gap-2 mb-1">
                <font-awesome-icon :icon="['fas', 'pen']"
                  :class="mode === 'manual' ? 'text-ribbon-purple' : 'text-outline'" />
                <span class="font-bold">Create manually</span>
              </div>
              <p class="text-xs text-on-surface-variant">Build your own sections and tasks from scratch.</p>
            </button>
          </div>

          <!-- template picker + editable rows -->
          <div v-if="mode === 'template'">
            <label class="input-label">Template (for {{ selectedType?.name || 'selected type' }})</label>
            <SearchSelect v-model="selectedTemplateUuid" :options="templates" option-value="uuid" option-label="name"
              :option-subtitle="(t) => `${t.asset_type?.name ?? ''} · ${t.task_count} tasks`" icon="clipboard-list"
              placeholder="Pick a template…" search-placeholder="Search templates…" @change="onTemplatePick" />
            <p v-if="loadingTemplates" class="text-xs text-on-surface-variant mt-2">Loading templates…</p>
            <p v-else-if="!templates.length" class="text-xs text-on-surface-variant mt-2">No templates for this asset
              type —
              switch to manual entry.</p>

            <div v-if="templateRows.length" class="mt-5 space-y-4">
              <div v-for="(grp, gi) in groupedTemplateRows" :key="gi"
                class="rounded-2xl border border-outline-variant/80 overflow-hidden">
                <div class="bg-ribbon-blue/8 px-4 py-2.5 text-sm font-bold break-words">{{ grp.section }}</div>
                <div class="divide-y divide-outline-variant/10">
                  <div v-for="row in grp.rows" :key="row._i" class="p-4 space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label class="input-label">Task</label>
                        <div class="text-md font-semibold text-on-surface leading-snug break-words mt-4">
                          {{ row.task }}
                        </div>
                      </div>
                      <div>
                        <label class="input-label">Result</label>
                        <div class="filter-wrap">
                          <select v-model="row.result" class="filter-select"
                            :class="!row.result && 'text-on-surface-variant'">
                            <option value="" disabled>Select result…</option>
                            <option v-for="r in (row.result_options || RESULT_OPTIONS)" :key="r" :value="r">{{
                              titleCase(r) }}
                            </option>
                          </select>
                          <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                        </div>
                      </div>

                      <div>
                        <label class="input-label">Comment</label>
                        <textarea v-model="row.comment" maxlength="500" rows="1" class="input-field resize-none"
                          placeholder="Add a comment (optional)…" />
                        <p class="text-[ppx] text-on-surface-variant text-right mt-0.5">{{ (row.comment || '').length
                          }}/500
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="mode === 'manual'" class="text-sm text-on-surface-variant">
            Continue to the next step to build your sections and tasks.
          </div>
        </div>

        <!-- ───── STEP: MANUAL BUILDER ───── -->
        <div v-show="currentKey === 'manual'" class="g-card p-6 sm:p-8">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg sm:text-xl font-bold flex items-center gap-2"><span class="ribbon-dot-purple" /> Build
              checklist
            </h3>
            <button class="btn-secondary !px-3 !py-1.5 text-xs sm:text-sm" @click="addSection">
              <font-awesome-icon :icon="['fas', 'plus']" /><span>Add section</span>
            </button>
          </div>

          <div class="space-y-5">
            <div v-for="(sec, si) in manualSections" :key="si"
              class="rounded-2xl border border-ribbon-purple/20 overflow-hidden">

              <div class="bg-ribbon-purple/8 px-4 py-3 flex items-center gap-2">
                <input v-model="sec.section" class="cust-input !py-2 font-bold" placeholder="Section name…" />
                <button
                  class="w-9 h-9 shrink-0 rounded-lg bg-error/10 text-error flex items-center justify-center hover:bg-error/20"
                  title="Remove section" @click="manualSections.splice(si, 1)">
                  <font-awesome-icon :icon="['fas', 'trash-can']" class="text-xs" />
                </button>
              </div>

              <div class="p-3 space-y-3">
                <div v-for="(t, ti) in sec.tasks" :key="ti" class="rounded-xl bg-surface-low/60 p-3 space-y-3">
                  <div class="flex items-start gap-2">
                    <input v-model="t.task" class="input-field !py-2 flex-1" placeholder="Task…" />
                    <button
                      class="w-9 h-9 shrink-0 rounded-lg bg-surface-container text-outline flex items-center justify-center hover:bg-error/10 hover:text-error"
                      title="Remove task" @click="sec.tasks.splice(ti, 1)">
                      <font-awesome-icon :icon="['fas', 'xmark']" class="text-xs" />
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="input-label">Result</label>
                      <div class="filter-wrap">
                        <select v-model="t.result" class="filter-select">
                          <option value="" disabled>Select result…</option>
                          <option v-for="r in RESULT_OPTIONS" :key="r" :value="r">{{ titleCase(r) }}</option>
                        </select>
                        <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                      </div>
                    </div>
                    <div>
                      <label class="input-label">Comment</label>
                      <textarea v-model="t.comment" maxlength="500" rows="2" class="input-field resize-none"
                        placeholder="Add a comment (optional)…" />
                      <p class="text-[10px] text-on-surface-variant text-right mt-0.5">{{ (t.comment || '').length
                      }}/500</p>
                    </div>
                  </div>
                </div>

                <button class="text-xs font-bold text-ribbon-purple hover:underline mt-1"
                  @click="sec.tasks.push({ task: '', result: '', comment: '' })">
                  <font-awesome-icon :icon="['fas', 'plus']" /> Add task
                </button>
              </div>

            </div>
            <p v-if="!manualSections.length" class="text-sm text-on-surface-variant text-center py-6">No sections yet —
              add one
              to begin.</p>
          </div>

          <!-- ── save this manual checklist as a reusable template ─────────────── -->
          <div class="mt-6 rounded-2xl border border-ribbon-blue/25 bg-ribbon-blue/5 p-4 sm:p-5">
            <div class="flex items-center gap-2 mb-4">
              <span class="ribbon-dot-blue" />
              <h4 class="text-sm sm:text-base font-bold text-on-surface">Save as reusable template</h4>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="input-label">Template code</label>
                <input v-model="templateMeta.code" class="input-field" placeholder="e.g. PPM-SYRINGE_PUMP" />
              </div>
              <div>
                <label class="input-label">Template name</label>
                <input v-model="templateMeta.name" class="input-field" placeholder="e.g. Syringe Pump PPM Protocol" />
              </div>
              <div>
                <label class="input-label">Frequency</label>
                <div class="filter-wrap">
                  <select v-model="templateMeta.frequency" class="filter-select">
                    <option v-for="f in FREQUENCY_OPTIONS" :key="f" :value="f">{{ titleCase(f) }}</option>
                  </select>
                  <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                </div>
              </div>
              <div>
                <label class="input-label">Asset type</label>
                <input :value="selectedType?.name || '—'" class="input-field" disabled />
              </div>
              <div class="sm:col-span-2">
                <label class="input-label">Description</label>
                <textarea v-model="templateMeta.description" rows="2" maxlength="1000" class="input-field resize-none"
                  placeholder="Short description of this protocol…" />
              </div>
            </div>
            <p class="text-[11px] text-on-surface-variant mt-2">
              Inspection type <b>{{ titleCase(form.inspection_type) }}</b> and the asset type above are taken from the
              General step. Saving a template does not submit this inspection.
            </p>
            <div class="flex justify-end mt-4">
              <button class="btn-primary" :disabled="savingTemplate" @click="saveAsTemplate">
                <font-awesome-icon :icon="['fas', savingTemplate ? 'circle-notch' : 'floppy-disk']"
                  :class="{ 'fa-spin': savingTemplate }" />
                <span>{{ savingTemplate ? 'Saving…' : 'Save as template' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ───── STEP: OUTCOME ───── -->
        <div v-show="currentKey === 'outcome'" class="g-card p-6 sm:p-8">
          <h3 class="text-lg sm:text-xl font-bold mb-5 flex items-center gap-2"><span class="ribbon-dot-amber" />
            Outcome</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="input-label">Outcome *</label>
              <div class="filter-wrap">
                <select v-model="form.outcome" class="filter-select">
                  <option v-for="o in OUTCOMES" :key="o" :value="o">{{ titleCase(o) }}</option>
                </select>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
              </div>
            </div>
            <div>
              <label class="input-label">Next due on</label>
              <input v-model="form.next_due_on" type="date" class="input-field" />
            </div>
            <div class="sm:col-span-2"><label class="input-label">Observations</label><textarea
                v-model="form.observations" rows="3" class="input-field" /></div>
            <div class="sm:col-span-2"><label class="input-label">Recommendations</label><textarea
                v-model="form.recommendations" rows="3" class="input-field" /></div>
            <div class="sm:col-span-2">
              <label class="input-label">Pictures (optional)</label>
              <input type="file" multiple accept="image/*"
                class="block w-full text-xs sm:text-sm text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-ribbon-teal/15 file:text-ribbon-teal file:font-bold file:cursor-pointer"
                @change="onPics($event)" />
              <p v-if="form.pictures.length" class="text-[11px] text-on-surface-variant mt-1">{{ form.pictures.length }}
                image(s) encoded</p>
            </div>
          </div>
        </div>

        <!-- ───── STEP: REVIEW ───── -->
        <div v-show="currentKey === 'review'" class="g-card p-6 sm:p-8">
          <h3 class="text-lg sm:text-xl font-bold mb-5 flex items-center gap-2"><span class="ribbon-dot-red" /> Review
            &amp;
            save</h3>

          <!-- editable general summary -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div><label class="input-label">Asset</label><input
                :value="selectedAsset ? `${selectedAsset.name} (${selectedAsset.asset_tag})` : '—'" class="input-field"
                disabled /></div>
            <div>
              <label class="input-label">Inspection type</label>
              <div class="filter-wrap"><select v-model="form.inspection_type" class="filter-select">
                  <option v-for="t in INSPECTION_TYPES" :key="t" :value="t">{{ titleCase(t) }}</option>
                </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
            </div>
            <div><label class="input-label">Inspection date</label><input v-model="form.inspection_date" type="date"
                class="input-field" /></div>
            <div v-if="form.inspection_type === 'PPM_PROTOCOL'">
              <label class="input-label">Quarter</label>
              <div class="filter-wrap"><select v-model="form.quarter" class="filter-select">
                  <option v-for="q in QUARTERS" :key="q" :value="q">{{ q }}</option>
                </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
            </div>
            <div>
              <label class="input-label">Outcome</label>
              <div class="filter-wrap"><select v-model="form.outcome" class="filter-select">
                  <option v-for="o in OUTCOMES" :key="o" :value="o">{{ titleCase(o) }}</option>
                </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
            </div>
            <div><label class="input-label">Next due on</label><input v-model="form.next_due_on" type="date"
                class="input-field" /></div>
            <div class="sm:col-span-2"><label class="input-label">Observations</label><textarea
                v-model="form.observations" rows="2" class="input-field" /></div>
            <div class="sm:col-span-2"><label class="input-label">Recommendations</label><textarea
                v-model="form.recommendations" rows="2" class="input-field" /></div>
          </div>

          <!-- editable checklist review (binds to the real rows so edits persist) -->
          <div class="flex items-center justify-between mb-2">
            <p class="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">Checklist</p>
            <span class="text-[11px] font-semibold text-on-surface-variant bg-surface-low px-2.5 py-1 rounded-full">{{
              finalChecklist.length }} task{{ finalChecklist.length === 1 ? '' : 's' }}</span>
          </div>

          <!-- template mode: grouped flat rows -->
          <div v-if="mode === 'template'" class="space-y-4">
            <div v-for="(grp, gi) in groupedTemplateRows" :key="gi"
              class="rounded-2xl border border-outline-variant/30 overflow-hidden">
              <div class="bg-ribbon-blue/8 px-4 py-2.5 text-sm font-bold break-words">{{ grp.section }}</div>
              <div class="divide-y divide-outline-variant/10">
                <div v-for="row in grp.rows" :key="row._i" class="p-4 space-y-3">
                  <p class="text-sm font-semibold text-on-surface leading-snug break-words">{{ row.task }}</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="input-label">Result</label>
                      <div class="filter-wrap">
                        <select v-model="row.result" class="filter-select">
                          <option value="" disabled>Select result…</option>
                          <option v-for="r in (row.result_options || RESULT_OPTIONS)" :key="r" :value="r">{{
                            titleCase(r) }}
                          </option>
                        </select>
                        <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                      </div>
                    </div>
                    <div>
                      <label class="input-label">Comment</label>
                      <textarea v-model="row.comment" maxlength="500" rows="2" class="input-field resize-none"
                        placeholder="Add a comment (optional)…" />
                      <p class="text-[10px] text-on-surface-variant text-right mt-0.5">{{ (row.comment || '').length
                        }}/500</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p v-if="!templateRows.length"
              class="text-sm text-on-surface-variant text-center py-6 rounded-2xl border border-dashed border-outline-variant/30">
              No checklist tasks.</p>
          </div>

          <!-- manual mode: grouped real sections -->
          <div v-else class="space-y-4">
            <div v-for="(sec, si) in manualSections" :key="si"
              class="rounded-2xl border border-outline-variant/30 overflow-hidden">
              <div class="bg-ribbon-purple/8 px-4 py-2.5 text-sm font-bold break-words">{{ sec.section || 'General' }}
              </div>
              <div class="divide-y divide-outline-variant/10">
                <div v-for="(t, ti) in sec.tasks.filter(x => x.task && x.task.trim())" :key="ti" class="p-4 space-y-3">
                  <p class="text-sm font-semibold text-on-surface leading-snug break-words">{{ t.task }}</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="input-label">Result</label>
                      <div class="filter-wrap">
                        <select v-model="t.result" class="filter-select">
                          <option value="" disabled>Select result…</option>
                          <option v-for="r in RESULT_OPTIONS" :key="r" :value="r">{{ titleCase(r) }}</option>
                        </select>
                        <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                      </div>
                    </div>
                    <div>
                      <label class="input-label">Comment</label>
                      <textarea v-model="t.comment" maxlength="500" rows="2" class="input-field resize-none"
                        placeholder="Add a comment (optional)…" />
                      <p class="text-[10px] text-on-surface-variant text-right mt-0.5">{{ (t.comment || '').length
                        }}/500</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p v-if="!finalChecklist.length"
              class="text-sm text-on-surface-variant text-center py-6 rounded-2xl border border-dashed border-outline-variant/30">
              No checklist tasks.</p>
          </div>
        </div>

        <!-- nav bar -->
        <div class="g-card p-4 flex items-center justify-between gap-3 sticky bottom-3 z-20">
          <button class="btn-secondary" :disabled="stepIdx === 0" @click="back"><font-awesome-icon
              :icon="['fas', 'chevron-left']" /><span>Back</span></button>
          <p v-if="stepError" class="text-xs sm:text-sm text-error font-semibold break-words">{{ stepError }}</p>
          <button v-if="currentKey !== 'review'" class="btn-primary" @click="next"><span>Next</span><font-awesome-icon
              :icon="['fas', 'chevron-right']" /></button>
          <button v-else class="btn-primary" :disabled="saving" @click="submit"><font-awesome-icon
              :icon="['fas', 'check']" /><span>{{ saving ? 'Saving…' : 'Save inspection' }}</span></button>
        </div>
      </template>

      <!-- ═══════════ RESULT — read-only PPM document ═══════════ -->
      <template v-else>
        <div class="g-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 shrink-0 rounded-full bg-ribbon-teal/15 text-ribbon-teal flex items-center justify-center">
              <font-awesome-icon :icon="['fas', viewingExisting ? 'clipboard-check' : 'circle-check']" />
            </div>
            <div class="min-w-0">
              <p class="text-sm sm:text-base md:text-lg font-bold text-on-surface break-words">{{ viewingExisting ?
                'Inspection record' : 'Inspection recorded' }}</p>
              <p class="text-xs sm:text-sm text-outline break-words">Read-only PPM document · print or download below</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button class="btn-secondary text-sm sm:text-base" @click="printDoc"><font-awesome-icon
                :icon="['fas', 'print']" /><span>Print</span></button>
            <button class="btn-secondary text-sm sm:text-base" :disabled="downloadingPdf" @click="downloadPdf"><font-awesome-icon
                :icon="['fas', 'file-pdf']" /><span>{{ downloadingPdf ? 'Generating…' : 'PDF' }}</span></button>
            <button class="btn-primary text-sm sm:text-base" @click="finishResult"><font-awesome-icon
                :icon="['fas', 'check']" /><span>Done</span></button>
          </div>
        </div>

        <!-- colorful metadata summary — ribbon-coded outcome / type / department chips -->
        <div class="g-card p-5 sm:p-6">
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span class="px-3 py-1 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap"
              :class="resultOutcomeClass">
              <font-awesome-icon :icon="['fas', 'circle-check']" class="mr-1" />{{ titleCase(result?.outcome) }}
            </span>
            <span
              class="px-3 py-1 rounded-lg font-bold text-xs sm:text-sm bg-ribbon-blue/12 text-ribbon-blue whitespace-nowrap">
              {{ titleCase(result?.type) }}<span v-if="result?.quarter"> · {{ result.quarter }}</span>
            </span>
            <span v-if="result?.asset_tag"
              class="px-3 py-1 rounded-lg font-bold text-xs sm:text-sm bg-surface-high text-on-surface-variant font-mono whitespace-nowrap">
              {{ result.asset_tag }}
            </span>
            <span v-if="result?.department"
              class="px-3 py-1 rounded-lg font-bold text-xs sm:text-sm bg-ribbon-purple/12 text-ribbon-purple break-words">
              <span class="ribbon-dot-purple inline-block mr-1.5" />{{ result.department }}<span
                v-if="result?.sub_department"> · {{ result.sub_department }}</span>
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div class="min-w-0">
              <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Asset</p>
              <p class="text-sm sm:text-base font-semibold text-on-surface break-words">{{ result?.asset || '—' }}</p>
            </div>
            <div class="min-w-0">
              <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Date</p>
              <p class="text-sm sm:text-base font-semibold text-on-surface truncate">{{ result?.date || '—' }}</p>
            </div>
            <div class="min-w-0">
              <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Next due
                on</p>
              <p class="text-sm sm:text-base font-semibold text-on-surface truncate">{{ result?.next_due_on || '—' }}
              </p>
            </div>
            <div class="min-w-0">
              <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Inspected
                by</p>
              <p class="text-sm sm:text-base font-semibold text-on-surface truncate">{{ result?.inspected_by_id ?
                `Inspector #${result.inspected_by_id}` : '—' }}</p>
            </div>
            <div class="min-w-0">
              <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Tasks</p>
              <p class="text-sm sm:text-base font-semibold text-on-surface truncate">{{ (result?.checklist || []).length
                }}</p>
            </div>
          </div>

          <div v-if="result?.observations" class="mt-4 pt-4 border-t border-outline-variant/20">
            <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-ribbon-blue mb-1">Observations</p>
            <p class="text-sm sm:text-base text-on-surface break-words">{{ result.observations }}</p>
          </div>
          <div v-if="result?.recommendations" class="mt-3">
            <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-ribbon-teal mb-1">Recommendations</p>
            <p class="text-sm sm:text-base text-on-surface break-words">{{ result.recommendations }}</p>
          </div>
        </div>

        <!-- rendered reference-design document (same HTML used for print / pdf) -->
        <div class="g-card p-0 overflow-hidden">
          <iframe class="doc-frame" :srcdoc="previewHTML" title="Inspection document preview" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAssets, titleCase } from '~/composables/useAssets'

const route = useRoute()
const assetsApi = useAssets()

// enums
const INSPECTION_TYPES = ['ROUTINE', 'WEEKLY', 'PPM_PROTOCOL', 'ACCEPTANCE', 'SAFETY']
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const OUTCOMES = ['PASS', 'PASS_WITH_OBSERVATIONS', 'FAIL']
const RESULT_OPTIONS = ['PENDING', 'PASSED', 'FAILED']

// screen: landing | wizard | result
// ?uuid=<inspection_uuid>      → read-only detail view of a saved inspection
// ?asset_uuid=<asset_uuid>     → pre-select an asset and jump straight into the wizard
// ?template=<template_uuid>    → pre-load a checklist template and jump into the wizard
const queryUuid = (route.query.uuid as string) || ''
const queryAssetUuid = (route.query.asset_uuid as string) || ''
const queryTemplate = (route.query.template as string) || ''
const DRAFT_KEY = 'ibcc_inspect_draft_v1'
const DRAFT_TTL = 48 * 60 * 60 * 1000  // 48 hours
const screen = ref<'landing' | 'wizard' | 'result'>(queryUuid ? 'result' : (queryAssetUuid || queryTemplate) ? 'wizard' : 'landing')
const result = ref<any>(null)   // success payload OR fetched record → read-only PPM document
const viewingExisting = ref(false)   // true when `result` came from ?uuid= (fetched, not just-created)
const resolvedAssetUuid = ref('')    // asset uuid resolved by matching asset_tag, used for "Done" navigation
const loadingRecord = ref(false)
const { showSkeleton } = useDelayedLoading(loadingRecord)

// feedback
const feedback = reactive<{ msg: string; kind: 'success' | 'error' | '' }>({ msg: '', kind: '' })
const flash = (msg: string, kind: 'success' | 'error' = 'success') => {
  feedback.msg = msg; feedback.kind = kind
  if (kind === 'success') setTimeout(() => { if (feedback.msg === msg) feedback.msg = '' }, 4000)
}

// ── reference data ────────────────────────────────────────────────────────────
const assets = ref<any[]>([])
const types = ref<any[]>([])
const templates = ref<any[]>([])
const loadingTemplates = ref(false)

// ── wizard form ────────────────────────────────────────────────────────────────
const form = reactive<Record<string, any>>({
  asset_uuid: '', asset_type_id: '',
  inspection_type: 'PPM_PROTOCOL', inspection_date: '', quarter: 'Q1',
  outcome: 'PASS', observations: '', recommendations: '', next_due_on: '',
  pictures: [] as string[],
})
const mode = ref<'' | 'template' | 'manual'>('')

// resolves against the wizard's own selection first, falling back to the asset
// matched (by asset_tag) when we're just viewing a previously-saved record
const selectedAsset = computed(() =>
  assets.value.find((a: any) => a.uuid === (form.asset_uuid || resolvedAssetUuid.value)))
const headerTitle = computed(() => {
  if (viewingExisting.value) return selectedAsset.value ? `${selectedAsset.value.name} Inspection` : (result.value?.asset || 'Inspection record')
  return selectedAsset.value ? `${selectedAsset.value.name} Inspection` : 'Asset inspection'
})
const selectedType = computed(() => types.value.find((t: any) => String(t.id) === String(form.asset_type_id)))
const resultOutcomeClass = computed(() => {
  const o = result.value?.outcome
  if (o === 'FAIL') return 'bg-error/10 text-error'
  if (o === 'PASS_WITH_OBSERVATIONS') return 'bg-ribbon-amber/15 text-ribbon-amber'
  return 'bg-ribbon-teal/15 text-ribbon-teal'
})

// ── template state ──────────────────────────────────────────────────────────────
const selectedTemplateUuid = ref('')
const templateRows = ref<any[]>([])   // {_i, section, task, result, comment, result_options}
const groupedTemplateRows = computed(() => {
  const out: { section: string; rows: any[] }[] = []
  for (const r of templateRows.value) {
    let g = out.find((x) => x.section === r.section)
    if (!g) { g = { section: r.section, rows: [] }; out.push(g) }
    g.rows.push(r)
  }
  return out
})

// ── manual state ────────────────────────────────────────────────────────────────
const manualSections = ref<{ section: string; tasks: { task: string; result: string; comment: string }[] }[]>([])
const addSection = () => manualSections.value.push({ section: '', tasks: [{ task: '', result: '', comment: '' }] })

// ── save the manual checklist as a reusable template ─────────────────────────
const FREQUENCY_OPTIONS = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'BIENNIAL']
const savingTemplate = ref(false)
const templateMeta = reactive({ code: '', name: '', description: '', frequency: 'QUARTERLY' })

// sections/tasks reduced to the template payload shape (strings only; empties dropped)
const templateSectionsPayload = computed(() =>
  manualSections.value
    .map((s) => ({
      section: (s.section || '').trim(),
      tasks: s.tasks.map((t) => (t.task || '').trim()).filter(Boolean),
    }))
    .filter((s) => s.section && s.tasks.length))

const saveAsTemplate = async () => {
  if (!templateMeta.code.trim() || !templateMeta.name.trim()) {
    stepError.value = ''; flash('Template code and name are required.', 'error'); return
  }
  if (!form.asset_type_id) { flash('Select an asset type on the General step first.', 'error'); return }
  if (!templateSectionsPayload.value.length) { flash('Add at least one section with a task.', 'error'); return }
  savingTemplate.value = true
  try {
    const saved = await assetsApi.saveChecklistTemplate({
      code: templateMeta.code.trim(),
      name: templateMeta.name.trim(),
      description: templateMeta.description.trim() || undefined,
      asset_type_id: Number(form.asset_type_id),
      inspection_type: form.inspection_type,
      frequency: templateMeta.frequency,
      checklist: { sections: templateSectionsPayload.value },
    })
    flash(`Template “${saved?.name || templateMeta.name}” saved`)
    if (saved?.uuid) navigateTo(`/assets/checklist?uuid=${saved.uuid}`)   // → the new template's page
  } catch (e: any) { flash(e.message || 'Failed to save template', 'error') }
  finally { savingTemplate.value = false }
}

// ── steps (manual step only present in manual mode) ─────────────────────────────
const steps = computed(() => {
  const base = [
    { key: 'general', label: 'General' },
    { key: 'checklist', label: 'Checklist' },
  ] as { key: string; label: string }[]
  if (mode.value === 'manual') base.push({ key: 'manual', label: 'Build' })
  base.push({ key: 'outcome', label: 'Outcome' }, { key: 'review', label: 'Review' })
  return base
})
const stepIdx = ref(0)
const currentKey = computed(() => steps.value[stepIdx.value]?.key ?? 'general')
const stepError = ref('')
watch(steps, () => { if (stepIdx.value > steps.value.length - 1) stepIdx.value = steps.value.length - 1 })

// ── final checklist (mode-aware) ────────────────────────────────────────────────
const finalChecklist = computed(() => {
  if (mode.value === 'template') {
    return templateRows.value.map((r) => ({ section: r.section, task: r.task, result: r.result, comment: r.comment, result_options: r.result_options }))
  }
  const out: any[] = []
  for (const s of manualSections.value) {
    for (const t of s.tasks) {
      if (!t.task?.trim()) continue
      out.push({ section: s.section || 'General', task: t.task, result: t.result, comment: t.comment })
    }
  }
  return out
})
// the review table binds to the real rows directly (templateRows / manualSections)

// ── pickers ──────────────────────────────────────────────────────────────────
const onAssetPick = (a: any) => {
  if (!a) return
  // auto-select the asset's type, then refresh templates for it
  if (a.type?.id != null) { form.asset_type_id = a.type.id; loadTemplatesForType(a.type.id) }
}
const onTypePick = (t: any) => {
  selectedTemplateUuid.value = ''; templateRows.value = []
  if (t?.id != null) loadTemplatesForType(t.id)
}
const loadTemplatesForType = async (assetTypeId: any) => {
  loadingTemplates.value = true; templates.value = []
  try { const r = await assetsApi.getChecklistTemplates({ asset_type_id: assetTypeId }); templates.value = r?.data ?? [] }
  catch (e: any) { flash(e.message || 'Failed to load templates', 'error') }
  finally { loadingTemplates.value = false }
}
const onTemplatePick = async (t: any) => {
  templateRows.value = []
  if (!t?.uuid) return
  try {
    const full = await assetsApi.showChecklistTemplate(t.uuid)
    templateRows.value = (full.inspection_checklist ?? []).map((c: any, i: number) => ({
      _i: i, section: c.section, task: c.task, result: c.result === 'PENDING' ? '' : c.result,
      comment: c.comment ?? '', result_options: c.result_options ?? RESULT_OPTIONS,
    }))
  } catch (e: any) { flash(e.message || 'Failed to load template', 'error') }
}
const setMode = (m: 'template' | 'manual') => {
  mode.value = m
  if (m === 'manual' && !manualSections.value.length) addSection()
}

// deep-link: auto-select a template (from ?template=<uuid>) and seed its checklist.
// also preselects the template's asset type so the picker list is populated.
const applyTemplateByUuid = async (uuid: string) => {
  try {
    const full = await assetsApi.showChecklistTemplate(uuid)
    mode.value = 'template'
    selectedTemplateUuid.value = uuid
    if (full?.asset_type?.id != null) {
      form.asset_type_id = full.asset_type.id
      loadTemplatesForType(full.asset_type.id)   // populate the SearchSelect options
    }
    templateRows.value = (full.inspection_checklist ?? []).map((c: any, i: number) => ({
      _i: i, section: c.section, task: c.task, result: c.result === 'PENDING' ? 'PASSED' : c.result,
      comment: c.comment ?? '', result_options: c.result_options ?? RESULT_OPTIONS,
    }))
  } catch (e: any) { flash(e.message || 'Failed to load template', 'error') }
}

// ── pictures → base64 ────────────────────────────────────────────────────────────
const fileToBase64 = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f)
})
const onPics = async (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  form.pictures = await Promise.all(files.map(fileToBase64))
}

// ── navigation + validation ─────────────────────────────────────────────────────
const validateStep = (): string => {
  const k = currentKey.value
  if (k === 'general') {
    if (!form.asset_uuid) return 'Select an asset.'
    if (!form.asset_type_id) return 'Select an asset type.'
    if (!form.inspection_type) return 'Select an inspection type.'
    if (form.inspection_type === 'PPM_PROTOCOL' && !form.quarter) return 'Quarter is required for PPM protocol.'
  }
  if (k === 'checklist') {
    if (!mode.value) return 'Choose a template or manual entry.'
    if (mode.value === 'template' && !templateRows.value.length) return 'Pick a template to load its checklist.'
  }
  if (k === 'manual') {
    if (!finalChecklist.value.length) return 'Add at least one section with a task.'
  }
  if (k === 'outcome') {
    if (!form.outcome) return 'Select an outcome.'
  }
  return ''
}
const next = () => {
  const err = validateStep()
  stepError.value = err
  if (err) return
  if (stepIdx.value < steps.value.length - 1) stepIdx.value++
}
const back = () => { stepError.value = ''; if (stepIdx.value > 0) stepIdx.value-- }

// ── start / back helpers ────────────────────────────────────────────────────────
const startWizard = () => { screen.value = 'wizard'; stepIdx.value = 0 }
const finishResult = () => {
  if (viewingExisting.value) {
    navigateTo(resolvedAssetUuid.value ? `/assets/${resolvedAssetUuid.value}` : '/assets/overview?tab=inspections')
    return
  }
  navigateTo(queryAssetUuid && form.asset_uuid ? `/assets/${form.asset_uuid}` : '/assets')
}
const goBack = () => {
  if (screen.value === 'result') { finishResult(); return }
  if (screen.value === 'wizard' && !queryAssetUuid) { screen.value = 'landing'; return }
  navigateTo('/assets')
}

// ── submit ──────────────────────────────────────────────────────────────────────
const saving = ref(false)
const submit = async () => {
  const err = validateStep()
  stepError.value = err
  if (err) return
  if (!finalChecklist.value.length) { stepError.value = 'Checklist is empty.'; return }
  saving.value = true
  try {
    const res = await assetsApi.inspectAsset({
      uuid: form.asset_uuid,
      inspection_type: form.inspection_type,
      inspection_date: form.inspection_date || undefined,
      quarter: form.inspection_type === 'PPM_PROTOCOL' ? form.quarter : undefined,
      checklist: finalChecklist.value.map((c) => ({ section: c.section, task: c.task, result: c.result, comment: c.comment })),
      outcome: form.outcome,
      observations: form.observations || undefined,
      recommendations: form.recommendations || undefined,
      next_due_on: form.next_due_on || undefined,
      pictures: form.pictures.length ? form.pictures : undefined,
    })
    clearDraft()                       // draft no longer needed
    // fall back to the local form data if the API echoes a thin payload
    result.value = res || buildResultFromForm()
    if (!result.value.checklist?.length) result.value.checklist = finalChecklist.value
    flash('Inspection saved')
    screen.value = 'result'            // read-only PPM document view
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e: any) { flash(e.message || 'Failed to save inspection', 'error') }
  finally { saving.value = false }
}
// assemble a result-shaped object from the wizard form (fallback / offline echo)
const buildResultFromForm = () => ({
  asset: selectedAsset.value ? selectedAsset.value.name : '',
  type: form.inspection_type,
  date: form.inspection_date || todayStr(),
  quarter: form.inspection_type === 'PPM_PROTOCOL' ? form.quarter : null,
  outcome: form.outcome,
  observations: form.observations || '',
  recommendations: form.recommendations || '',
  checklist: finalChecklist.value.map((c) => ({ section: c.section, task: c.task, result: c.result, comment: c.comment })),
  next_due_on: form.next_due_on || null,
  pictures_url: [],
})

// ── localStorage draft (resume within 48h) ───────────────────────────────────
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
let draftReady = false   // gate saves until after the initial restore
const saveDraft = () => {
  if (!draftReady || screen.value !== 'wizard') return
  try {
    // NOTE: pictures (base64) are intentionally excluded — they can exceed the localStorage quota
    const snapshot = {
      savedAt: Date.now(),
      stepIdx: stepIdx.value, mode: mode.value, selectedTemplateUuid: selectedTemplateUuid.value,
      form: { ...form, pictures: [] },
      templateRows: templateRows.value,
      manualSections: manualSections.value,
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot))
  } catch { /* quota / serialization — ignore */ }
}
const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ } }
const restoreDraft = (): boolean => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return false
    const d = JSON.parse(raw)
    if (!d?.savedAt || Date.now() - d.savedAt > DRAFT_TTL) { clearDraft(); return false }
    // honour an explicit deep-link to a different asset over a stale draft
    if (queryAssetUuid && d.form?.asset_uuid && d.form.asset_uuid !== queryAssetUuid) return false
    Object.assign(form, d.form || {})
    form.pictures = []
    mode.value = d.mode || ''
    selectedTemplateUuid.value = d.selectedTemplateUuid || ''
    templateRows.value = d.templateRows || []
    manualSections.value = d.manualSections || []
    stepIdx.value = d.stepIdx || 0
    screen.value = 'wizard'
    if (form.asset_type_id) loadTemplatesForType(form.asset_type_id)  // repopulate the picker list
    return true
  } catch { return false }
}
// persist on any meaningful change (debounced)
let saveTimer: ReturnType<typeof setTimeout> | null = null
watch([() => ({ ...form, pictures: [] }), mode, stepIdx, selectedTemplateUuid, templateRows, manualSections, screen],
  () => { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 400) },
  { deep: true })

// ════════════════════ READ-ONLY PPM DOCUMENT (print / pdf) ════════════════════
const QSET = ['Q1', 'Q2', 'Q3', 'Q4']
const SECTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c])
const resultMark = (r: string) => r === 'PASSED' ? '✓' : r === 'FAILED' ? '✗' : '–'

// Builds the full self-contained reference-design HTML string.
// Used by both Print (iframe + window.print) and PDF (html2pdf.js).
// footer:true → include the "Created by / © IBCC" footer line.
const buildInspectionHTML = (data: any, { footer = true }: { footer?: boolean } = {}): string => {
  const isPPM = (data.type || '') === 'PPM_PROTOCOL'
  const quarter = data.quarter || ''
  // group checklist rows by section, preserving first-seen order
  const groups: { section: string; rows: any[] }[] = []
  for (const c of (data.checklist || [])) {
    let g = groups.find((x) => x.section === c.section)
    if (!g) { g = { section: c.section, rows: [] }; groups.push(g) }
    g.rows.push(c)
  }
  const outcomeColor = data.outcome === 'FAIL' ? '#c0395a' : data.outcome === 'PASS_WITH_OBSERVATIONS' ? '#e8a33d' : '#3dae8c'

  let body = ''
  groups.forEach((g, gi) => {
    body += `<tr class="sec"><td class="num">${SECTION_LETTERS[gi] || gi + 1}</td><td class="task">${esc(g.section)}</td>`
      + QSET.map((q) => `<td class="q">${q}</td>`).join('') + `<td class="cmt">COMMENT</td></tr>`
    g.rows.forEach((r: any, ri: number) => {
      body += `<tr><td class="num">${gi + 1}.${ri + 1}</td><td class="task">${esc(r.task)}</td>`
        + QSET.map((q) => `<td class="mark">${q === quarter ? resultMark(r.result) : ''}</td>`).join('')
        + `<td class="cmt">${esc(r.comment || '')}</td></tr>`
    })
  })

  const logoUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/images/ibcc_logo.png`

  const metaRows = [
    ['Inspection type', esc((data.type || '').replace(/_/g, ' '))],
    ['Date', esc(data.date || '')],
    isPPM ? ['Quarter', esc(quarter)] : null,
    ['Outcome', `<b style="color:${outcomeColor}">${esc((data.outcome || '').replace(/_/g, ' '))}</b>`],
    ['Next due on', esc(data.next_due_on || '—')],
    ['Inspected by', esc(data.inspected_by_id ? `Inspector #${data.inspected_by_id}` : '—')],
  ].filter(Boolean) as [string, string][]

  return `<!doctype html><html><head><meta charset="utf-8"><title>PPM Protocol — ${esc(data.asset || 'Inspection')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Tahoma, 'MS PGothic', Arial, sans-serif; color: #111; margin: 0; padding: 24px; font-size: 12px; }
  .doc { max-width: 1000px; margin: 0 auto; }
  .topbar { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #3d7fbf; padding-bottom: 10px; margin-bottom: 6px; }
  .logo { height: 48px; width: auto; max-width: 130px; object-fit: contain; display: block; }
  .org { font-size: 11px; color:#555; }
  .htitle { font-weight: 800; font-size: 15px; letter-spacing: .5px; }
  .titlebox { border: 1.5px solid #000; text-align: center; font-weight: 800; font-size: 16px; padding: 8px; margin: 12px 0; text-transform: uppercase; }
  table.meta { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  table.meta td { border: 1px solid #999; padding: 5px 8px; }
  table.meta td.k { background: #eef5fc; font-weight: 700; width: 150px; }
  table.ck { width: 100%; border-collapse: collapse; }
  table.ck td { border: 1px solid #000; padding: 4px 6px; vertical-align: middle; }
  table.ck thead td { background: #3d7fbf; color: #fff; font-weight: 800; text-align: center; }
  td.num { width: 42px; text-align: center; font-weight: 700; }
  td.task { text-align: left; }
  td.q, td.mark { width: 42px; text-align: center; }
  td.cmt { width: 200px; }
  tr.sec td { background: #e3eefb; font-weight: 800; text-transform: uppercase; }
  tr.sec td.q { background: #d6e8fa; }
  .mark { font-weight: 800; }
  .notes { margin-top: 14px; }
  .notes h4 { margin: 10px 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: .4px; color:#3d7fbf; }
  .notes .box { border: 1px solid #999; padding: 8px; min-height: 28px; white-space: pre-wrap; }
  .key { margin-top: 14px; font-size: 11px; color:#333; border-top: 1px solid #ccc; padding-top: 8px; }
  .foot { margin-top: 6px; font-size: 10px; color:#777; text-align: center; }
  @media print { body { padding: 0; } .doc { max-width: none; } tr { page-break-inside: avoid; } }
</style></head><body><div class="doc">
  <div class="topbar">
    <img class="logo" src="${logoUrl}" alt="IBCC" onerror="this.style.display='none'" />
    <div>
      <div class="htitle">PLANNED PREVENTIVE MAINTENANCE (PPM) PROTOCOL</div>
      <div class="org">International Blantyre Cancer Centre · Equipment inspection record</div>
    </div>
  </div>
  <div class="titlebox">${esc(data.asset || 'ASSET INSPECTION')}</div>
  <table class="meta"><tbody>
    ${metaRows.map(([k, v]) => `<tr><td class="k">${k}</td><td>${v}</td></tr>`).join('')}
  </tbody></table>
  <table class="ck">
    <thead><tr><td class="num">#</td><td class="task">PPM TASKS</td>${QSET.map((q) => `<td class="q">${q}</td>`).join('')}<td class="cmt">COMMENT</td></tr></thead>
    <tbody>${body || `<tr><td colspan="${QSET.length + 3}" style="text-align:center;padding:14px">No checklist tasks.</td></tr>`}</tbody>
  </table>
  <div class="notes">
    <h4>Observations</h4><div class="box">${esc(data.observations || '—')}</div>
    <h4>Recommendations</h4><div class="box">${esc(data.recommendations || '—')}</div>
  </div>
  <div class="key">Key: ✓ = Passed · ✗ = Failed · – = Pending &nbsp;|&nbsp; Q1 = Quarter 1, Q2 = Quarter 2, Q3 = Quarter 3, Q4 = Quarter 4</div>
  ${footer ? `<div class="foot">Created by ${esc(data.inspected_by_id ? `Inspector #${data.inspected_by_id}` : 'IBCC EHIS')} · © ${new Date().getFullYear()} International Blantyre Cancer Centre</div>` : ''}
</div></body></html>`
}

// ── Print — hidden iframe triggers the browser print dialog ───────────────────
// Renders the full reference-design document in isolation so only the document
// (not the app chrome) appears in the print preview.
const printDoc = () => {
  const html = buildInspectionHTML(result.value, { footer: true })
  if (!html) return
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;opacity:0;pointer-events:none;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }
  doc.open(); doc.write(html); doc.close()
  const win = iframe.contentWindow
  if (win) {
    const ready = (win as Window & { fonts?: FontFaceSet }).fonts?.ready
    const doPrint = () => { win.focus(); win.print() }
    ready ? ready.then(doPrint) : setTimeout(doPrint, 800)
  }
  setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 8000)
}

// ── Download PDF — html2pdf.js loaded from CDN inside an off-screen iframe ─────
// Avoids bundling html2pdf.js (no npm dependency / TS module). The iframe loads
// the library, renders .doc → canvas → a real .pdf, then messages back to clean up.
const downloadingPdf = ref(false)
const downloadPdf = () => {
  const html = buildInspectionHTML(result.value, { footer: true })
  if (!html) return
  downloadingPdf.value = true
  const filename = `PPM_${String(result.value?.asset || 'inspection').replace(/[^a-z0-9]+/gi, '_')}_${result.value?.date || todayStr()}.pdf`

  // off-screen but sized iframe (html2canvas needs real dimensions)
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:0;width:794px;height:3000px;border:0;z-index:-1;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); downloadingPdf.value = false; return }

  const pdfHtml = html.replace('</body>', `
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<script>
(function () {
  var el = document.querySelector('.doc');
  var opt = {
    margin: [6, 6, 6, 6],
    filename: '${filename}',
    image: { type: 'jpeg', quality: 0.97 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, scrollX: 0, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: 'css', avoid: 'tr' }
  };
  document.fonts.ready.then(function () {
    html2pdf().set(opt).from(el).save().then(function () { parent.postMessage('ibcc-pdf-done', '*'); });
  });
})();
<\/script>
</body>`)
  doc.open(); doc.write(pdfHtml); doc.close()

  const cleanup = () => { if (document.body.contains(iframe)) document.body.removeChild(iframe); downloadingPdf.value = false }
  const onMsg = (e: MessageEvent) => { if (e.data === 'ibcc-pdf-done') { window.removeEventListener('message', onMsg); setTimeout(cleanup, 500) } }
  window.addEventListener('message', onMsg)
  // safety fallback if the message never arrives
  setTimeout(() => { window.removeEventListener('message', onMsg); cleanup() }, 30000)
}

// live preview HTML for the on-screen read-only view
const previewHTML = computed(() => result.value ? buildInspectionHTML(result.value, { footer: true }) : '')

// ── mount ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [aRes, tRes] = await Promise.all([assetsApi.listAssets(), assetsApi.getTypes()])
    assets.value = aRes?.data ?? []
    types.value = tRes?.data ?? []
  } catch (e: any) { flash(e.message || 'Failed to load reference data', 'error') }

  // ?uuid= → read-only view of a previously-saved inspection record. Skip the
  // wizard/draft machinery entirely; this is a pure fetch-and-display path.
  if (queryUuid) {
    viewingExisting.value = true
    loadingRecord.value = true
    try {
      const data = await assetsApi.showInspection(queryUuid)
      result.value = data
      resolvedAssetUuid.value = assets.value.find((a: any) => a.asset_tag === data?.asset_tag)?.uuid || ''
      screen.value = 'result'
    } catch (e: any) {
      flash(e.message || 'Failed to load inspection', 'error')
      screen.value = 'landing'
    } finally { loadingRecord.value = false }
    draftReady = true
    return
  }

  // resume a saved draft (<48h) if present — survives reloads / crashes
  const resumed = restoreDraft()

  // otherwise, deep-link pre-selects the asset + its type, then preloads templates
  if (!resumed && queryAssetUuid) {
    form.asset_uuid = queryAssetUuid
    const a = assets.value.find((x: any) => x.uuid === queryAssetUuid)
    if (a?.type?.id != null) { form.asset_type_id = a.type.id; loadTemplatesForType(a.type.id) }
  }
  // deep-link from a template card → auto-use that template (user still picks the asset)
  if (!resumed && queryTemplate) {
    screen.value = 'wizard'
    await applyTemplateByUuid(queryTemplate)
  }
  draftReady = true   // begin persisting changes from here on
})
</script>

<style scoped>
.g-card {
  position: relative;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgba(61, 127, 191, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.4);
  animation: island-in 0.45s ease-out backwards;
}

.ribbon-dot-blue,
.ribbon-dot-teal,
.ribbon-dot-amber,
.ribbon-dot-purple,
.ribbon-dot-red {
  display: inline-block;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 9999px;
}

.ribbon-dot-blue {
  background: #3d7fbf;
}

.ribbon-dot-teal {
  background: #3dae8c;
}

.ribbon-dot-amber {
  background: #e8a33d;
}

.ribbon-dot-purple {
  background: #b05fa8;
}

.ribbon-dot-red {
  background: #c0395a;
}

.cust-input {
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-on-surface, #191c1e);
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1.5px transparent;
}

.cust-input:focus {
  outline: none;
  box-shadow: inset 0 0 0 1.5px #3d7fbf;
  background: #f7f9fb;
}

.filter-wrap {
  position: relative;
}

.filter-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: 1.5px solid #3d7fbf;
  border-radius: 0.75rem;
  padding: 0.7rem 2.25rem 0.7rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-on-surface, #191c1e);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1.5px transparent;
}

.filter-select:focus {
  outline: none;
  box-shadow: inset 0 0 0 1.5px #3d7fbf;
  background: #f7f9fb;
}

.filter-caret {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-outline, #727687);
  font-size: 0.7rem;
  pointer-events: none;
}

/* alive review table */
.alive-tbl tbody tr:nth-child(even) {
  background: rgba(25, 28, 30, 0.018);
}

.tbl-blue thead tr {
  background: linear-gradient(90deg, rgba(61, 127, 191, 0.14), rgba(61, 127, 191, 0.04));
}

.tbl-blue thead th {
  border-bottom: 2px solid rgba(61, 127, 191, 0.40);
}

.scroll-area::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scroll-area::-webkit-scrollbar-thumb {
  background: rgba(61, 127, 191, 0.2);
  border-radius: 10px;
}

.scroll-area {
  scrollbar-width: thin;
  scrollbar-color: rgba(61, 127, 191, 0.2) transparent;
}

@keyframes island-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* read-only PPM document preview (isolated iframe hosting the builder's HTML) */
.doc-frame {
  width: 100%;
  height: 75vh;
  border: 0;
  background: #fff;
  display: block;
}
</style>