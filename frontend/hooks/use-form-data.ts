import { useState, useCallback, ChangeEvent } from 'react';
import { z, ZodError, AnyZodObject } from 'zod';

// Type for form errors, mapping field names to error messages
export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

type InputChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

export interface UseFormDataOptions<T extends AnyZodObject> {
  initialData: z.infer<T>;
  schema: T;
  onSubmit?: (data: z.infer<T>) => void | Promise<void>;
}

export interface UseFormDataReturn<T extends AnyZodObject> {
  formData: z.infer<T>;
  setFormData: React.Dispatch<React.SetStateAction<z.infer<T>>>;
  formErrors: ValidationErrors<z.infer<T>>;
  setFormErrors: React.Dispatch<React.SetStateAction<ValidationErrors<z.infer<T>>>>;
  handleInputChange: (e: InputChangeEvent) => void;
  handleCheckboxChange: (checked: boolean, name: keyof z.infer<T>) => void;
  handleCheckboxGroupChange: (value: string, name: keyof z.infer<T>, checked: boolean) => void;
  handleDateChange: (date: Date | undefined, name: keyof z.infer<T>) => void;
  handleSelectChange: (value: string, name: keyof z.infer<T>) => void;
  handleRadioGroupChange: (value: string, name: keyof z.infer<T>) => void;
  validateField: (name: keyof z.infer<T>, value: any) => boolean;
  validateForm: (dataToValidate: z.infer<T>) => boolean; // Modified to accept data
  resetForm: () => void;
  handleSubmit: (
    payload?: Partial<z.infer<T>>, // Accept an optional payload to merge
    event?: React.FormEvent<HTMLFormElement>
  ) => Promise<void>;
  handleBlur: (name: keyof z.infer<T>) => void;
}

export function useFormData<T extends AnyZodObject>({
  initialData,
  schema,
  onSubmit,
}: UseFormDataOptions<T>): UseFormDataReturn<T> {
  type FormData = z.infer<T>;
  const [formData, setFormData] = useState<FormData>(initialData);
  const [formErrors, setFormErrors] = useState<ValidationErrors<FormData>>({});

  const handleInputChange = useCallback((e: InputChangeEvent) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement | HTMLTextAreaElement; // Type assertion

    let processedValue: any;
    if (type === 'checkbox' && target instanceof HTMLInputElement) {
      processedValue = target.checked;
    } else if (type === 'number' && target instanceof HTMLInputElement) {
      if (value === '') {
        // Allow clearing optional number fields. Schema should handle if it's required.
        // Zod .number().optional() allows undefined.
        // Zod .number().nullable() allows null.
        // If schema expects empty string for empty number, then `processedValue = '';`
        processedValue = undefined;
      } else {
        const numValue = parseFloat(value);
        // If specific fields must be integers, handle it here or rely on Zod schema.
        // For now, parseFloat is general. If it's NaN, keep original string for Zod to catch.
        processedValue = isNaN(numValue) ? value : numValue;
      }
    } else {
      // Don't trim strings during typing to prevent focus loss
      processedValue = value;
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: processedValue,
    }));
    setFormErrors(prev => ({ ...prev, [name as keyof FormData]: undefined }));
  }, []);

  const handleCheckboxChange = useCallback((checked: boolean, name: keyof FormData) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const handleCheckboxGroupChange = useCallback((value: string, name: keyof FormData, itemChecked: boolean) => {
    setFormData(prevData => {
      const currentArray = (prevData[name] as string[] | undefined) || [];
      let newArray;
      if (itemChecked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      return { ...prevData, [name]: newArray };
    });
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const handleDateChange = useCallback((date: Date | undefined, name: keyof FormData) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: date,
    }));
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const handleSelectChange = useCallback((value: string, name: keyof FormData) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const handleRadioGroupChange = useCallback((value: string, name: keyof FormData) => {
    setFormData(prevData => ({ ...prevData, [name]: value as any }));
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const validateField = useCallback((name: keyof FormData, value: any): boolean => {
    const tentativeFormData = { ...formData, [name]: value };
    const result = schema.safeParse(tentativeFormData);

    if (result.success) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: undefined,
      }));
      return true;
    } else {
      const fieldError = result.error.errors.find(err => err.path.includes(name as string));
      if (fieldError) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          [name]: fieldError.message,
        }));
      } else {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          [name]: undefined,
        }));
      }
      return false;
    }
  }, [schema, formData]);

  const validateForm = useCallback((dataToValidate: FormData): boolean => {
    try {
      schema.parse(dataToValidate);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationErrors<FormData> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as keyof FormData] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  }, [schema]); // Removed formData from dependencies, as dataToValidate is passed

  const handleBlur = useCallback((name: keyof FormData) => {
    const result = schema.safeParse(formData); // Validate current formData on blur
    if (!result.success) {
      const fieldError = result.error.errors.find(err => err.path.includes(name as string));
      if (fieldError) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          [name]: fieldError.message,
        }));
      }
    } else {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: undefined,
      }));
    }
  }, [schema, formData]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setFormErrors({});
  }, [initialData]);

  const handleSubmit = useCallback(
    async (
      payload?: Partial<FormData>,
      event?: React.FormEvent<HTMLFormElement>
    ) => {
      if (event) {
        event.preventDefault();
      }

      const dataToSubmit = {
        ...formData,
        ...(payload || {}),
      };

      // Trim string values only at submission time
      const trimmedData = Object.entries(dataToSubmit).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key as keyof FormData] = value.trim() as any;
        } else {
          acc[key as keyof FormData] = value;
        }
        return acc;
      }, {} as FormData);

      // It's important to update the state so that if onSubmit causes a re-render,
      // formData prop passed to children is up-to-date.
      setFormData(trimmedData);

      if (validateForm(trimmedData)) {
        if (onSubmit) {
          await onSubmit(trimmedData);
        }
      } else {
        // formErrors state is updated by validateForm
        console.log("Form validation failed.");
      }
    },
    // Only include formData and onSubmit in dependencies to prevent unnecessary re-renders
    [formData, onSubmit, validateForm]
  );

  return {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    handleInputChange,
    handleCheckboxChange,
    handleCheckboxGroupChange,
    handleDateChange,
    handleSelectChange,
    handleRadioGroupChange,
    validateField,
    validateForm,
    resetForm,
    handleSubmit,
    handleBlur,
  };
}