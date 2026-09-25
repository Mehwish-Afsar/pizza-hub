import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export function UserLayout({ children }: { children: ReactNode }) {
const { isAuthenticated, ready } = useAuth();

useEffect(() => {
if (ready && !isAuthenticated) {
toast.error("Please log in to continue");
window.location.href = "/login";
}
}, [ready, isAuthenticated]);

return ( <MainLayout>
{!ready || !isAuthenticated ? ( <div className="mx-auto max-w-7xl space-y-4 px-4 py-12 sm:px-6"> <Skeleton className="h-10 w-64" /> <Skeleton className="h-40 w-full" /> <Skeleton className="h-40 w-full" /> </div>
) : (
children
)} </MainLayout>
);
}
