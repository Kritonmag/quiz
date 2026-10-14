# Quiz — «Железные факты»

Статическая адаптивная демонстрационная страница на Angular 20.3. Данные загружаются при открытии из `public/mocks/quiz.json`. Кнопки не запускают игру и не выполняют бизнес-действий; переходы по ссылкам отключены для демонстрации.

## Локальный запуск

Требуется Node.js 22.12+ и npm. Проверено на Node.js 22.15.0 и npm 10.9.2.

```sh
npm install
npm start
```

Откройте `http://localhost:4200/`. Для проверки production-сборки и типов:

```sh
npm run typecheck
npm run build
```

В dev server можно менять `public/mocks/quiz.json` без пересборки JavaScript: отредактируйте файл и перезагрузите страницу. После публикации меняйте опубликованный `mocks/quiz.json` на хостинге (локально это `dist/quiz-demo/browser/mocks/quiz.json`) и перезагрузите страницу. Неполный или некорректный JSON приводит к видимому сообщению об ошибке.

Сведения об источниках макета и ограничениях этапа P-03: [docs/implementation/p03/REPORT.md](docs/implementation/p03/REPORT.md).
