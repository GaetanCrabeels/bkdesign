import { useEffect, useState } from "react";

const IMAGES = [
  "/images/IMG_5975-scaled.jpeg",
  "/images/IMG_6133-scaled.jpeg",
  "/images/IMG_6135-scaled.jpeg",
  "/images/IMG_6140-1-scaled.jpeg",
  "/images/IMG_6146-scaled.jpeg",
  "/images/IMG_6147-scaled.jpeg",
  "/images/IMG_6153-2-scaled.jpeg",
  "/images/IMG_6155-1-scaled.jpeg",
  "/images/IMG_6163-scaled.jpeg",
];
  const imagesLoop = [...IMAGES, ...IMAGES.slice(0, 4)];


export function AutoCarousel() {
  const [index, setIndex] = useState(0);

  // Précharger les images pour éviter le flash
  useEffect(() => {
    imagesLoop.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Avance automatiquement toutes les 3 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % IMAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-5xl overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
        transform: `translateX(-${index * 25}%)`
        }}
      >
        {imagesLoop.map((src, i) => (
          <div key={i} className="w-1/4 flex-shrink-0 p-2">
            <img
              src={src}
              alt=""
              className="w-full h-48 object-cover rounded-2xl shadow-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
