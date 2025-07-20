"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { AddUserFormState } from "@/types/user";
import { addUserFormSchema } from "@/lib/validation";
import { StepIndicator } from "@/components/forms/step-indicator";
import { BasicInfoStep } from "@/components/forms/steps/basic-info-step";
import { AddressStep } from "@/components/forms/steps/address-step";
import { ReviewStep } from "@/components/forms/steps/review-step";
import { addUser } from "@/lib/api";

export default function AddUserForm() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddUserFormState>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      street: "",
      city: "",
      zipcode: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const savedFormData = localStorage.getItem("addUserFormData");
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      form.reset(parsedData);
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((data) => {
      localStorage.setItem("addUserFormData", JSON.stringify(data));
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const goToNextStep = async () => {
    let canProceed = false;
    
    if (step === 1) {
      canProceed = await form.trigger(["name", "email"]);
    } else if (step === 2) {
      canProceed = await form.trigger(["street", "city", "zipcode"]);
    }

    if (canProceed) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const goToPreviousStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: AddUserFormState) => {
    setIsSubmitting(true);
    
    try {
      await addUser(data);
      
      toast({
        title: "User Added Successfully",
        description: `${data.name} has been added to the system.`,
      });
      
      localStorage.removeItem("addUserFormData");
      
      router.push("/dashboard");
      router.refresh(); // Force a refresh of the dashboard page
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Add New User</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <Link href="/dashboard" passHref>
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
            <CardDescription>
              Complete the form below to add a new user to the system.
            </CardDescription>
            <StepIndicator currentStep={step} totalSteps={3} />
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent>
                {step === 1 && <BasicInfoStep form={form} />}
                {step === 2 && <AddressStep form={form} />}
                {step === 3 && <ReviewStep form={form} />}
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={step === 1}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {step < 3 ? (
                    <Button type="button\" onClick={goToNextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save User
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}