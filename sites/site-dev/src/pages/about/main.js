import '@/styles/style.css'
import '@/components/logo.js'
import '@/components/lang-selector.js'
import { setupCounter } from '@/composables/counter.js'

setupCounter(document.querySelector('#counter'))
