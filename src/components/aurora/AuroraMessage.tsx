import {
  Clock, Calendar, User, DoorOpen, Stethoscope, Sparkles, Phone,
  CircleDollarSign, Timer, Info, CheckCircle2, MapPin,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

const TIME_RE = /\b([01]?\d|2[0-3]):[0-5]\d\b/g;
const DATE_RE = /\b(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])(?:\/\d{2,4})?\b/;
const WEEKDAY_RE = /\b(segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)(?:-feira)?\b/i;

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const FIELD_ICONS: { match: RegExp; label: string; icon: IconType }[] = [
  { match: /^(cliente|paciente|nome)$/i, label: "Cliente", icon: User },
  { match: /^(profissional|respons[áa]vel|atendente|com)$/i, label: "Profissional", icon: Stethoscope },
  { match: /^(sala)$/i, label: "Sala", icon: DoorOpen },
  { match: /^(servi[çc]o|procedimento|tratamento)$/i, label: "Serviço", icon: Sparkles },
  { match: /^(data|dia)$/i, label: "Data", icon: Calendar },
  { match: /^(hor[áa]rio|hora|hor[áa]rios)$/i, label: "Horário", icon: Clock },
  { match: /^(dura[çc][ãa]o|tempo)$/i, label: "Duração", icon: Timer },
  { match: /^(telefone|whats(app)?|contato|celular)$/i, label: "Telefone", icon: Phone },
  { match: /^(valor|pre[çc]o|investimento)$/i, label: "Valor", icon: CircleDollarSign },
  { match: /^(status|situa[çc][ãa]o)$/i, label: "Status", icon: CheckCircle2 },
  { match: /^(observa[çc][ãa]o|obs|nota|notas)$/i, label: "Observação", icon: Info },
  { match: /^(local|endere[çc]o)$/i, label: "Local", icon: MapPin },
];

function fieldFor(label: string) {
  const clean = label.trim().replace(/[*_]/g, "");
  return FIELD_ICONS.find((f) => f.match.test(clean));
}

function renderInline(text: string, keyPrefix: string) {
  const parts: (string | JSX.Element)[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={`${keyPrefix}-b${i++}`}>{m[1]}</strong>);
    else if (m[2]) parts.push(<em key={`${keyPrefix}-i${i++}`}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

function TimeChip({ time }: { time: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary tabular-nums">
      <Clock className="w-3 h-3" /> {time}
    </span>
  );
}

function DateHeader({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-1">
      <Calendar className="w-3.5 h-3.5 text-primary" />
      <span>{text}</span>
    </div>
  );
}

function FieldRow({
  icon: Icon, label, value, keyPrefix,
}: { icon: IconType; label: string; value: string; keyPrefix: string }) {
  const times = value.match(TIME_RE) ?? [];
  const hasChips = times.length >= 1 && times.join("").length >= value.replace(/\D/g, "").length - 2;
  return (
    <div className="flex items-start gap-2.5 py-1">
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        {hasChips ? (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {Array.from(new Set(times)).map((t) => <TimeChip key={t} time={t} />)}
          </div>
        ) : (
          <div className="text-sm text-foreground leading-snug break-words">
            {renderInline(value, keyPrefix)}
          </div>
        )}
      </div>
    </div>
  );
}

type Block =
  | { kind: "el"; el: JSX.Element }
  | { kind: "field"; icon: IconType; label: string; value: string; key: string };

export function AuroraMessage({ content }: { content: string }) {
  if (!content) return null;
  const rawLines = content.split(/\r?\n/);

  const blocks: Block[] = [];
  let buffer: string[] = [];

  const flushParagraph = () => {
    if (!buffer.length) return;
    const paragraph = buffer.join(" ").trim();
    if (paragraph) {
      const key = `p-${blocks.length}`;
      blocks.push({
        kind: "el",
        el: (
          <p key={key} className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderInline(paragraph, key)}
          </p>
        ),
      });
    }
    buffer = [];
  };

  rawLines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); return; }

    const times = line.match(TIME_RE) ?? [];
    const bulletMatch = line.match(/^([-•*]|\d+[.)])\s+(.*)$/);
    const body = bulletMatch ? bulletMatch[2] : line;

    // Labeled field: "Cliente: Ana" / "- Sala: 2" / "**Profissional**: Sirlei"
    const fieldMatch = body.match(/^\*{0,2}([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ ]{2,30}?)\*{0,2}\s*[:：]\s*(.+)$/);
    if (fieldMatch) {
      const field = fieldFor(fieldMatch[1]);
      if (field) {
        flushParagraph();
        blocks.push({
          kind: "field", icon: field.icon, label: field.label,
          value: fieldMatch[2].trim().replace(/[*_]/g, ""), key: `f-${idx}`,
        });
        return;
      }
    }

    const isHeaderLike = /:$/.test(line) && times.length === 0 &&
      (DATE_RE.test(line) || WEEKDAY_RE.test(line));

    if (isHeaderLike) {
      flushParagraph();
      blocks.push({ kind: "el", el: <DateHeader key={`h-${idx}`} text={line.replace(/:$/, "")} /> });
      return;
    }

    if (times.length >= 2) {
      flushParagraph();
      const firstIdx = body.search(TIME_RE);
      const label = firstIdx > 0 ? body.slice(0, firstIdx).replace(/[:\-–—,]\s*$/, "").trim() : "";
      const uniqueTimes = Array.from(new Set(times));
      blocks.push({
        kind: "el",
        el: (
          <div key={`t-${idx}`} className="space-y-1.5">
            {label && (
              <div className="text-xs font-medium text-foreground/80">
                {renderInline(label, `tl${idx}`)}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {uniqueTimes.map((t) => <TimeChip key={t} time={t} />)}
            </div>
          </div>
        ),
      });
      return;
    }

    if (bulletMatch) {
      flushParagraph();
      blocks.push({
        kind: "el",
        el: (
          <div key={`li-${idx}`} className="flex gap-2 text-sm leading-relaxed">
            <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
            <span className="flex-1">
              {renderInline(body, `li${idx}`)}
              {times.length === 1 && (<>{" "}<TimeChip time={times[0]} /></>)}
            </span>
          </div>
        ),
      });
      return;
    }

    buffer.push(line);
  });
  flushParagraph();

  // Group consecutive field blocks into a card
  const rendered: JSX.Element[] = [];
  let cardBuf: Extract<Block, { kind: "field" }>[] = [];
  const flushCard = () => {
    if (!cardBuf.length) return;
    const items = cardBuf;
    rendered.push(
      <div
        key={`card-${rendered.length}`}
        className="rounded-lg border border-border/60 bg-card/50 px-3 py-2 divide-y divide-border/40"
      >
        {items.map((f) => (
          <FieldRow key={f.key} icon={f.icon} label={f.label} value={f.value} keyPrefix={f.key} />
        ))}
      </div>
    );
    cardBuf = [];
  };
  blocks.forEach((b) => {
    if (b.kind === "field") cardBuf.push(b);
    else { flushCard(); rendered.push(b.el); }
  });
  flushCard();

  return <div className="space-y-2.5">{rendered}</div>;
}
