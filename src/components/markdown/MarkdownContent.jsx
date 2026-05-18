import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components = {
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline underline-offset-2 hover:opacity-90"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ alt, src, ...props }) => (
    <img
      src={src}
      alt={alt ?? ""}
      loading="lazy"
      className="my-2 max-h-80 max-w-full rounded-md border border-border object-contain"
      {...props}
    />
  ),
  h1: ({ children, ...props }) => (
    <h1 className="mt-4 mb-2 text-xl font-semibold first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-4 mb-2 text-lg font-semibold first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-3 mb-1.5 text-base font-semibold first:mt-0" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-2 leading-relaxed last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-2 border-l-4 border-muted-foreground/40 pl-4 text-muted-foreground italic last:mb-0"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ className, children, inline, ...props }) => {
    const isBlock = inline === false;
    if (isBlock) {
      return (
        <pre
          className="mb-2 overflow-x-auto rounded-md border border-border bg-muted/60 p-3 text-xs last:mb-0"
          {...props}
        >
          <code className={className}>{children}</code>
        </pre>
      );
    }
    return (
      <code
        className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
        {...props}
      >
        {children}
      </code>
    );
  },
  table: ({ children, ...props }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table
        className="w-full border-collapse text-left text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-border bg-muted/50 px-2 py-1.5 font-medium"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-border px-2 py-1.5" {...props}>
      {children}
    </td>
  ),
  hr: (props) => <hr className="my-4 border-border" {...props} />,
};

/** Renders markdown (GFM) for product descriptions and similar fields. */
export function MarkdownContent({ content, className, emptyFallback = null }) {
  const text = content?.trim();
  if (!text) return emptyFallback;

  return (
    <div
      className={cn(
        "markdown-content text-sm text-foreground [&_input[type=checkbox]]:mr-2",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
