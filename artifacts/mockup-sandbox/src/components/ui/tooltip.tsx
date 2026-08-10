import * as React from "react"

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative inline-block">{children}</div>
);

export const TooltipTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => (
  <>{children}</>
);

export const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`z-50 overflow-hidden rounded-md bg-[#3b3447] px-3 py-1.5 text-xs text-[#faf7f1] shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
TooltipContent.displayName = "TooltipContent";
