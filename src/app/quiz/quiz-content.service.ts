import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { isQuizContent, QuizContent } from './quiz-content';

@Injectable({ providedIn: 'root' })
export class QuizContentService {
  private readonly http = inject(HttpClient);

  load(): Observable<QuizContent> {
    return this.http.get<unknown>('mocks/quiz.json').pipe(map(data => {
      if (!isQuizContent(data)) throw new Error('Invalid quiz content');
      return data;
    }));
  }
}
