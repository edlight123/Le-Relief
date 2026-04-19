import { clsx } from "clsx";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        "overflow-hidden border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] bg-surface",
        hover && "article-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] px-6 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("px-6 py-4", className)}>{children}</div>;
}
