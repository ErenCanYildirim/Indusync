export interface MatchingPreviewRequest {
  companyId: string;
  primaryCategory?: string;
  targetIndustries: string[];
  placementTypes: string[];
  requiredSpecializations: string[];
  requiredCertifications: string[];
  requiredVerifications: string[];
  latitude?: number;
  longitude?: number;
  searchRadiusKm?: number;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: Date;
  deadline?: Date;
  budget?: number;
}

export interface MatchingCompanyResponse {
  companyId: string;
  companyName: string;
  matchScore: number;
  distanceKm?: number;
  industryScore?: number;
  skillsScore?: number;
  contractScore?: number;
  certificatesScore?: number;
  verificationScore?: number;
  radiusScore?: number;
  // Company details for display
  city?: string;
  description?: string;
  verified?: boolean;
  location?: string;
  specializations?: string[];
  verifications?: string[];
  certifications?: string[];
}

export interface MatchingPreviewResponse {
  queryId: string;
  totalMatches: number;
  averageScore?: number;
  bestMatchScore?: number;
  topMatches: MatchingCompanyResponse[];
  message?: string;
  createdAt?: Date;
}

export interface MatchingQueryHistory {
  queryId: string;
  createdAt: Date;
  primaryCategory?: string;
  searchRadiusKm?: number;
  totalMatches: number;
  averageScore?: number;
  bestMatchScore?: number;
}

export interface MatchingQueryDetails {
  query: {
    queryId: string;
    createdAt: string;
    primaryCategory?: string;
    targetIndustries?: string[];
    placementTypes?: string[];
    requiredSpecializations?: string[];
    requiredCertifications?: string[];
    requiredVerifications?: string[];
    latitude?: number;
    longitude?: number;
    searchRadiusKm?: number;
    urgency?: string;
    startDate?: string;
    deadline?: string;
    budget?: number;
    totalMatches: number;
    averageScore?: number;
    bestMatchScore?: number;
  };
  matches: MatchingCompanyResponse[];
} 