import { Clock, Calendar } from "lucide-react";

const TIME_RE = /\b([01]?\d|2[0-3]):[0-5]\d\b/g;
const DATE_RE = /\b(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])(?:\/\d{2,4})?\b/;
const WEEKDAY_RE = /\b(segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)(?:-feira)?\b/i;

function renderInline(text: string, keyPrefix: string) {
  // bold **x** and italic *x*
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

export function AuroraMessage({ content }: { content: string }) {
  if (!content) return null;
  const rawLines = content.split(/\r?\n/);

  const blocks: JSX.Element[] = [];
  let buffer: string[] = [];

  const flushParagraph = () => {
    if (!buffer.length) return;
    const paragraph = buffer.join(" ").trim();
    if (paragraph) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderInline(paragraph, `p${blocks.length}`)}
        </p>
      );
    }
    buffer = [];
  };

  rawLines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); return; }

    const times = line.match(TIME_RE) ?? [];
    const bulletMatch = line.match(/^([-•*]|\d+[.)])\s+(.*)$/);
    const body = bulletMatch ? bulletMatch[2] : line;
    const isHeaderLike = /:$/.test(line) && times.length === 0 &&
      (DATE_RE.test(line) || WEEKDAY_RE.test(line));

    // Date/weekday header line ending with ":"
    if (isHeaderLike) {
      flushParagraph();
      blocks.push(<DateHeader key={`h-${idx}`} text={line.replace(/:$/, "")} />);
      return;
    }

    // Line with 2+ times → render as time chips row (with optional label)
    if (times.length >= 2) {
      flushParagraph();
      // strip bullet + trailing punctuation, extract label = text before first time
      const firstIdx = body.search(TIME_RE);
      const label = firstIdx > 0 ? body.slice(0, firstIdx).replace(/[:\-–—,]\s*$/, "").trim() : "";
      const uniqueTimes = Array.from(new Set(times));
      blocks.push(
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
      );
      return;
    }

    // Bulleted list item
    if (bulletMatch) {
      flushParagraph();
      blocks.push(
        <div key={`li-${idx}`} className="flex gap-2 text-sm leading-relaxed">
          <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
          <span className="flex-1">
            {renderInline(body, `li${idx}`)}
            {times.length === 1 && (
              <>{" "}<TimeChip time={times[0]} /></>
            )}
          </span>
        </div>
      );
      return;
    }

    buffer.push(line);
  });
  flushParagraph();

  return <div className="space-y-2">{blocks}</div>;
}
