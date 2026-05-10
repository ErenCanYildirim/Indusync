"use client"

//Manages everything related to a form
// data, validation, error messages, submission state

import { useState, useCallback, type ChangeEvent, type FormEvent } from "react"
import { type ValidationRules, validateForm, type ValidationErrors } from "@/lib/validation"

interface UseFormProps<T> {
  initialValues: T
  validationRules?: ValidationRules
  onSubmit: (values: T) => void | Promise<void>
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormProps<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target

      setValues((prev) => ({
        ...prev,
        [name]: type === "number" ? Number.parseFloat(value) : value,
      }))

      // Clear error when field is changed
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    },
    [errors],
  )

  const handleBlur = useCallback(
    (e: { target: { name: string } }) => {
      const { name } = e.target

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }))

      // Validate field on blur if there are validation rules
      if (validationRules[name]) {
        const fieldErrors = validateForm({ [name]: values[name] }, { [name]: validationRules[name] })

        setErrors((prev) => ({
          ...prev,
          ...fieldErrors,
        }))
      }
    },
    [values, validationRules],
  )

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setSubmitError(null)

      // Validate all fields
      const formErrors = validateForm(values, validationRules)
      setErrors(formErrors)

      // Mark all fields as touched
      const allTouched = Object.keys(validationRules).reduce(
        (acc, field) => {
          acc[field] = true
          return acc
        },
        {} as Record<string, boolean>,
      )

      setTouched(allTouched)

      // If there are errors, don't submit
      if (Object.keys(formErrors).length > 0) {
        return
      }

      setIsSubmitting(true)

      try {
        await onSubmit(values)
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validationRules, onSubmit],
  )

  const validateFields = useCallback(
    (fieldsToValidate: string[]): boolean => {
      const fieldsToValidateObject: Record<string, any> = {};
      const rulesForFieldsToValidate: ValidationRules = {};

      fieldsToValidate.forEach(field => {
        fieldsToValidateObject[field] = values[field];
        if (validationRules[field]) {
          rulesForFieldsToValidate[field] = validationRules[field];
        }
      });

      const fieldErrors = validateForm(fieldsToValidateObject, rulesForFieldsToValidate);
      setErrors((prev) => ({
        ...prev,
        ...fieldErrors,
      }));
      // Mark fields as touched
      setTouched((prev) => {
        const newTouched = { ...prev };
        fieldsToValidate.forEach(field => {
          newTouched[field] = true;
        });
        return newTouched;
      });
      return Object.keys(fieldErrors).length === 0;
    },
    [values, validationRules],
  );

  const setValue = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }))

      // Clear error when field is changed programmatically
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    },
    [errors],
  )

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setSubmitError(null)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    resetForm,
    validateFields,
  }
}