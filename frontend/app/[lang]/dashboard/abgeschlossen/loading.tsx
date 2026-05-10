import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CompletedOrdersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table header skeletons */}
            <div className="flex border-b pb-2">
              <Skeleton className="h-5 w-32 mr-8" />
              <Skeleton className="h-5 w-32 mr-8" />
              <Skeleton className="h-5 w-32 mr-8" />
              <Skeleton className="h-5 w-32 mr-8" />
              <Skeleton className="h-5 w-16 mr-8" />
              <Skeleton className="h-5 w-24 mr-8" />
              <Skeleton className="h-5 w-24" />
            </div>
            
            {/* Table row skeletons */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center py-3 border-b">
                <Skeleton className="h-4 w-28 mr-8" />
                <Skeleton className="h-4 w-32 mr-8" />
                <Skeleton className="h-4 w-36 mr-8" />
                <Skeleton className="h-4 w-24 mr-8" />
                <Skeleton className="h-4 w-16 mr-8" />
                <Skeleton className="h-6 w-24 rounded-full mr-8" />
                <div className="flex ml-auto gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}

            {/* Pagination skeleton */}
            <div className="mt-6 flex justify-between items-center">
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 