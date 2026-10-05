export type MaterialType = 'mica' | 'mica-alt' | 'acrylic' | 'solid';

export interface MaterialDefinition {
  id: MaterialType;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  tag: string;
  badgeColor: string;
  previewBg: string;
  features: string[];
}

export const MATERIALS: Record<MaterialType, MaterialDefinition> = {
  'mica': {
    id: 'mica',
    name: 'Mica Base',
    subtitle: 'Chuẩn Dev Home & Settings',
    description: 'Chất liệu đặc trưng của Windows 11 lấy mẫu hình nền desktop, tối ưu GPU và tiết kiệm pin tối đa.',
    icon: '🪟',
    tag: 'Mặc định Windows 11',
    badgeColor: 'bg-[#0F6CBD]/10 text-[#0F6CBD] dark:text-[#479EF5]',
    previewBg: 'radial-gradient(circle at 15% 15%, rgba(15, 108, 189, 0.12) 0%, transparent 70%)',
    features: ['Buttons Fluent 2 tiêu chuẩn', 'Mẫu màu Wallpaper tĩnh', 'Tiết kiệm pin 100%']
  },
  'mica-alt': {
    id: 'mica-alt',
    name: 'Mica Alt',
    subtitle: 'Chuẩn File Explorer & Terminal Tabs',
    description: 'Biến thể của Mica với độ tương phản màu sâu hơn, phân tầng rõ rệt giữa thanh điều hướng, tabs và vùng nội dung.',
    icon: '📑',
    tag: 'Tương phản phân cấp',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    previewBg: 'linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.05) 100%)',
    features: ['Buttons viền dập nổi tương phản', 'Phân tầng tab sâu', 'Chuẩn File Explorer']
  },
  'acrylic': {
    id: 'acrylic',
    name: 'Acrylic Glass',
    subtitle: 'Kính mờ Gaussian Blur 24px',
    description: 'Hiệu ứng bán trong suốt translucent làm mờ sâu nội dung đằng sau, kèm ánh sáng specular highlight sang trọng.',
    icon: '✨',
    tag: 'Hiệu ứng kính mờ',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    previewBg: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.25) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.2) 0px, transparent 50%)',
    features: ['Buttons Kính mờ xuyên thấu', 'Viền sáng Specular Highlight', 'Backdrop Blur 14-24px']
  },
  'solid': {
    id: 'solid',
    name: 'Solid Layer',
    subtitle: 'Chất liệu phẳng kinh điển',
    description: 'Nền màu đồng nhất không xuyên thấu, đổ bóng phân cấp Elevation 0-64, độ nét chữ và độ tương phản cao nhất.',
    icon: '🧱',
    tag: 'Tối ưu hiệu năng',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    previewBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%)',
    features: ['Buttons Matte phẳng lì', 'Không đổ bóng hay làm mờ', 'Tối ưu tốc độ tối đa']
  }
};

export const MATERIAL_LIST = Object.values(MATERIALS);

export const applyMaterialToDocument = (material: MaterialType) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-material', material);
};

export const getStoredMaterialType = (): MaterialType => {
  if (typeof window === 'undefined') return 'mica';
  const saved = localStorage.getItem('windev-material') as MaterialType | null;
  if (saved && MATERIALS[saved]) return saved;
  return 'mica';
};
