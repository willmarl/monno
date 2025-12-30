import Layout from "@/components/layout/default/Layout";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Layout>{children}</Layout>
    </div>
  );
}
