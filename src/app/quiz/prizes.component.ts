import { AfterViewInit, Component, ElementRef, input, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ButtonComponent } from '../components/button/button.component';
import { QuizContent } from './quiz-content';

@Component({
  selector: 'app-prizes', standalone: true, imports: [ButtonComponent],
  template: `
    <section class="prizes" id="prizes" aria-labelledby="prizes-title">
      <div class="prizes-layout container">
        <div class="prizes-copy" #prizeCopy>
          <p class="eyebrow">{{ data().eyebrow }}</p>
          <h2 id="prizes-title">{{ data().titleFirst }} <span>{{ data().titleSecond }}</span></h2>
          <p class="prizes-intro">{{ data().intro }}</p>
          <ul class="prizes-rules">
            @for (rule of data().rules; track rule.id) {
              <li><img src="assets/figma/prizes-done-round-1-315.svg" alt=""><span>{{ rule.text }}</span></li>
            }
          </ul>
          <app-button class="prizes-cta" [label]="data().cta" />
        </div>
        <div class="prize-cards" #prizeCards>
          @for (card of data().cards; track card.id) {
            <article class="prize-card" #prizeCard [class.prize-card--main]="card.id === 'main'">
              @if (card.id === 'main') {
                <div class="prize-photo"><img [src]="card.illustration" [alt]="card.illustrationAlt"></div>
              }
              <div class="prize-card-copy">
                <p class="prize-label"><span class="desktop-label">{{ card.label }}</span><span class="mobile-label">{{ card.labelMobile || card.label }}</span></p>
                <div class="prize-message">
                  <h3>{{ card.titleFirst }} <span>{{ card.titleSecond }}</span></h3>
                  <p>{{ card.description }}</p>
                </div>
              </div>
              @if (card.id !== 'main') {
                <picture class="prize-illustration"><source media="(min-width: 769px)" [srcset]="card.illustrationDesktop"><img [src]="card.illustration" [alt]="card.illustrationAlt"></picture>
              }
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class PrizesComponent implements AfterViewInit, OnDestroy {
  readonly data = input.required<QuizContent['prizes']>();
  @ViewChild('prizeCopy') private prizeCopy!: ElementRef<HTMLElement>;
  @ViewChild('prizeCards') private prizeCards!: ElementRef<HTMLElement>;
  @ViewChildren('prizeCard') private cards!: QueryList<ElementRef<HTMLElement>>;
  private observer?: ResizeObserver;

  private readonly updateOffsets = (): void => {
    const config = this.data().sticky;
    const desktop = window.matchMedia('(min-width: 769px)').matches;
    const base = desktop ? config.desktopTopPx : config.mobileTopPx;
    const step = desktop ? config.desktopStepPx : config.mobileStepPx;
    const viewport = window.innerHeight;

    const cards = this.cards.toArray();
    const tops = cards.map((card, index) => {
      const height = card.nativeElement.getBoundingClientRect().height;
      return Math.min(base + index * step, viewport - height - config.bottomGapPx);
    });
    for (let index = tops.length - 2; index >= 0; index--) {
      tops[index] = Math.min(tops[index], tops[index + 1] - step);
    }
    cards.forEach((card, index) => {
      card.nativeElement.style.setProperty('--sticky-top', `${tops[index]}px`);
    });

    const copyHeight = this.prizeCopy.nativeElement.getBoundingClientRect().height;
    const copyTop = Math.min(base, viewport - copyHeight - config.bottomGapPx);
    this.prizeCopy.nativeElement.style.setProperty('--sticky-copy-top', `${copyTop}px`);
    this.prizeCards.nativeElement.style.setProperty('--sticky-runway', `${config.runwayPx}px`);
  };

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    this.updateOffsets();
    window.addEventListener('resize', this.updateOffsets);
    window.addEventListener('orientationchange', this.updateOffsets);
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(this.updateOffsets);
      this.observer.observe(this.prizeCopy.nativeElement);
      this.cards.forEach(card => this.observer?.observe(card.nativeElement));
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.updateOffsets);
      window.removeEventListener('orientationchange', this.updateOffsets);
    }
  }
}
