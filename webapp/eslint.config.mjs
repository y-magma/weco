import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  files: ['app/**/*.{ts,vue}'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['@infrastructure/*', '@infrastructure/**'],
        message: 'Couche graphique : pas d\'import direct infrastructure.',
      }],
    }],
  },
}, {
  files: ['lib/application/**/*.{ts}'],
  ignores: ['lib/application/bootstrap/**'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@infrastructure/*', '@infrastructure/**'],
          message: 'Couche application : infrastructure autorisée uniquement dans bootstrap/.',
        },
        {
          group: ['vue', 'vue/**', 'echarts', 'echarts/**', 'app/*', 'app/**', '~/visualization/*', '~/visualization/**'],
          message: 'Couche application : pas de Vue, ECharts ni visualization.',
        },
      ],
    }],
  },
}, {
  files: ['lib/domain/**/*.{ts}'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['@application/*', '@infrastructure/*', 'app/*', 'vue', 'vue/**', 'echarts', 'echarts/**'],
        message: 'Couche domaine : code pur sans dépendance externe.',
      }],
    }],
  },
}, {
  files: ['lib/infrastructure/**/*.{ts}'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['@application/*', 'app/*', 'vue', 'vue/**', 'echarts', 'echarts/**'],
        message: 'Couche infrastructure : pas de Vue, ECharts ni application.',
      }],
    }],
  },
})
