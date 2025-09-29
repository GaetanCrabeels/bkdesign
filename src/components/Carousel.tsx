import { useEffect, useState } from "react";

const IMAGES = [
  "/images/IMG_5975-scaled.webp",
  "/images/IMG_6133-scaled.webp",
  "/images/IMG_6135-scaled.webp",
  "/images/IMG_6146-scaled.webp",
];

const imagesLoop = [...IMAGES, ...IMAGES];

export function AutoCarousel() {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setIndex((prev) => prev + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (index === IMAGES.length) {
      setTimeout(() => {
        setAnimate(false);
        setIndex(0);
        requestAnimationFrame(() => setAnimate(true));
      }, 700);
    }
  }, [index]);

  return (
    <div className=" mx-auto overflow-hidden ">
      <div
        className={`flex ${animate ? "transition-transform duration-700 ease-in-out" : ""}`}
        style={{ transform: `translateX(-${index * 25}%)` }}
      >
        {imagesLoop.map((src, i) => (
          <div key={i} className="w-1/4 flex-shrink-0 p-2">
            <img
              src={src}
              alt={`carousel-${i}`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover rounded-2xl shadow-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
