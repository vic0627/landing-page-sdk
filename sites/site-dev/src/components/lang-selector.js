import './lang-selector.css'

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.lang-toggle')
  const options = document.querySelector('.lang-options')

  if (!toggle || !options) return

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true'
    toggle.setAttribute('aria-expanded', String(!expanded))
    options.hidden = expanded
  })

  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !options.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false')
      options.hidden = true
    }
  })
})
