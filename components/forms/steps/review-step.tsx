"use client";

import { UseFormReturn } from "react-hook-form";
import { AddUserFormState } from "@/types/user";
import { Check, Mail, MapPin } from "lucide-react";

interface ReviewStepProps {
  form: UseFormReturn<AddUserFormState>;
}

export function ReviewStep({ form }: ReviewStepProps) {
  const { name, email, street, city, zipcode } = form.getValues();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Review Information</h2>
        <p className="text-sm text-muted-foreground">
          Please review the information below before submitting.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-muted/40 p-4 rounded-lg">
          <h3 className="font-medium text-lg mb-2">{name}</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-muted-foreground" />
              <span>{email}</span>
            </div>
            
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-muted-foreground mt-0.5" />
              <div>
                <p>{street}</p>
                <p>{city}, {zipcode}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted/40 p-4 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Check size={16} className="text-primary" />
            Confirmation
          </h3>
          <p className="text-sm text-muted-foreground">
            By clicking "Save User", you confirm that all the information provided is accurate and you want to add this user to the system.
          </p>
        </div>
      </div>
    </div>
  );
}