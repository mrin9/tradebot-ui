import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const AppPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#fef3ec',
            100: '#fbe2cd',
            200: '#f8c7a2',
            300: '#f3a46e',
            400: '#ef7e40',
            500: '#f05a28',
            600: '#df4014',
            700: '#b93012',
            800: '#932814',
            900: '#762413',
            950: '#401007'
        }
    }
});

export default defineNuxtConfig({
    compatibilityDate: '2024-04-03',
    devtools: { enabled: true },
    modules: [
        '@primevue/nuxt-module'
    ],
    primevue: {
        usePrimeVue: true,
        autoImport: true,
        options: {
            theme: {
                preset: AppPreset,
                options: {
                    darkModeSelector: '.dark-mode',
                    cssLayer: false
                }
            }
        }
    },
    css: [
        '~/assets/css/theme.css',
        '~/assets/css/utilities.css',
        '~/assets/css/layout.css'
    ],
    vite: {
        server: {
            proxy: {
                '/api': {
                    target: 'http://127.0.0.1:8000',
                    changeOrigin: true
                }
            }
        }
    }
});
