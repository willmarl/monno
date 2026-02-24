"use client";

export default function page() {
  const handleError = () => {
    throw new Error("sentry");
  };

  return (
    <div>
      <button className="border-2 cursor-pointer" onClick={handleError}>
        Test Error
      </button>
    </div>
  );
}
