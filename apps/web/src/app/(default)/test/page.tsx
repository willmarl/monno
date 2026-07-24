import { notFound } from "next/navigation";
import UIKitPage from "./UIKitPage";

/**
 * UI kit playground. On in non-production unless ENABLE_TEST_UI=false.
 * Off in production unless ENABLE_TEST_UI=true.
 */
function isTestUiEnabled(): boolean {
  if (process.env.ENABLE_TEST_UI === "true") return true;
  if (process.env.ENABLE_TEST_UI === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export default function TestPage() {
  if (!isTestUiEnabled()) {
    notFound();
  }

  return <UIKitPage />;
}
