"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/4"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
              <div className="w-32 h-32 bg-muted rounded-full"></div>
              <div className="flex-grow space-y-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-10 bg-muted rounded w-32"></div>
          </CardContent>
        </Card>

        {/* Company Membership Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-10 bg-muted rounded w-32"></div>
          </CardContent>
        </Card>

        {/* Notifications Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/4"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
            <div className="h-10 bg-muted rounded w-32"></div>
          </CardContent>
        </Card>

        {/* Password Change Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
            <div className="h-10 bg-muted rounded w-32"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
