"use client";

import React from "react";
import { useCompanyProfile } from "./use-company-profile";

/**
 * Example component demonstrating the useCompanyProfile hook usage
 */
export function CompanyProfileExample({ companyId }: { companyId: string }) {
  const {
    data: companyProfile,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useCompanyProfile(companyId);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        <p className="mt-2 text-sm text-gray-500">Loading company profile...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-red-800 font-semibold mb-2">
          Error Loading Company Profile
        </h3>
        <p className="text-red-600 mb-3">
          {error?.message || "An unknown error occurred"}
        </p>
        <button
          onClick={refetch}
          disabled={isRefetching}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isRefetching ? "Retrying..." : "Try Again"}
        </button>
      </div>
    );
  }

  if (!companyProfile) {
    return (
      <div className="p-4 text-center text-gray-500">
        No company profile data available
      </div>
    );
  }

  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {companyProfile.name}
          </h2>
          <p className="text-sm text-gray-500">{companyProfile.companyType}</p>
        </div>
        <button
          onClick={refetch}
          disabled={isRefetching}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isRefetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {companyProfile.description && (
        <p className="text-gray-700 mb-4">{companyProfile.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Company Details</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>
              <strong>City:</strong> {companyProfile.city || "Not specified"}
            </li>
            <li>
              <strong>Founded:</strong>{" "}
              {companyProfile.foundedYear || "Not specified"}
            </li>
            <li>
              <strong>Employees:</strong>{" "}
              {companyProfile.employeeCount || "Not specified"}
            </li>
            <li>
              <strong>Verified:</strong>{" "}
              {companyProfile.verified ? "Yes" : "No"}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Business Roles</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>
              <strong>Client:</strong>{" "}
              {companyProfile.isAuftraggeber ? "Yes" : "No"}
            </li>
            <li>
              <strong>Provider:</strong>{" "}
              {companyProfile.isAuftragnehmer ? "Yes" : "No"}
            </li>
          </ul>
        </div>
      </div>

      {companyProfile.specializations.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {companyProfile.specializations.map((spec, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {companyProfile.industries.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Industries</h3>
          <div className="flex flex-wrap gap-2">
            {companyProfile.industries.map((industry, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      )}

      {companyProfile.contactEmail && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            Contact Information
          </h3>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Email:</strong> {companyProfile.contactEmail}
            </p>
            {companyProfile.contactPhone && (
              <p>
                <strong>Phone:</strong> {companyProfile.contactPhone}
              </p>
            )}
          </div>
        </div>
      )}

      {companyProfile.qualityScore !== undefined && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Quality Metrics</h3>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Quality Score:</strong> {companyProfile.qualityScore}/5
            </p>
            {companyProfile.completionRate !== undefined && (
              <p>
                <strong>Completion Rate:</strong>{" "}
                {companyProfile.completionRate}%
              </p>
            )}
          </div>
        </div>
      )}

      {companyProfile.documents && companyProfile.documents.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Documents</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            {companyProfile.documents.map((doc) => (
              <li key={doc.id}>
                <strong>{doc.name}</strong> ({doc.type})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CompanyProfileExample;