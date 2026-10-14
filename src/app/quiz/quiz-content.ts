export interface LinkItem { id: string; label: string; href: string }
export interface PrizeCard { id: string; label: string; labelMobile?: string; titleFirst: string; titleSecond: string; description: string; illustration: string; illustrationDesktop: string; illustrationAlt: string }
export interface Player { id: string; place: string; name: string; score: string; avatar: string; avatarAlt: string }
export interface TopPlayer extends Player { decorDesktop: string; decorMobile: string }
export interface MechanicItem { id: string; number: string; label: string; description: string }
export interface QuizContent {
  header: { brandText: string; brandAlt: string; menuLabel: string; menu: LinkItem[]; cta: string };
  hero: {
    eyebrow: string; titleFirst: string; titleSecond: string; subtitle: string;
    question: { id: string; text: string; image: string; imageAlt: string; yes: string; no: string };
    ribbon: string; cta: string;
  };
  prizes: {
    eyebrow: string; titleFirst: string; titleSecond: string; intro: string;
    rules: { id: string; text: string }[]; cards: PrizeCard[]; cta: string;
  };
  leaderboard: { eyebrow: string; titleFirst: string; titleSecond: string; top: TopPlayer[]; other: Player[]; cta: string };
  mechanics: { eyebrow: string; titleFirst: string; titleSecond: string; items: MechanicItem[] };
  finalCta: { titleFirst: string; titleBrand: string; titleSecond: string; description: string; cta: string; imageAlt: string };
  footer: {
    brandText: string; brandAlt: string; title: string; description: string; linksLabel: string;
    organizerLabel: string; organizer: string; supportLabel: string; support: string;
    links: LinkItem[]; socials: (LinkItem & { icon: string })[]; copyright: string;
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textFields(value: unknown, fields: string[]): value is Record<string, string> {
  return record(value) && fields.every(field => typeof value[field] === 'string' && value[field].length > 0);
}

function items(value: unknown, fields: string[]): value is Record<string, string>[] {
  return Array.isArray(value) && value.every(item => textFields(item, ['id', ...fields])) &&
    new Set(value.map(item => item['id'])).size === value.length;
}

function localAsset(value: string): boolean {
  return value.startsWith('assets/figma/') && !value.includes('..');
}

export function isQuizContent(value: unknown): value is QuizContent {
  if (!record(value)) return false;
  const { header, hero, prizes, leaderboard, mechanics, finalCta, footer } = value;
  if (!textFields(header, ['brandText', 'brandAlt', 'menuLabel', 'cta']) ||
      !items(header['menu'], ['label', 'href']) || header['menu'].length === 0) return false;

  if (!textFields(hero, ['eyebrow', 'titleFirst', 'titleSecond', 'subtitle', 'ribbon', 'cta']) ||
      !textFields(hero['question'], ['id', 'text', 'image', 'imageAlt', 'yes', 'no']) ||
      !localAsset(hero['question']['image'])) return false;

  if (!textFields(prizes, ['eyebrow', 'titleFirst', 'titleSecond', 'intro', 'cta']) ||
      !items(prizes['rules'], ['text']) || prizes['rules'].length !== 3 ||
      !items(prizes['cards'], ['label', 'titleFirst', 'titleSecond', 'description', 'illustration', 'illustrationDesktop', 'illustrationAlt']) ||
      prizes['cards'].length !== 3 || prizes['cards'].some(card => card['labelMobile'] !== undefined && typeof card['labelMobile'] !== 'string') ||
      !prizes['cards'].every(card => localAsset(card['illustration']) && localAsset(card['illustrationDesktop']))) return false;

  if (!textFields(leaderboard, ['eyebrow', 'titleFirst', 'titleSecond', 'cta']) ||
      !items(leaderboard['top'], ['place', 'name', 'score', 'avatar', 'avatarAlt', 'decorDesktop', 'decorMobile']) || leaderboard['top'].length !== 3 ||
      !items(leaderboard['other'], ['place', 'name', 'score', 'avatar', 'avatarAlt']) || leaderboard['other'].length !== 7 ||
      ![...leaderboard['top'], ...leaderboard['other']].every(player => localAsset(player['avatar'])) ||
      !leaderboard['top'].every(player => localAsset(player['decorDesktop']) && localAsset(player['decorMobile']))) return false;

  if (!textFields(mechanics, ['eyebrow', 'titleFirst', 'titleSecond']) ||
      !items(mechanics['items'], ['number', 'label', 'description']) || mechanics['items'].length !== 3 ||
      !textFields(finalCta, ['titleFirst', 'titleBrand', 'titleSecond', 'description', 'cta', 'imageAlt'])) return false;

  return textFields(footer, ['brandText', 'brandAlt', 'title', 'description', 'linksLabel', 'organizerLabel', 'organizer', 'supportLabel', 'support', 'copyright']) &&
    items(footer['links'], ['label', 'href']) && footer['links'].length === 3 &&
    items(footer['socials'], ['label', 'href', 'icon']) && footer['socials'].length === 2 &&
    footer['socials'].every(social => localAsset(social['icon']));
}
