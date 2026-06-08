<script setup lang="ts">
definePageMeta({ layout: 'default' })

const {
  blocks,
  selectedId,
  current,
  renderedHtml,
  select,
  handleContentClick,
} = useSpec()
</script>

<template>
  <div>
    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Spécification (A → E)</h1>
        <p class="text-body-1 text-medium-emphasis">
          Documents de conception du projet, des données brutes (A) aux modèles
          économiques (E). Source : dossier <code>spec/</code> du dépôt.
        </p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4" lg="3">
        <v-card variant="outlined" class="pa-2">
          <v-list density="compact" nav>
            <template v-for="block in blocks" :key="block.id">
              <v-list-subheader class="text-uppercase">
                {{ block.label }}
              </v-list-subheader>
              <v-list-item
                v-for="doc in block.docs"
                :key="doc.id"
                :active="doc.id === selectedId"
                rounded="lg"
                @click="select(doc.id)"
              >
                <v-list-item-title class="text-body-2">
                  {{ doc.title }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ doc.id }}
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="8" lg="9">
        <v-card variant="outlined" class="pa-6">
          <div
            v-if="current"
            class="markdown-body"
            @click="handleContentClick"
            v-html="renderedHtml"
          />
          <v-sheet
            v-else
            height="240"
            class="d-flex align-center justify-center text-medium-emphasis"
          >
            Sélectionnez un document
          </v-sheet>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.markdown-body {
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  font-weight: 700;
  line-height: 1.25;
  margin: 1.4em 0 0.6em;
}

.markdown-body :deep(h1) {
  font-size: 1.7rem;
}

.markdown-body :deep(h2) {
  font-size: 1.35rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 0.2em;
}

.markdown-body :deep(h3) {
  font-size: 1.12rem;
}

.markdown-body :deep(p) {
  margin: 0.6em 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.4em;
  margin: 0.6em 0;
}

.markdown-body :deep(li) {
  margin: 0.25em 0;
}

.markdown-body :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(code) {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.86em;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}

.markdown-body :deep(pre) {
  background: rgba(0, 0, 0, 0.05);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid rgb(var(--v-theme-primary));
  margin: 0.8em 0;
  padding: 0.2em 1em;
  color: rgba(0, 0, 0, 0.7);
  background: rgba(0, 0, 0, 0.03);
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.9em 0;
  font-size: 0.9rem;
  display: block;
  overflow-x: auto;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0.45em 0.7em;
  text-align: left;
}

.markdown-body :deep(th) {
  background: rgba(0, 0, 0, 0.04);
  font-weight: 600;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin: 1.5em 0;
}
</style>
