import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[11px] leading-none font-medium uppercase tracking-wider transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] hover:from-primary/90 hover:to-primary/70 hover:shadow-[0_2px_12px_rgba(245,158,11,0.25),0_1px_3px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] active:from-primary/80 active:to-primary/75 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-border/60 bg-card text-foreground hover:border-border hover:bg-muted/50",
        "outline-primary":
          "border border-primary/50 text-primary bg-transparent hover:border-primary hover:bg-primary/[0.06] hover:shadow-[0_2px_12px_rgba(245,158,11,0.12)] active:bg-primary/[0.10]",
        secondary:
          "bg-muted/60 text-foreground hover:bg-muted",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary normal-case tracking-normal underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 pt-[9px] pb-[7px] has-[>svg]:px-3",
        sm: "h-8 rounded-lg gap-1.5 px-3 pt-px has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 pt-px has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
