export class StarIcon {
  private element: HTMLElement
  private isDetailPage: boolean

  constructor(isDetailPage: boolean = false) {
    this.isDetailPage = isDetailPage
    this.element = this.createStarElement()
  }

  private createStarElement(): HTMLElement {
    const star = document.createElement('span')
    star.innerHTML = '★'
    star.classList.add('github-issue-star')
    this.applyStyles(star)
    return star
  }

  private applyStyles(element: HTMLElement): void {
    element.style.cursor = 'pointer'
    element.style.marginRight = this.isDetailPage ? '0px' : '8px'
    element.style.fontSize = this.isDetailPage ? '32px' : '16px'
    element.style.verticalAlign = this.isDetailPage ? 'text-bottom' : 'middle'
    element.style.transition = 'color 0.2s ease'
    element.style.color = '#ccc'
  }

  public getElement(): HTMLElement {
    return this.element
  }

  public setStarred(isStarred: boolean): void {
    this.element.style.color = isStarred ? '#e3b341' : '#ccc'
  }

  public onClick(handler: (event: MouseEvent) => void): void {
    this.element.addEventListener('click', (e) => {
      e.stopPropagation()
      handler(e)
    })
  }
} 