export type ThemeId =
  | 'fluent-dark'
  | 'fluent-light'
  | 'tokyo-night'
  | 'catppuccin'
  | 'dracula'
  | 'github-dark';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  category: 'fluent' | 'developer';
  icon: string;
  isDark: boolean;
  tagline: string;
  colors: {
    bg: string;
    card: string;
    cardHover: string;
    sidebar: string;
    border: string;
    borderSubtle: string;
    accent: string;
    accentHover: string;
    accentSubtle: string;
    accentText: string;
    text: string;
    textSecondary: string;
    textMuted: string;
  };
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  'fluent-dark': {
    id: 'fluent-dark',
    name: 'Fluent Dark',
    category: 'fluent',
    icon: '🌙',
    isDark: true,
    tagline: 'Windows 11 Mica Dark & Dev Home chính thức',
    colors: {
      bg: '#202020',
      card: '#2B2B2B',
      cardHover: '#323232',
      sidebar: '#1E1E1E',
      border: 'rgba(255, 255, 255, 0.08)',
      borderSubtle: 'rgba(255, 255, 255, 0.04)',
      accent: '#0F6CBD',
      accentHover: '#115EA3',
      accentSubtle: 'rgba(15, 108, 189, 0.18)',
      accentText: '#FFFFFF',
      text: '#FFFFFF',
      textSecondary: '#C8C8C8',
      textMuted: '#8A8A8A',
    },
  },
  'fluent-light': {
    id: 'fluent-light',
    name: 'Fluent Light',
    category: 'fluent',
    icon: '☀️',
    isDark: false,
    tagline: 'Windows 11 Mica Light sáng tinh khiết và trang nhã',
    colors: {
      bg: '#F3F3F3',
      card: '#FFFFFF',
      cardHover: '#FAFAFA',
      sidebar: '#ECECEC',
      border: 'rgba(0, 0, 0, 0.08)',
      borderSubtle: 'rgba(0, 0, 0, 0.04)',
      accent: '#005FB8',
      accentHover: '#115EA3',
      accentSubtle: 'rgba(0, 95, 184, 0.08)',
      accentText: '#FFFFFF',
      text: '#1E1E1E',
      textSecondary: '#5C5C5C',
      textMuted: '#8A8A8A',
    },
  },
  'tokyo-night': {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    category: 'developer',
    icon: '🌃',
    isDark: true,
    tagline: 'Sắc xanh tím đêm Tokyo — Chuẩn Dev được yêu thích nhất',
    colors: {
      bg: '#1a1b26',
      card: '#24283b',
      cardHover: '#2f3549',
      sidebar: '#16161e',
      border: 'rgba(65, 72, 104, 0.55)',
      borderSubtle: 'rgba(65, 72, 104, 0.28)',
      accent: '#7aa2f7',
      accentHover: '#89b4fa',
      accentSubtle: 'rgba(122, 162, 247, 0.18)',
      accentText: '#1a1b26',
      text: '#c0caf5',
      textSecondary: '#9aa5ce',
      textMuted: '#565f89',
    },
  },
  'catppuccin': {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    category: 'developer',
    icon: '☕',
    isDark: true,
    tagline: 'Gam màu pastel êm dịu, ấm áp — Xu hướng Dev hiện đại',
    colors: {
      bg: '#1e1e2e',
      card: '#313244',
      cardHover: '#45475a',
      sidebar: '#181825',
      border: 'rgba(88, 91, 112, 0.55)',
      borderSubtle: 'rgba(88, 91, 112, 0.28)',
      accent: '#cba6f7',
      accentHover: '#f5c2e7',
      accentSubtle: 'rgba(203, 166, 247, 0.18)',
      accentText: '#11111b',
      text: '#cdd6f4',
      textSecondary: '#a6adc8',
      textMuted: '#6c7086',
    },
  },
  'dracula': {
    id: 'dracula',
    name: 'Dracula',
    category: 'developer',
    icon: '🧛',
    isDark: true,
    tagline: 'Huyền thoại tối tím than kinh điển cùng accent rực rỡ',
    colors: {
      bg: '#282a36',
      card: '#343746',
      cardHover: '#44475a',
      sidebar: '#21222c',
      border: 'rgba(98, 114, 164, 0.55)',
      borderSubtle: 'rgba(98, 114, 164, 0.28)',
      accent: '#bd93f9',
      accentHover: '#ff79c6',
      accentSubtle: 'rgba(189, 147, 249, 0.18)',
      accentText: '#282a36',
      text: '#f8f8f2',
      textSecondary: '#d6d6e2',
      textMuted: '#6272a4',
    },
  },
  'github-dark': {
    id: 'github-dark',
    name: 'GitHub Dimmed',
    category: 'developer',
    icon: '🐙',
    isDark: true,
    tagline: 'Tông xám tro xanh chính thức từ GitHub, êm mắt khi làm việc lâu',
    colors: {
      bg: '#22272e',
      card: '#2d333b',
      cardHover: '#373e47',
      sidebar: '#1c2128',
      border: 'rgba(68, 76, 86, 0.65)',
      borderSubtle: 'rgba(68, 76, 86, 0.32)',
      accent: '#539bf5',
      accentHover: '#6cb6ff',
      accentSubtle: 'rgba(83, 155, 245, 0.18)',
      accentText: '#1c2128',
      text: '#adbac7',
      textSecondary: '#768390',
      textMuted: '#545d68',
    },
  },
};

export const THEME_LIST = Object.values(THEMES);

export const applyThemeToDocument = (themeId: ThemeId) => {
  if (typeof document === 'undefined') return;
  const theme = THEMES[themeId] || THEMES['fluent-dark'];
  const root = document.documentElement;

  // Set data-theme attribute
  root.setAttribute('data-theme', theme.id);

  // Set dark class for Tailwind dark: variants
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Inject or update CSS variables directly for absolute responsiveness
  const c = theme.colors;
  root.style.setProperty('--hub-bg', c.bg);
  root.style.setProperty('--hub-card', c.card);
  root.style.setProperty('--hub-card-hover', c.cardHover);
  root.style.setProperty('--hub-sidebar', c.sidebar);
  root.style.setProperty('--hub-border', c.border);
  root.style.setProperty('--hub-border-subtle', c.borderSubtle);
  root.style.setProperty('--hub-accent', c.accent);
  root.style.setProperty('--hub-accent-hover', c.accentHover);
  root.style.setProperty('--hub-accent-subtle', c.accentSubtle);
  root.style.setProperty('--hub-accent-text', c.accentText);
  root.style.setProperty('--hub-text', c.text);
  root.style.setProperty('--hub-text-secondary', c.textSecondary);
  root.style.setProperty('--hub-text-muted', c.textMuted);
};

export const getStoredThemeId = (): ThemeId => {
  if (typeof window === 'undefined') return 'fluent-dark';
  const saved = localStorage.getItem('windev-theme-id') as ThemeId | null;
  if (saved && THEMES[saved]) return saved;

  // Backward compatibility with previous 'light' | 'dark' string
  const oldTheme = localStorage.getItem('windev-theme');
  if (oldTheme === 'light') return 'fluent-light';
  if (oldTheme === 'dark') return 'fluent-dark';

  return 'fluent-dark';
};
