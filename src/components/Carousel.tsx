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

// 🔁 On crée une version doublée pour permettre le "loop"
const imagesLoop = [...IMAGES, ...IMAGES];

export function AutoCarousel() {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  // Préchargement des images
  useEffect(() => {
    imagesLoop.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Défilement automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, 2500); // toutes les 3s
    return () => clearInterval(interval);
  }, []);

  // "Reset invisible" pour rester dans la première moitié
  useEffect(() => {
    if (index === IMAGES.length) {
      // ⏸ On coupe l'animation pour éviter le "saut"
      setTimeout(() => {
        setAnimate(false);
        setIndex(0); // Repositionne dans la première moitié
        requestAnimationFrame(() => setAnimate(true)); // Réactive la transition
      }, 700); // Durée identique à la transition CSS
    }
  }, [index]);

  return (
    <div className="max-w-5xl overflow-hidden mt-10">
      <div
        className={`flex ${animate ? "transition-transform duration-700 ease-in-out" : ""}`}
        style={{
          transform: `translateX(-${index * (100 / 4)}%)`, // 4 images visibles → 25% chacune
        }}
      >
        {imagesLoop.map((src, i) => (
          <div key={i} className="w-1/4 flex-shrink-0 p-2">
            <img
              src={src}
              alt={`carousel-${i}`}
              className="w-full h-48 object-cover rounded-2xl shadow-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
