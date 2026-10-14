import { Component, inject, OnInit, signal } from '@angular/core';
import { QuizContent } from './quiz/quiz-content';
import { QuizContentService } from './quiz/quiz-content.service';
import { HeaderComponent } from './quiz/header.component';
import { HeroComponent } from './quiz/hero.component';
import { PrizesComponent } from './quiz/prizes.component';
import { LeaderboardComponent } from './quiz/leaderboard.component';
import { MechanicsComponent } from './quiz/mechanics.component';
import { FinalCtaComponent } from './quiz/final-cta.component';
import { FooterComponent } from './quiz/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, HeroComponent, PrizesComponent, LeaderboardComponent, MechanicsComponent, FinalCtaComponent, FooterComponent],
  template: `
    @if (content(); as page) {
      <app-header [data]="page.header" />
      <main>
        <app-hero [data]="page.hero" />
        <app-prizes [data]="page.prizes" />
        <app-leaderboard [data]="page.leaderboard" />
        <app-mechanics [data]="page.mechanics" />
        <app-final-cta [data]="page.finalCta" />
      </main>
      <app-footer [data]="page.footer" />
    } @else if (error()) {
      <main class="page-status" role="alert">
        <h1>Не удалось загрузить страницу</h1>
        <p>Проверьте соединение и попробуйте обновить страницу.</p>
      </main>
    } @else {
      <main class="page-status" role="status"><p>Загрузка страницы…</p></main>
    }
  `
})
export class AppComponent implements OnInit {
  private readonly contentService = inject(QuizContentService);
  readonly content = signal<QuizContent | null>(null);
  readonly error = signal(false);

  ngOnInit(): void {
    this.contentService.load().subscribe({
      next: data => this.content.set(data),
      error: () => this.error.set(true)
    });
  }
}
