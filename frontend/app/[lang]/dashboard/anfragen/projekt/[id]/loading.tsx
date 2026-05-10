import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProjectDetailLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex items-center">
          <Skeleton className="h-10 w-10 mr-4 rounded-full" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <Card className="w-[180px] shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <Skeleton className="h-5 w-24 mx-auto" />
          </CardHeader>
          <CardContent className="pb-4 pt-0 px-4">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-6 w-24 mt-1 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-7 w-36" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Skeleton className="h-4 w-32 mb-1.5" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-1.5" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>

          <Separator />

          {/* Project areas */}
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>

          {/* Project industry */}
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-48 rounded-full" />
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>
          </div>

          {/* Certifications */}
          <div>
            <Skeleton className="h-4 w-48 mb-3" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex flex-col">
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex flex-col">
                <Skeleton className="h-3 w-14 mb-1" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex flex-col">
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Mediation type */}
          <div>
            <Skeleton className="h-4 w-36 mb-1.5" />
            <Skeleton className="h-6 w-48 rounded-full" />
          </div>

          {/* Project timeframe */}
          <div>
            <Skeleton className="h-4 w-40 mb-3" />
            <Skeleton className="h-5 w-64 mb-2" />
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-2 rounded-full" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>

          {/* Response timeframe */}
          <div>
            <Skeleton className="h-4 w-44 mb-1.5" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>

          <Separator />

          {/* Buttons */}
          <div className="pt-2 flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
