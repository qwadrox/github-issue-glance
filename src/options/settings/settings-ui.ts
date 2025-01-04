export function createSettingsUI(): HTMLElement {
  const container = document.createElement('div')
  container.className = 'pico settings-container'

  const form = document.createElement('form')
  form.id = 'settings-form'
  form.className = 'settings-form'
  form.innerHTML = `
        <label data-placement="left" data-tooltip="Mark issues as visited to highlight them in the list.">
            <input name="markVisited" type="checkbox" role="switch" />
            Mark Visited
        </label>
        <label data-placement="left" data-tooltip="The color of the visited issues in the list.">
            Mark Visited Color
            <input name="markVisitedColor" type="color" />
        </label>
        <button type="button" id="reset-settings">Reset to Defaults</button>
    `

  container.appendChild(form)
  return container
}
