import { clsx } from "clsx";
import type { ReactNode } from "react";

interface PageHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  badges?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function PageHeader({
  kicker,
  title,
  description,
  actions,
  badges,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={clsx("border-t-2 border-border-strong pt-4", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          {kicker ? <p className="page-kicker mb-2">{kicker}</p> : null}
          <h1 className="font-headline text-4xl font-extrabold leading-none text-foreground sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-3xl font-body text-sm leading-relaxed text-muted sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {badges ? <div className="mt-4 flex flex-wrap items-center gap-2">{badges}</div> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}