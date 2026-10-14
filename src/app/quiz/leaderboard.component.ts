import { Component, input } from '@angular/core';
import { ButtonComponent } from '../components/button/button.component';
import { QuizContent } from './quiz-content';

@Component({
  selector: 'app-leaderboard', standalone: true, imports: [ButtonComponent],
  template: `
    <section class="leaderboard" id="rating" aria-labelledby="leaderboard-title">
      <div class="leaderboard-inner container">
        <p class="eyebrow">{{ data().eyebrow }}</p>
        <h2 id="leaderboard-title"><span>{{ data().titleFirst }}</span> {{ data().titleSecond }}</h2>
        <div class="podium">
          @for (player of data().top; track player.id) {
            <article class="podium-card" [class.podium-card--first]="player.id === 'rank-1'" [class.podium-card--second]="player.id === 'rank-2'">
              <picture class="podium-decor" aria-hidden="true"><source media="(max-width: 768px)" [srcset]="player.decorMobile"><img [src]="player.decorDesktop" alt=""></picture>
              <img class="podium-avatar" [src]="player.avatar" [alt]="player.avatarAlt">
              <p class="podium-place">/ {{ player.place }}</p>
              <h3>{{ player.name }}</h3>
              <p class="podium-score">{{ player.score }}</p>
            </article>
          }
        </div>
        <ol class="leaderboard-list" start="4">
          @for (player of data().other; track player.id) {
            <li><span class="rank">{{ player.place }}</span><img [src]="player.avatar" [alt]="player.avatarAlt"><span class="player-name">{{ player.name }}</span><span class="player-score">{{ player.score }}</span></li>
          }
        </ol>
        <app-button [label]="data().cta" />
      </div>
    </section>
  `
})
export class LeaderboardComponent { readonly data = input.required<QuizContent['leaderboard']>(); }
