import { Component, inject, OnInit, signal } from '@angular/core';
import { QuizContent } from './quiz/quiz-content';
import { QuizContentService } from './quiz/quiz-content.service';
import { HeaderComponent } from './quiz/header/header.component';
import { HeroComponent } from './quiz/hero/hero.component';
import { PrizesComponent } from './quiz/prizes/prizes.component';
import { LeaderboardComponent } from './quiz/leaderboard/leaderboard.component';
import { MechanicsComponent } from './quiz/mechanics/mechanics.component';
import { FinalCtaComponent } from './quiz/final-cta/final-cta.component';
import { FooterComponent } from './quiz/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, HeroComponent, PrizesComponent, LeaderboardComponent, MechanicsComponent, FinalCtaComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
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
