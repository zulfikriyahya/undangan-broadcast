import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

const alertVariants = cva("relative w-full rounded-lg border px-4 py-3 text-sm", {
  variants: {
    variant: {
      default: "bg-background text-foreground",
      success: "border-emerald-200 bg-emerald-50 text-emerald-800",
      destructive: "border-red-200 bg-red-50 text-red-800",
      warning: "border-amber-200 bg-amber-50 text-amber-800",
      info: "border-blue-200 bg-blue-50 text-blue-800",
    },
  },
  defaultVariants: { variant: "default" },
});

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("font-semibold", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";
