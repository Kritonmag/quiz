import { Component, input } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { QuizContent } from '../quiz-content';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  readonly data = input.required<QuizContent['header']>();
}
