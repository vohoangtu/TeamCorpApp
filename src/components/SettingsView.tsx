import React from 'react';
import { 
  Settings, 
  Palette, 
  Check, 
  Sparkles, 
  Laptop, 
  ShieldCheck, 
  Cpu, 
  HardDrive,
  Keyboard,
  Layers
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { THEME_LIST, type ThemeId } from '../themes';
import { MATERIALS, MATERIAL_LIST, type MaterialType } from '../materials';

export const SettingsView: React.FC = () => {
  const { systemStats, themeId, setThemeId, materialType, setMaterialType } = useAppStore();

  return (
    <div className="space-y-6 w-full pb-12">
      {/* 1. Theme Studio Section */}
      <div className="rounded-lg border border-hub bg-hub-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <h3 className="text-sm font-bold text-hub-primary flex items-center gap-2">
              <Palette className="h-4 w-4 text-hub-accent" />
              Developer Theme Studio & Bộ Giao Diện
            </h3>
            <p className="text-xs text-hub-muted mt-0.5">
              Chọn phong cách hiển thị yêu thích từ bộ sưu tập theme Lập trình viên kinh điển và chuẩn Fluent 2.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-hub-subtle bg-black/[0.03] dark:bg-white/[0.04] px-2.5 py-1 text-xs text-hub-muted">
            <Keyboard className="h-3.5 w-3.5" />
            <span>Phím tắt đổi nhanh: <strong className="text-hub-primary font-mono font-semibold">Ctrl + Shift + T</strong></span>
          </div>
        </div>

        {/* Theme Cards Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {THEME_LIST.map((t) => {
            const isSelected = themeId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`group relative cursor-pointer rounded-lg border p-4 transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'border-hub-accent ring-2 ring-[var(--hub-accent)]/30 shadow-md'
                    : 'border-hub hover:border-neutral-400 dark:hover:border-neutral-500 hover:shadow-xs'
                }`}
                style={{
                  backgroundColor: t.colors.card,
                }}
              >
                <div>
                  {/* Miniature UI Mockup */}
                  <div 
                    className="h-16 w-full rounded-md border overflow-hidden flex mb-3 shadow-inner"
                    style={{ 
                      borderColor: t.colors.border,
                      backgroundColor: t.colors.bg
                    }}
                  >
                    {/* Mini Sidebar */}
                    <div 
                      className="w-12 h-full border-r flex flex-col p-1.5 gap-1 shrink-0"
                      style={{ 
                        backgroundColor: t.colors.sidebar,
                        borderColor: t.colors.border
                      }}
                    >
                      <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: t.colors.accent }} />
                      <div className="h-1.5 w-7 rounded-xs bg-white/20 mt-1" />
                      <div className="h-1.5 w-5 rounded-xs bg-white/10" />
                    </div>

                    {/* Mini Content Area */}
                    <div className="flex-1 flex flex-col p-1.5 gap-1.5">
                      {/* Mini Header */}
                      <div className="flex items-center justify-between">
                        <div className="h-2 w-16 rounded-xs" style={{ backgroundColor: t.colors.text, opacity: 0.8 }} />
                        <div className="h-2 w-5 rounded-full" style={{ backgroundColor: t.colors.accent }} />
                      </div>
                      {/* Mini Card */}
                      <div 
                        className="flex-1 rounded-sm border p-1 flex items-center justify-between"
                        style={{ 
                          backgroundColor: t.colors.card,
                          borderColor: t.colors.border
                        }}
                      >
                        <div className="space-y-1">
                          <div className="h-1.5 w-10 rounded-xs" style={{ backgroundColor: t.colors.text, opacity: 0.6 }} />
                          <div className="h-1 w-6 rounded-xs" style={{ backgroundColor: t.colors.textMuted }} />
                        </div>
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.colors.accent }} />
                      </div>
                    </div>
                  </div>

                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.icon}</span>
                      <div>
                        <h4 
                          className="text-sm font-bold tracking-tight"
                          style={{ color: t.colors.text }}
                        >
                          {t.name}
                        </h4>
                        <span 
                          className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: t.colors.accentSubtle,
                            color: t.colors.accent
                          }}
                        >
                          {t.category === 'developer' ? 'Developer Suite' : 'Windows 11 Fluent'}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span 
                        className="flex h-5 w-5 items-center justify-center rounded-full text-white shadow-xs"
                        style={{ backgroundColor: t.colors.accent }}
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p 
                    className="text-xs mt-2 line-clamp-2"
                    style={{ color: t.colors.textSecondary }}
                  >
                    {t.tagline}
                  </p>
                </div>

                {/* Footer swatches & button */}
                <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: t.colors.border }}>
                  {/* Swatch palette */}
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="h-3.5 w-3.5 rounded-full border border-black/20" 
                      style={{ backgroundColor: t.colors.bg }} 
                      title="Nền (Canvas)" 
                    />
                    <span 
                      className="h-3.5 w-3.5 rounded-full border border-black/20" 
                      style={{ backgroundColor: t.colors.card }} 
                      title="Thẻ (Surface)" 
                    />
                    <span 
                      className="h-3.5 w-3.5 rounded-full border border-black/20" 
                      style={{ backgroundColor: t.colors.accent }} 
                      title="Màu nhấn (Accent)" 
                    />
                    <span 
                      className="h-3.5 w-3.5 rounded-full border border-black/20" 
                      style={{ backgroundColor: t.colors.text }} 
                      title="Màu chữ (Text)" 
                    />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setThemeId(t.id);
                    }}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'opacity-80 cursor-default'
                        : 'hover:opacity-90 active:scale-95'
                    }`}
                    style={{
                      backgroundColor: isSelected ? t.colors.accentSubtle : t.colors.accent,
                      color: isSelected ? t.colors.accent : t.colors.accentText,
                    }}
                  >
                    {isSelected ? 'Đang kích hoạt' : 'Áp dụng theme'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Fluent 2 Material Studio Section */}
      <div className="rounded-lg border border-hub bg-hub-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <h3 className="text-sm font-bold text-hub-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-hub-accent" />
              Fluent 2 Material Studio & Hệ Thống Chất Liệu Windows 11
            </h3>
            <p className="text-xs text-hub-muted mt-0.5">
              Chọn chất liệu bề mặt hiển thị theo chuẩn Windows 11: Mica động, Mica Alt tương phản sâu, Acrylic kính mờ xuyên thấu, hoặc Solid phẳng.
            </p>
          </div>

          <span className="text-xs text-hub-muted bg-black/[0.03] dark:bg-white/[0.04] px-2.5 py-1 rounded border border-hub-subtle">
            Chất liệu hiện tại: <strong className="text-hub-accent font-semibold">{MATERIALS[materialType]?.name}</strong>
          </span>
        </div>

        {/* Material Cards Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MATERIAL_LIST.map((m) => {
            const isSelected = materialType === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setMaterialType(m.id)}
                className={`group relative cursor-pointer rounded-lg border p-4 transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'border-hub-accent ring-2 ring-[var(--hub-accent)]/30 bg-black/[0.03] dark:bg-white/[0.05] shadow-md'
                    : 'border-hub hover:border-neutral-400 dark:hover:border-neutral-500 bg-black/[0.01] dark:bg-white/[0.02] hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Miniature Material Simulation Box */}
                  <div 
                    className="h-20 w-full rounded-md border border-hub relative overflow-hidden flex flex-col items-center justify-center p-2 mb-3 shadow-inner"
                    style={{ background: m.previewBg }}
                  >
                    {/* Simulated floating UI card */}
                    <div className={`w-5/6 h-10 rounded-[6px] border p-1.5 flex items-center justify-between shadow-xs transition-all ${
                      m.id === 'acrylic' 
                        ? 'backdrop-blur-md bg-white/40 dark:bg-black/40 border-white/40 dark:border-white/20' 
                        : m.id === 'mica-alt'
                        ? 'bg-neutral-800 text-white border-neutral-700 dark:bg-neutral-900'
                        : m.id === 'solid'
                        ? 'bg-hub-card border-hub'
                        : 'bg-white/80 dark:bg-white/10 border-hub'
                    }`}>
                      <div className="space-y-1">
                        <div className="h-1.5 w-12 rounded-xs bg-[var(--hub-accent)]" />
                        <div className="h-1 w-8 rounded-xs bg-neutral-400/50" />
                      </div>
                      <span className="text-base">{m.icon}</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h4 className="text-sm font-bold text-hub-primary flex items-center gap-1.5">
                        <span>{m.icon}</span>
                        <span>{m.name}</span>
                      </h4>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1 inline-block ${m.badgeColor}`}>
                        {m.tag}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--hub-accent)] text-white shadow-xs">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-hub-muted mt-2 line-clamp-2">
                    {m.description}
                  </p>

                  {/* Bullet features */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.features.map((feat, idx) => (
                      <span key={idx} className="text-[10px] text-hub-secondary bg-black/[0.04] dark:bg-white/[0.06] rounded px-1.5 py-0.5">
                        • {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-hub flex items-center justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaterialType(m.id);
                    }}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[var(--hub-accent-subtle)] text-[var(--hub-accent)] cursor-default'
                        : 'fluent-btn-primary h-7'
                    }`}
                  >
                    {isSelected ? 'Đang kích hoạt' : 'Chọn chất liệu'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. System Specs & Windows 11 Toolchains */}
      <div className="rounded-lg border border-hub bg-hub-card p-5 shadow-xs">
        <h3 className="text-sm font-bold text-hub-primary flex items-center gap-2 mb-1">
          <Settings className="h-4 w-4 text-hub-accent" />
          Thông số Môi trường Windows 11 & Toolchains
        </h3>
        <p className="text-xs text-hub-muted">
          Các công nghệ cuối năm 2026 đang phục vụ cho việc quản lý vòng đời và triển khai ứng dụng local.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border border-hub-subtle bg-black/[0.02] dark:bg-white/[0.02] p-3.5 text-xs space-y-2">
            <span className="font-semibold text-hub-primary">Runtime & Frontend Stack</span>
            <div className="space-y-1.5 font-mono text-[11px] text-hub-secondary">
              <div className="flex justify-between">
                <span>Vite:</span>
                <span className="font-bold text-hub-primary">v8.3.2</span>
              </div>
              <div className="flex justify-between">
                <span>TypeScript:</span>
                <span className="font-bold text-hub-primary">v7.0.2</span>
              </div>
              <div className="flex justify-between">
                <span>React:</span>
                <span className="font-bold text-hub-primary">v19.3.0</span>
              </div>
              <div className="flex justify-between">
                <span>Tailwind CSS:</span>
                <span className="font-bold text-hub-primary">v4.3.3 (CSS-first engine)</span>
              </div>
              <div className="flex justify-between">
                <span>Node.js:</span>
                <span className="font-bold text-hub-primary">v24.21.0</span>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-hub-subtle bg-black/[0.02] dark:bg-white/[0.02] p-3.5 text-xs space-y-2">
            <span className="font-semibold text-hub-primary">Hệ thống Windows 11 & Quản lý Tiến trình</span>
            <div className="space-y-1.5 font-mono text-[11px] text-hub-secondary">
              <div className="flex justify-between">
                <span>Design System:</span>
                <span className="font-bold text-hub-accent">Microsoft Fluent 2</span>
              </div>
              <div className="flex justify-between">
                <span>Base Font Size:</span>
                <span className="font-bold text-hub-primary">14px (Segoe UI Variable)</span>
              </div>
              <div className="flex justify-between">
                <span>Process Tree Manager:</span>
                <span className="font-bold text-emerald-500">Tree-kill (Active)</span>
              </div>
              <div className="flex justify-between">
                <span>Docker Engine:</span>
                <span className="font-bold text-hub-primary">
                  {systemStats?.dockerAvailable ? 'Available (v29.8)' : 'Standby'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Workspace Dir:</span>
                <span className="font-bold text-hub-primary truncate max-w-[150px]">
                  ~/.windev-hub
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
