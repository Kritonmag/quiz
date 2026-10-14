import { AfterViewInit, Component, ElementRef, input, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { QuizContent } from '../quiz-content';

@Component({
  selector: 'app-prizes', standalone: true, imports: [ButtonComponent],
  templateUrl: './prizes.component.html',
  styleUrl: './prizes.component.css'
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
