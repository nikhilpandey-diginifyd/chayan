import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-[background-color,border-color,box-shadow,transform,color] duration-200 ease-[var(--ease-out-soft)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        primary:
          "bg-pen text-white shadow-[var(--shadow-pen)] hover:bg-pen-dark hover:shadow-[0_10px_24px_-10px_rgb(43_79_199/0.7)]",
        secondary:
          "border border-line bg-surface text-ink shadow-[0_1px_2px_rgb(17_26_54/0.05)] hover:border-pen/40 hover:bg-pen-soft/40",
        ghost: "text-ink hover:bg-pen-soft/60",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
