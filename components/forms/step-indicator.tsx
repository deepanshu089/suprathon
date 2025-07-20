import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center my-6">
      {steps.map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              "rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium border transition-colors",
              currentStep === step
                ? "border-primary bg-primary text-primary-foreground"
                : currentStep > step
                ? "border-primary bg-primary/20 text-primary"
                : "border-muted-foreground/30 text-muted-foreground"
            )}
          >
            {step}
          </div>
          {step < totalSteps && (
            <div
              className={cn(
                "h-1 w-10 mx-1",
                currentStep > step ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}