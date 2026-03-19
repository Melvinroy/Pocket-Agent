import type { PropsWithChildren } from 'react';

export function PhoneShell({
  eyebrow,
  title,
  description,
  children,
}: PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
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
          maxWidth: 520,
          margin: '0 auto',
          display: 'grid',
          gap: 16,
        }}
      >
        <header
          style={{
            padding: 20,
            borderRadius: 28,
            background: 'rgba(255,255,255,0.78)',
            border: '1px solid rgba(25,34,28,0.08)',
            boxShadow: '0 24px 64px rgba(18,31,24,0.12)',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#0f766e',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </p>
          <h1
            style={{
              margin: '12px 0 8px',
              fontSize: 'clamp(2rem, 8vw, 3rem)',
              lineHeight: 1.02,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 0,
              color: '#5d665d',
              fontSize: 16,
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        </header>
        {children}
      </section>
    </main>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle: string;
}>) {
  return (
    <section
      style={{
        padding: 18,
        borderRadius: 24,
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(25,34,28,0.08)',
        boxShadow: '0 18px 48px rgba(18,31,24,0.1)',
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
      <p
        style={{
          marginTop: 8,
          color: '#5d665d',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </p>
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

export function StatusPill({
  tone,
  children,
}: PropsWithChildren<{
  tone: 'success' | 'neutral' | 'warning';
}>) {
  const palette = {
    success: { bg: 'rgba(15, 118, 110, 0.12)', fg: '#115e59' },
    neutral: { bg: 'rgba(24, 32, 24, 0.08)', fg: '#243224' },
    warning: { bg: 'rgba(180, 83, 9, 0.14)', fg: '#9a3412' },
  }[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 999,
        background: palette.bg,
        color: palette.fg,
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      {children}
    </span>
  );
}

export function TimelinePreview({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    status: string;
    summary: string;
  }>;
}) {
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
            borderRadius: 18,
            border: '1px solid rgba(25,34,28,0.08)',
            background: 'rgba(255,255,255,0.88)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <strong>{item.title}</strong>
            <span
              style={{
                color: '#0f766e',
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: 12,
              }}
            >
              {item.status}
            </span>
          </div>
          <p style={{ marginBottom: 0, color: '#5d665d', lineHeight: 1.45 }}>
            {item.summary}
          </p>
        </li>
      ))}
    </ul>
  );
}
