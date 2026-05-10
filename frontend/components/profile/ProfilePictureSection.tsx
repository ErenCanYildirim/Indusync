"use client";

import React, { useRef, type ChangeEvent } from "react";
import { Camera as CameraIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProfilePictureSectionProps {
  profilePicture: string | null;
  profilePictureFile: File | null;
  firstName: string;
  lastName: string;
  onProfilePictureChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const ProfilePictureSection: React.FC<ProfilePictureSectionProps> = ({
  profilePicture,
  profilePictureFile,
  firstName,
  lastName,
  onProfilePictureChange,
}) => {
  const t = useTranslations("Profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-shrink-0">
      <div className="relative group">
        <img
          src={
            profilePicture ??
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              `${firstName} ${lastName}`.trim() || "User"
            )}&background=random&size=128&font-size=0.33&color=fff&uppercase=true&bold=true`
          }
          alt={t("profilePicture.alt")}
          className="w-32 h-32 rounded-full object-cover border-4 border-border group-hover:opacity-75 transition-opacity"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={t("profilePicture.alt")}
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full transition-opacity text-white opacity-0 group-hover:opacity-100"
        >
          <CameraIcon />
          <span className="ml-2 text-sm">{t("profilePicture.change")}</span>
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onProfilePictureChange}
        accept="image/*"
        className="hidden"
        id="profilePictureInput"
        aria-labelledby="profilePictureLabel"
      />
      {profilePictureFile && (
        <p className="text-xs text-muted-foreground mt-2 text-center sm:text-left">
          {t("profilePicture.selected", {
            filename: profilePictureFile.name,
          })}
        </p>
      )}
    </div>
  );
};
