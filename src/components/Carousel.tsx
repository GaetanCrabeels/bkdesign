import { useEffect, useState } from "react";
const BASE = import.meta.env.BASE_URL;

const IMAGES = [
  `${BASE}/images/thumbnail_IMG_9536.jpg`,
  `${BASE}/images/thumbnail_IMG_9537.jpg`,
  `${BASE}/images/thumbnail_IMG_9538.jpg`,
  `${BASE}/images/thumbnail_IMG_9539.jpg`,
  `${BASE}/images/thumbnail_IMG_9540.jpg`,
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
              className="w-[100%] h-[80%] object-cover rounded-2xl shadow-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
