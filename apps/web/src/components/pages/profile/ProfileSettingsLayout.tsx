"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock } from "lucide-react";
import { AccInfoTab } from "./AccInfoTab";
import { SecurityTab } from "./SecurityTab";

export function ProfileSettingsLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and preferences
          </p>
        </div>

        {/* Content Area */}
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger
              value="account"
              className="flex items-center gap-2 cursor-pointer"
            >
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <AccInfoTab />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
