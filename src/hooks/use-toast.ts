// hooks/use-toast.ts
import { useState } from "react";

type ToastVariant = "default" | "destructive" | "success";

interface ToastProps {
  title: string;
  description: string;
  variant?: ToastVariant;
}

// Simple toast implementation
export function toast(props: ToastProps) {
  const { title, description, variant = "default" } = props;
  
  // Create a message that combines title and description
  const message = `${title}: ${description}`;
  
  // Use browser alert for simplicity
  // In a real app, you'd use a proper toast component
  alert(message);
  
  return {
    id: Date.now(),
    title,
    description,
    variant,
  };
}