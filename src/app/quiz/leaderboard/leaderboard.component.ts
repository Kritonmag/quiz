import { Component, input } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { QuizContent } from '../quiz-content';

@Component({
  selector: 'app-leaderboard', standalone: true, imports: [ButtonComponent],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent { readonly data = input.required<QuizContent['leaderboard']>(); }
