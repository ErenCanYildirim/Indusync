"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations, useLocale } from "next-intl";
// Removed DashboardMobileNav import

// Replace the MobileNav import with our dashboard-specific one
// import { MobileNav } from "@/components/mobile-nav"

// Update the interface to include navGroups
interface DashboardAppBarProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

/**
 * generates a url for ui-avatars.com with name initials
 * @param name The name to generate initials for
 * @param profilePicture Optional actual profile picture URL
 */
const getAvatarUrl = (name: string, profilePicture?: string | null) =>
  profilePicture ??
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random&size=128&font-size=0.33&color=fff&uppercase=true&bold=true`;

/**
 * Generate user initials from name parts
 */
const getUserInitials = (
  firstName?: string,
  lastName?: string,
  email?: string
) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return "U";
};

/**
 * Generate display name for user
 */
const getDisplayName = (
  firstName?: string,
  lastName?: string,
  email?: string
) => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (email) {
    return email.split("@")[0];
  }
  return "Benutzer";
};

// Update the component to use real authentication data
export function DashboardAppBar({
  onMenuClick,
  isSidebarOpen,
  onToggleSidebar,
}: Readonly<DashboardAppBarProps>) {
  const [showSearch, setShowSearch] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout, isLoggingOut, isLoadingUser } = useAuth();
  const t = useTranslations("Dashboard.appBar");
  const currentLocale = useLocale();

  // Show loading spinner if user data is still loading
  if (isLoadingUser) {
    return (
      <header className="sticky top-0 z-30 flex h-16 items-center justify-center border-b border-border bg-card">
        <LoadingSpinner size="sm" text={t("loading")} />
      </header>
    );
  }

  // If no user data, don't render the component (should be handled by route protection)
  if (!user) {
    return null;
  }

  const userDisplayName = getDisplayName(
    user.firstName,
    user.lastName,
    user.email
  );
  const userInitials = getUserInitials(
    user.firstName,
    user.lastName,
    user.email
  );
  const avatarUrl = getAvatarUrl(userDisplayName);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 sm:px-6 shadow-sm text-foreground",
        isSidebarOpen ? "lg:pl-6" : "pl-6"
      )}
    >
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label={t("openMenu")}
          className="text-foreground hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Add desktop sidebar toggle button */}
      <div className="hidden md:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? t("collapseSidebar") : t("expandSidebar")}
          className="text-foreground hover:bg-muted mr-2"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div
        className={cn(
          "flex items-center ml-auto gap-4",
          showSearch ? "hidden md:flex" : "flex"
        )}
      >

        {/* Notifications */}
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-foreground hover:bg-muted"
            >
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                3
              </Badge>
              <span className="sr-only">{t("notifications")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>{t("notifications")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {[1, 2, 3].map((i) => (
                <DropdownMenuItem key={i} className="cursor-pointer py-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`/placeholder.svg?height=32&width=32`}
                        alt="Avatar"
                      />
                      <AvatarFallback>UN</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <p className="text-sm font-medium">
                        {t("notificationTitle")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("notificationDescription")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("notificationTime")}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer justify-center">
              <Link
                href="/dashboard/benachrichtigungen"
                className="text-sm text-primary"
              >
                {t("viewAllNotifications")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}

        {/* User menu with real authentication data */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 gap-2 px-2 rounded-full text-foreground hover:bg-muted"
              disabled={isLoggingOut}
            >
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarImage
                  src={avatarUrl}
                  alt={`${userDisplayName} Avatar`}
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-sm font-medium">
                {userDisplayName}
              </span>
              {isLoggingOut && <LoadingSpinner size="sm" className="ml-2" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={avatarUrl}
                    alt={`${userDisplayName} Avatar`}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {userDisplayName}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.accountType === "BUSINESS" && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{t("businessAccount")}</span>
                    </div>
                  )}
                  {user.accountType === "PERSONAL" && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{t("personalAccount")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/kontoeinstellungen"
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>{t("editProfile")}</span>
              </Link>
            </DropdownMenuItem>
            {user.accountType === "BUSINESS" && (
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/unternehmensprofil"
                  className="cursor-pointer"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>{t("companyProfile")}</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/kontoeinstellungen"
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>{t("settings")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isLoggingOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? t("loggingOut") : t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile search input (shown when search is toggled) */}
      {showSearch && (
        <div className="absolute inset-x-0 top-0 z-50 flex h-16 items-center gap-4 border-b border-border bg-card px-4 sm:px-6 md:hidden">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            className="flex-1 bg-background text-foreground border-border"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(false)}
            className="text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">{t("closeSearch")}</span>
          </Button>
        </div>
      )}

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("logoutConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("logoutConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut ? t("loggingOut") : t("logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
