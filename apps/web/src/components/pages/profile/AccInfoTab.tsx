import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2, Mail } from "lucide-react";
import {
  useSessionUser,
  useSendVerificationEmail,
} from "@/features/auth/hooks";
import { useUpdateProfile } from "@/features/users/hooks";
import {
  updateUserSchema,
  type UpdateUserInput,
} from "@/features/users/schemas/updateUser.schema";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { toastSuccess, toastError } from "@/lib/toast";

export function AccInfoTab() {
  const router = useRouter();
  const { data: user } = useSessionUser();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: sendVerification, isPending: isSendingVerification } =
    useSendVerificationEmail();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
    },
    mode: "onChange",
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email || "",
      });
    }
  }, [user, form]);

  const handleSaveChanges = (data: UpdateUserInput) => {
    const payload = {
      ...data,
      email: data.email || undefined,
    };
    updateProfile(
      { data: payload, file: selectedFile || undefined },
      {
        onSuccess: () => {
          setIsEditing(false);
          setSelectedFile(null);
          // Redirect to refresh SSR component (Header) with updated user data
          router.refresh();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSaveChanges)}
            className="space-y-6"
          >
            {/* Avatar Section */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={user?.avatarPath || undefined}
                    alt="User avatar"
                  />
                  <AvatarFallback className="text-lg font-semibold">
                    {user?.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Profile Picture
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF (max. 2MB)
                  </p>
                </div>
              </div>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              )}
            </div>

            {/* Avatar Upload (only show when editing) */}
            {isEditing && (
              <>
                <Separator />
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Update Picture
                  </Label>
                  <AvatarUpload
                    onFileSelect={setSelectedFile}
                    disabled={isPending}
                    currentAvatarUrl={user?.avatarPath || undefined}
                    maxSize={2 * 1024 * 1024}
                  />
                </div>
              </>
            )}

            <Separator />

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  disabled={!isEditing || isPending}
                  {...form.register("username")}
                />
                {form.formState.errors.username && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.username.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  This is your unique identifier on the platform
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  disabled={!isEditing || isPending}
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
                <div className="space-y-2">
                  {user?.tempEmail ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Pending verification:{" "}
                        <span className="font-medium">{user.tempEmail}</span>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          sendVerification(undefined, {
                            onSuccess: () => {
                              toastSuccess("Verification email sent!");
                            },
                            onError: (error) => {
                              const errorMsg =
                                error instanceof Error
                                  ? error.message
                                  : "Failed to send verification email";
                              toastError(errorMsg);
                            },
                          });
                        }}
                        disabled={isSendingVerification}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        {isSendingVerification
                          ? "Sending..."
                          : "Resend verification"}
                      </Button>
                    </div>
                  ) : user?.isEmailVerified ? (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Email verified
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      We'll send a verification email when you save changes
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedFile(null);
                      form.reset();
                    }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
