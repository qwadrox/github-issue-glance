export class StarIcon {
  private readonly element: HTMLButtonElement
  private readonly isDetailPage: boolean

  constructor(isDetailPage: boolean = false, element?: HTMLButtonElement) {
    this.isDetailPage = isDetailPage
    this.element = element ?? this.createStarElement()
    this.applyStyles(this.element)
  }

  static fromElement(element: HTMLButtonElement, isDetailPage: boolean = false): StarIcon {
    return new StarIcon(isDetailPage, element)
  }

  private createStarElement(): HTMLButtonElement {
    const star = document.createElement('button')
    star.type = 'button'
    star.textContent = '★'
    star.classList.add('github-issue-star')
    return star
  }

  private applyStyles(element: HTMLButtonElement): void {
    element.type = 'button'
    element.style.cursor = 'pointer'
    element.style.background = 'transparent'
    element.style.border = '0'
    element.style.padding = '0'
    element.style.marginRight = '8px'
    element.style.display = 'inline-flex'
    element.style.alignItems = 'center'
    element.style.justifyContent = 'center'
    element.style.lineHeight = '1'
    element.style.fontSize = this.isDetailPage ? '32px' : '16px'
    element.style.verticalAlign = this.isDetailPage ? 'text-bottom' : 'middle'
    element.style.transition = 'color 0.2s ease'
    element.style.color = '#ccc'
  }

  public getElement(): HTMLButtonElement {
    return this.element
  }

  public setStarred(isStarred: boolean): void {
    this.element.style.color = isStarred ? '#e3b341' : '#ccc'
    this.element.setAttribute('aria-pressed', String(isStarred))
    this.element.setAttribute('aria-label', isStarred ? 'Unstar issue' : 'Star issue')
    this.element.title = isStarred ? 'Unstar issue' : 'Star issue'
  }

  public setClickHandler(handler: (event: MouseEvent) => void): void {
    this.element.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      handler(e)
    }
  }
}
