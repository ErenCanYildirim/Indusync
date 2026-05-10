"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, Play, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

type TrainingVideo = {
    id: number;
    title: string;
    category: string;
    duration: string;
    description: string;
    videoUrl: string;
}

const trainingVideos: TrainingVideo[] = [
  {
    id: 1,
    title: "Einführung in Indusync",
    category: "Grundlagen",
    duration: "12:30",
    description: "Lernen Sie die Grundlagen und ersten Schritte mit der Indusync-Plattform kennen.",
    videoUrl: "https://placeholder-video-link-indusync-intro.mp4", // TODO: Replace with actual video link
  },
  {
    id: 2,
    title: "Auftragsverwaltung",
    category: "Verwaltung",
    duration: "18:45",
    description: "Umfassende Anleitung zur Erstellung, Bearbeitung und Verwaltung von Aufträgen.",
    videoUrl: "https://placeholder-video-link-order-management.mp4", // TODO: Replace with actual video link
  },
  {
    id: 3,
    title: "Mitarbeiterverwaltung",
    category: "Verwaltung",
    duration: "15:20",
    description: "Alles über die Verwaltung von Mitarbeiterdaten, Berechtigungen und Rollen.",
    videoUrl: "https://placeholder-video-link-employee-management.mp4", // TODO: Replace with actual video link
  },
  {
    id: 4,
    title: "Matching-Verfahren erklärt",
    category: "Prozesse",
    duration: "22:15",
    description: "Detaillierte Erklärung des automatischen Matching-Systems und seiner Funktionsweise.",
    videoUrl: "https://placeholder-video-link-matching-process.mp4", // TODO: Replace with actual video link
  },
];

//Generate filter options from data
const getCategoryOptions = () => {
    const uniqueCategories = [...new Set(trainingVideos.map(video => video.category))];
    return [
        {value: "all", label: "Alle Kategorien"},
        ...uniqueCategories.map(category=>({value: category, label: category}))
    ];
};

const SchulungenPage = () => {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const router = useRouter();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => 
        setSearch(e.target.value);
    const handleCategoryChange = (v: string) => setCategory(v);

    const handleAddVideoClick = () => {
        router.push("/dashboard/schulungen/new");
    };

    const handleVideoClick = (id: number) => {
        router.push(`/dashboard/schulungen/${id}`);
    };

    const filteredVideos = trainingVideos.filter((video) => {
        const matchesSearch = 
            video.title.toLowerCase().includes(search.toLocaleLowerCase()) ||
            video.description.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = category === "all" ? true: video.category === category;
        return matchesSearch && matchesCategory;
    });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Schulungen</h1>
      <p className="text-muted-foreground mb-6">
        Lernen Sie die wichtigsten Funktionen von Indusync mit unseren Schulungsvideos.
      </p>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Input
              type="text"
              placeholder="Schulungen durchsuchen..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
              aria-label="Schulungen durchsuchen"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>

          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Alle Kategorien" />
            </SelectTrigger>
            <SelectContent>
              {getCategoryOptions().map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVideos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground text-lg">
              Keine Schulungsvideos gefunden
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Versuchen Sie andere Suchbegriffe oder Filter
            </p>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-lg shadow border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleVideoClick(video.id)}
            >
              {/* Thumbnail placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Play className="h-16 w-16 text-blue-600" />
                <span className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white text-sm px-3 py-1 rounded">
                  {video.duration}
                </span>
              </div>
              
              {/* Video Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-xl text-gray-900">
                    {video.title}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium ml-3">
                    {video.category}
                  </span>
                </div>
                
                <p className="text-muted-foreground text-base mb-4">
                  {video.description}
                </p>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{video.duration}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TODO: Add actual video player component */}
      {/* TODO: Replace placeholder URLs with actual video links */}
    </div>
  );
};

export default SchulungenPage;