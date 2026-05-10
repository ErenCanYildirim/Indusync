import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ReviewLoading() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center">
        <Skeleton className="h-10 w-10 mr-4 rounded-full" />
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-6 bg-slate-50">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-48" />
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-6 rounded-full" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
} 