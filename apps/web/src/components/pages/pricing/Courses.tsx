import { CourseCard } from "@/components/ui/CourseCard";

export function Courses() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <CourseCard
        title="Course A"
        description="Lorem, ipsum dolor sit amet consectetur adipisicing elit. In, eius quisquam"
        price={30}
      />
      <CourseCard
        title="Course B"
        description="Lorem, ipsum dolor sit amet consectetur adipisicing elit. In, eius quisquam"
        price={30}
      />
    </div>
  );
}
