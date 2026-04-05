/**
 * Converts form data + file into FormData for multipart requests.
 * Useful for endpoints that accept both JSON fields and file uploads.
 *
 * @param data Object with form fields
 * @param file File to attach
 * @param fileFieldName Name of the field to append the file to (default: "image")
 * @returns FormData instance
 *
 * @example
 *   const formData = toFormData({ title: "Test" }, file);
 *   const formData = toFormData({ name: "User" }, avatar, "avatar");
 */
export function toFormData(
  data: Record<string, any>,
  file: File,
  fileFieldName: string = "image",
): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    // Skip empty values and the file field (will be replaced by actual file)
    if (value && key !== fileFieldName) {
      formData.append(key, value as string);
    }
  });

  formData.append(fileFieldName, file);
  return formData;
}
