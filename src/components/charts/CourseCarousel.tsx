import { useRef, useState } from "react";
import CourseCard from "./CourseCard";

export interface Course {
  courseName: string;
  studentCount: number;
}

interface CourseCarouselProps {
  courses: Course[];
}

export default function CourseCarousel({ courses }: CourseCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const scrollByCard = (direction: "left" | "right") => {
    if (!carouselRef.current) return;

    const card = carouselRef.current.querySelector(
      "[data-course-card]",
    ) as HTMLElement | null;

    if (!card) return;

    const gap = 16;
    const scrollAmount = card.offsetWidth + gap;

    carouselRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;

    setIsDragging(true);

    startX.current = e.clientX;
    scrollLeft.current = carouselRef.current.scrollLeft;

    carouselRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current) return;

    const distance = e.clientX - startX.current;

    carouselRef.current.scrollLeft = scrollLeft.current - distance;
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full min-w-0">
      {/* Left Arrow */}
      <button
        type="button"
        onClick={() => scrollByCard("left")}
        className="
          absolute
          left-2
          top-1/2
          z-10
          flex
          h-9
          w-9
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          bg-white
          shadow-md
          ring-1
          ring-gray-200
          transition
          hover:bg-gray-50
          active:scale-95
        "
        aria-label="Previous courses"
      >
        <span className="text-xl">‹</span>
      </button>

      {/* Carousel */}
      <div
        ref={carouselRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`
          flex
          w-full
          min-w-0
          gap-4
          overflow-x-auto
          overflow-y-hidden
          select-none
          snap-x
          snap-mandatory
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
          ${isDragging ? "cursor-grabbing" : "cursor-grab"}
        `}
      >
        {courses.map((course) => (
          <div
            key={course.courseName}
            data-course-card
            className="
              min-w-0
              shrink-0
              snap-start
              w-full
              sm:w-[calc(50%-8px)]
              md:w-[calc(33.333%-11px)]
              lg:w-[calc(25%-12px)]
              xl:w-[calc(20%-13px)]
            "
          >
            <CourseCard
              studentCount={course.studentCount}
              courseName={course.courseName}
            />
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        type="button"
        onClick={() => scrollByCard("right")}
        className="
          absolute
          right-2
          top-1/2
          z-10
          flex
          h-9
          w-9
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          bg-white
          shadow-md
          ring-1
          ring-gray-200
          transition
          hover:bg-gray-50
          active:scale-95
        "
        aria-label="Next courses"
      >
        <span className="text-xl">›</span>
      </button>
    </div>
  );
}
