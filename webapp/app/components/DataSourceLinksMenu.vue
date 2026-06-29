<script setup lang="ts">
import { DATA_SOURCE_WEBSITE_LINKS } from '@domain/catalog/dataSourceWebsites'
</script>

<template>
  <v-menu location="bottom end" :close-on-content-click="true">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        variant="text"
        prepend-icon="mdi-database-outline"
        append-icon="mdi-menu-down"
      >
        Bases de données
      </v-btn>
    </template>

    <v-list density="compact" min-width="280">
      <v-list-item
        v-for="link in DATA_SOURCE_WEBSITE_LINKS"
        :key="link.id"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
        prepend-icon="mdi-open-in-new"
        :title="link.label"
      />
    </v-list>
  </v-menu>
</template>
