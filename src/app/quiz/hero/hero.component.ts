import { AfterViewInit, Component, computed, ElementRef, inject, input, OnDestroy, signal, ViewChild } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { QuizContent } from '../quiz-content';

@Component({
  selector: 'app-hero', standalone: true, imports: [ButtonComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
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
