# Email Logo

Place your email logo files here. They will be automatically copied to `uploads/logos/` on app startup.

Supported formats:
- SVG
- PNG
- JPG/JPEG
- WebP
- GIF

## How it works

1. Add logo file(s) to this directory
   - e.g., `cat.png`, `dog.gif`, `logo.svg`

2. Restart the API server

3. All files will be automatically:
   - Copied to `uploads/logos/` with original filenames
   - First file is used for email template
   - URL cached in database

The upload is cached in the database, so files won't recopy on every restart. To update logos, modify the source files and clear the `EMAIL_LOGO_URL` setting from your database.

## Development vs Production

**Important:** During development (localhost), logos **will not load in emails if using local storage**. Most email services proxy images for security and performance reasons, which prevents them from accessing localhost URLs.

- **Dev (localhost):** Use S3 storage for logos to ensure they display in email previews and tests
- **Production:** Logos will display correctly in emails regardless of whether using local storage or S3

## File naming

You can name your files however you want:

```
apps/api/logos/
├── cat.png                   ← Will be copied as uploads/logos/cat.png
├── dog.gif                   ← Will be copied as uploads/logos/dog.gif
├── logo.svg                  ← Will be copied as uploads/logos/logo.svg
├── README.md
└── .gitkeep
```

The first file found will be used as the email logo URL.

## Examples

Single logo:
```bash
cp apps/web/public/favicon.svg apps/api/logos/logo.svg
# Result: uploads/logos/logo.svg
```

Multiple assets:
```bash
cp apps/web/public/favicon.svg apps/api/logos/logo.svg
cp brand-assets/winter.png apps/api/logos/winter.png
cp brand-assets/summer.gif apps/api/logos/summer.gif
# Result: All 3 copied to uploads/logos/ with same names
```

All files are uploaded raw - no processing, no resizing, just copied as-is!
