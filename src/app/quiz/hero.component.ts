import { AfterViewInit, Component, computed, ElementRef, inject, input, OnDestroy, signal, ViewChild } from '@angular/core';
import { ButtonComponent } from '../components/button/button.component';
import { QuizContent } from './quiz-content';

@Component({
  selector: 'app-hero', standalone: true, imports: [ButtonComponent],
  template: `
    <section class="hero" id="about" aria-labelledby="hero-title">
      <div class="hero-inner container">
        <div class="hero-copy">
          <p class="eyebrow">{{ data().eyebrow }}</p>
          <picture class="hero-title-backdrop" aria-hidden="true">
            <source media="(max-width: 768px)" srcset="assets/figma/hero-frame2131330041-1-275.svg">
            <img src="assets/figma/hero-frame2131330041-1-1596.svg" alt="">
          </picture>
          <h1 id="hero-title"><span>{{ data().titleFirst }}</span><span class="hero-title-second">{{ data().titleSecond }}</span></h1>
          <p class="hero-subtitle">{{ data().subtitle }}</p>
        </div>
        <div class="question-stack">
          <div class="question-card" [class.question-card--without-photo]="currentQuestion().image === null" [class.question-card--q2]="currentQuestion().id === 'q2'" [class.question-card--q3]="currentQuestion().id === 'q3'">
            <p class="question-text" aria-live="polite" aria-atomic="true">{{ currentQuestion().text }}</p>
            <img class="question-stripes" src="assets/figma/shared-subtract-I1-1608-2813-15833.svg" alt="">
            @if (currentQuestion().image; as image) {
              @if (currentQuestion().id === 'q1') {
                <div class="signalist-clip"><img [src]="image" [alt]="currentQuestion().imageAlt ?? ''"></div>
              } @else {
                <img class="question-portrait" [src]="image" [alt]="currentQuestion().imageAlt ?? ''">
              }
            }
            <div class="question-answers">
              <button type="button" class="answer" (click)="nextQuestion()"><img src="assets/figma/shared-vector4558-stroke-I1-1608-2813-15839.svg" alt="">{{ currentQuestion().yes }}</button>
              <button type="button" class="answer" (click)="nextQuestion()"><img src="assets/figma/shared-union-I1-1608-2813-15845.svg" alt="">{{ currentQuestion().no }}</button>
            </div>
          </div>
        </div>
        <div class="hero-action">
          <p class="hero-ribbon" tabindex="0" #ribbonWindow>
            <span class="ribbon-readable">{{ data().ribbon }}</span>
            <span class="hero-ribbon-track" aria-hidden="true" #ribbonTrack>
              @for (group of [0, 1]; track group) {
                <span class="hero-ribbon-group">
                  @for (copy of ribbonCopies(); track copy) {
                    <span class="hero-ribbon-phrase" #ribbonPhrase>{{ data().ribbon }} <span>•</span></span>
                  }
                </span>
              }
            </span>
          </p>
          <app-button [label]="data().cta" variant="white" />
        </div>
      </div>
    </section>
  `
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  readonly data = input.required<QuizContent['hero']>();
  readonly questionIndex = signal(0);
  readonly currentQuestion = computed(() => this.data().questions[this.questionIndex()]);
  readonly ribbonCopies = signal([0, 1]);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  @ViewChild('ribbonWindow') private ribbonWindow!: ElementRef<HTMLElement>;
  @ViewChild('ribbonTrack') private ribbonTrack!: ElementRef<HTMLElement>;
  @ViewChild('ribbonPhrase') private ribbonPhrase!: ElementRef<HTMLElement>;
  private observer?: ResizeObserver;
  private destroyed = false;

  nextQuestion(): void {
    this.questionIndex.update(index => (index + 1) % this.data().questions.length);
  }

  private readonly updateSpeed = (): void => {
    if (this.destroyed) return;
    const phraseWidth = this.ribbonPhrase.nativeElement.getBoundingClientRect().width;
    const windowWidth = this.ribbonWindow.nativeElement.getBoundingClientRect().width;
    if (phraseWidth > 0 && windowWidth > 0) {
      const count = Math.max(2, Math.ceil(windowWidth / phraseWidth) + 1);
      if (count !== this.ribbonCopies().length) {
        this.ribbonCopies.set(Array.from({ length: count }, (_, index) => index));
      }
      this.ribbonTrack.nativeElement.style.setProperty('--ribbon-duration', `${phraseWidth * count / this.data().ribbonSpeedPxPerSecond}s`);
    }
  };

  private readonly updateVisibility = (): void => {
    this.host.nativeElement.classList.toggle('ribbon-hidden', document.hidden);
  };

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    queueMicrotask(this.updateSpeed);
    this.updateVisibility();
    window.addEventListener('resize', this.updateSpeed);
    document.addEventListener('visibilitychange', this.updateVisibility);
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(this.updateSpeed);
      this.observer.observe(this.ribbonWindow.nativeElement);
      this.observer.observe(this.ribbonPhrase.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.observer?.disconnect();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.updateSpeed);
      document.removeEventListener('visibilitychange', this.updateVisibility);
    }
  }
}
