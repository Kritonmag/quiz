export interface LinkItem { id: string; label: string; href: string }
export interface PrizeCard { id: string; label: string; labelMobile?: string; titleFirst: string; titleSecond: string; description: string; illustration: string; illustrationDesktop: string; illustrationAlt: string }
export interface Player { id: string; place: string; name: string; score: string; avatar: string; avatarAlt: string }
export interface TopPlayer extends Player { decorDesktop: string; decorMobile: string }
export interface MechanicItem { id: string; number: string; label: string; description: string }
export interface HeroQuestion { id: string; text: string; image: string | null; imageAlt: string | null; yes: string; no: string }
export interface QuizContent {
  header: { brandText: string; brandAlt: string; menuLabel: string; menu: LinkItem[]; cta: string };
  hero: {
    eyebrow: string; titleFirst: string; titleSecond: string; subtitle: string;
    questions: HeroQuestion[];
    ribbon: string; ribbonSpeedPxPerSecond: number; cta: string;
  };
  prizes: {
    eyebrow: string; titleFirst: string; titleSecond: string; intro: string;
    sticky: { desktopTopPx: number; desktopStepPx: number; mobileTopPx: number; mobileStepPx: number; bottomGapPx: number; runwayPx: number };
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
  return (value.startsWith('assets/figma/') || value.startsWith('assets/hero-user/')) && !value.includes('..');
}

function numberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export function isQuizContent(value: unknown): value is QuizContent {
  if (!record(value)) return false;
  const { header, hero, prizes, leaderboard, mechanics, finalCta, footer } = value;
  if (!textFields(header, ['brandText', 'brandAlt', 'menuLabel', 'cta']) ||
      !items(header['menu'], ['label', 'href']) || header['menu'].length === 0) return false;

  if (!textFields(hero, ['eyebrow', 'titleFirst', 'titleSecond', 'subtitle', 'ribbon', 'cta']) ||
      !items(hero['questions'], ['text', 'yes', 'no']) || hero['questions'].length !== 3 ||
      !hero['questions'].every(question =>
        ['id', 'text', 'yes', 'no'].every(field => question[field].trim().length > 0) &&
        ((question['image'] === null && question['imageAlt'] === null) ||
          (typeof question['image'] === 'string' && localAsset(question['image']) &&
            /\.(png|jpe?g|webp|svg)$/i.test(question['image']) &&
            typeof question['imageAlt'] === 'string' && question['imageAlt'].trim().length > 0))) ||
      !numberInRange(hero['ribbonSpeedPxPerSecond'], 10, 300)) return false;

  if (!textFields(prizes, ['eyebrow', 'titleFirst', 'titleSecond', 'intro', 'cta']) ||
      !items(prizes['rules'], ['text']) || prizes['rules'].length !== 3 ||
      !items(prizes['cards'], ['label', 'titleFirst', 'titleSecond', 'description', 'illustration', 'illustrationDesktop', 'illustrationAlt']) ||
      prizes['cards'].length !== 3 || prizes['cards'].some(card => card['labelMobile'] !== undefined && typeof card['labelMobile'] !== 'string') ||
      !prizes['cards'].every(card => localAsset(card['illustration']) && localAsset(card['illustrationDesktop']))) return false;

  const sticky = prizes['sticky'];
  if (!record(sticky) ||
      !numberInRange(sticky['desktopTopPx'], 0, 300) ||
      !numberInRange(sticky['desktopStepPx'], 1, 150) ||
      !numberInRange(sticky['mobileTopPx'], 0, 100) ||
      !numberInRange(sticky['mobileStepPx'], 1, 100) ||
      !numberInRange(sticky['bottomGapPx'], 0, 100) ||
      !numberInRange(sticky['runwayPx'], 100, 2000)) return false;

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
