export function setupRouting() {
  const pages = document.querySelectorAll('.page')
  const navLinks = document.querySelectorAll('nav a')

  const routes: Record<string, string> = {
    '#settings': 'settings-page',
    '#sync': 'sync-page',
    '/': 'home-page',
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const href = link.getAttribute('href') || '/'

      pages.forEach((page) => page.classList.remove('active'))

      const targetPageId = routes[href]
      document.getElementById(targetPageId)?.classList.add('active')
    })
  })
}
