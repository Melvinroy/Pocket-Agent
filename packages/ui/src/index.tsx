import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';

export type StatusTone = 'success' | 'neutral' | 'warning' | 'danger';

export type TimelineItem = {
  id: string;
  title: string;
  status: string;
  summary: string;
  meta?: string;
};

export type StatItem = {
  label: string;
  value: string;
  hint?: string;
};

export type ActionItem = {
  label: string;
  hint: string;
  tone?: 'accent' | 'muted';
};

const shellCardStyle: CSSProperties = {
  borderRadius: 28,
  border: '1px solid rgba(28, 28, 34, 0.08)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,244,237,0.92))',
  boxShadow: '0 24px 64px rgba(22, 28, 24, 0.14)',
  backdropFilter: 'blur(16px)',
};

export function PhoneShell({
  eyebrow,
  title,
  description,
  meta,
  children,
}: PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
}>) {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px 16px 48px',
      }}
    >
      <section
        style={{
          maxWidth: 560,
          margin: '0 auto',
          display: 'grid',
          gap: 16,
        }}
      >
        <header
          style={{
            ...shellCardStyle,
            overflow: 'hidden',
            position: 'relative',
            padding: 22,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at top right, rgba(12,133,120,0.18), transparent 34%), radial-gradient(circle at bottom left, rgba(195,95,54,0.12), transparent 30%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', display: 'grid', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#0f766e',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontSize: 12,
                }}
              >
                {eyebrow}
              </p>
              {meta}
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(2.2rem, 9vw, 3.6rem)',
                  lineHeight: 0.96,
                  maxWidth: '10ch',
                }}
              >
                {title}
              </h1>
              <p
                style={{
                  margin: 0,
                  color: '#5f615d',
                  fontSize: 16,
                  lineHeight: 1.6,
                  maxWidth: '30ch',
                }}
              >
                {description}
              </p>
            </div>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle: string;
  action?: ReactNode;
}>) {
  return (
    <section
      style={{
        ...shellCardStyle,
        padding: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          <p
            style={{
              margin: '8px 0 0',
              color: '#676a63',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        </div>
        {action}
      </div>
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

export function StatusPill({
  tone,
  children,
}: PropsWithChildren<{
  tone: StatusTone;
}>) {
  const palette = {
    success: { bg: 'rgba(12, 133, 120, 0.14)', fg: '#0f5a53' },
    neutral: { bg: 'rgba(42, 47, 43, 0.08)', fg: '#2f3a31' },
    warning: { bg: 'rgba(191, 98, 43, 0.16)', fg: '#9b4b18' },
    danger: { bg: 'rgba(183, 28, 28, 0.12)', fg: '#9f1d1d' },
  }[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 34,
        padding: '8px 12px',
        borderRadius: 999,
        background: palette.bg,
        color: palette.fg,
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {children}
    </span>
  );
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            padding: 14,
            borderRadius: 20,
            background: 'rgba(250,247,241,0.9)',
            border: '1px solid rgba(28, 28, 34, 0.07)',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#6e6e68',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {item.label}
          </p>
          <strong
            style={{
              display: 'block',
              marginTop: 8,
              fontSize: 22,
              lineHeight: 1.1,
            }}
          >
            {item.value}
          </strong>
          {item.hint ? (
            <p style={{ margin: '8px 0 0', color: '#6e6e68', fontSize: 13 }}>
              {item.hint}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ActionStrip({ items }: { items: ActionItem[] }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((item) => {
        const accent = item.tone === 'accent';
        return (
          <div
            key={item.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              padding: 14,
              borderRadius: 18,
              background: accent ? '#142b28' : 'rgba(245,241,233,0.92)',
              color: accent ? '#f5f2eb' : '#1e241f',
            }}
          >
            <div>
              <strong style={{ display: 'block' }}>{item.label}</strong>
              <span
                style={{
                  color: accent ? 'rgba(245,242,235,0.72)' : '#6e6e68',
                  fontSize: 13,
                }}
              >
                {item.hint}
              </span>
            </div>
            <span style={{ fontSize: 20 }}>{accent ? '>' : '+'}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DetailList({
  items,
}: {
  items: Array<{
    id: string;
    title: ReactNode;
    body: ReactNode;
    badge?: ReactNode;
  }>;
}) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gap: 12,
      }}
    >
      {items.map((item) => (
        <li
          key={item.id}
          style={{
            padding: 14,
            borderRadius: 20,
            background: 'rgba(255,255,255,0.82)',
            border: '1px solid rgba(28, 28, 34, 0.07)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{item.title}</div>
              <div
                style={{
                  marginTop: 6,
                  color: '#656860',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {item.body}
              </div>
            </div>
            {item.badge}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ComposerCard({
  title,
  placeholder,
  footer,
}: {
  title: string;
  placeholder: string;
  footer: ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 16,
        background: '#101917',
        color: '#f4efe7',
      }}
    >
      <strong style={{ display: 'block', marginBottom: 12 }}>{title}</strong>
      <div
        style={{
          minHeight: 108,
          borderRadius: 18,
          padding: 14,
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(244,239,231,0.72)',
          lineHeight: 1.6,
        }}
      >
        {placeholder}
      </div>
      <div style={{ marginTop: 12 }}>{footer}</div>
    </div>
  );
}

export function TimelinePreview({ items }: { items: TimelineItem[] }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'grid',
        gap: 12,
      }}
    >
      {items.map((item) => (
        <li
          key={item.id}
          style={{
            padding: 14,
            borderRadius: 20,
            border: '1px solid rgba(28, 28, 34, 0.08)',
            background: 'rgba(255,255,255,0.84)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: 'block' }}>{item.title}</strong>
              <p
                style={{
                  margin: '8px 0 0',
                  color: '#5f615d',
                  lineHeight: 1.5,
                  fontSize: 14,
                }}
              >
                {item.summary}
              </p>
              {item.meta ? (
                <p
                  style={{
                    margin: '8px 0 0',
                    color: '#8b6e42',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {item.meta}
                </p>
              ) : null}
            </div>
            <span
              style={{
                color: '#0f766e',
                fontWeight: 800,
                textTransform: 'uppercase',
                fontSize: 12,
                letterSpacing: '0.06em',
              }}
            >
              {item.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
