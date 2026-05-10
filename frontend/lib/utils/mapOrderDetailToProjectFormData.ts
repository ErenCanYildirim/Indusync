import { OrderDetailResponse } from '@/lib/api/types';
import { ProjectFormData } from '@/hooks/use-project-creation';

/**
 * Converts an OrderDetailResponse (backend draft) into the ProjectCreationStepper's expected
 * ProjectFormData structure so the stepper can be reused for editing.
 */
export function mapOrderDetailToProjectFormData(order: OrderDetailResponse): ProjectFormData {
  return {
    projectName: order.title,
    contactPersons: [
      {
        id: '1',
        name: order.contactPerson?.name ?? '',
        email: order.contactPerson?.email ?? '',
        phone: order.contactPerson?.phone ?? '',
      },
    ],
    orderCategories: [order.primaryCategory, ...(order.additionalCategories ?? [])],
    selectedIndustries: order.targetIndustries ?? [],
    placementTypes: order.placementTypes ?? [],
    documents: [],
    verifications: order.requiredVerifications ?? [],
    certifications: order.requiredCertifications ?? [],
    specializations: [],
    selectedSpecializations: order.requiredSpecializations ?? [],
    location:
      (order.serviceAddress?.street ?? '') +
      ' ' +
      (order.serviceAddress?.houseNumber ?? '') +
      ', ' +
      (order.serviceAddress?.city ?? ''),
    street: order.serviceAddress?.street ?? '',
    houseNumber: order.serviceAddress?.houseNumber ?? '',
    postalCode: order.serviceAddress?.postalCode ?? '',
    city: order.serviceAddress?.city ?? '',
    country: order.serviceAddress?.country ?? 'Deutschland',
    latitude: order.location?.latitude ?? 0,
    longitude: order.location?.longitude ?? 0,
    radius: order.searchRadiusKm ?? 50,
    isUnlimitedRadius: (order.searchRadiusKm ?? 50) >= 1000,
    startDate: order.startDate ? new Date(order.startDate) : undefined,
    endDate: order.deadline ? new Date(order.deadline) : undefined,
    responseTime: order.responseTimeHours
      ? String(Math.round(order.responseTimeHours / 24))
      : '7',
    customResponseDays: undefined,
    customIndustry: undefined,
  };
} 