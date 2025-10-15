import { FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
const BASE = import.meta.env.BASE_URL;

export function Footer() {
  return (
    <footer id="colophon" className="site-footer bg-[#000000] text-white py-8">
      <div className=" footer-center footer-last max-w-6xl mx-auto px-4">
        <div className="justify-between items-center gap-6">

          {/* Bloc gauche - Icônes contact */}
          <div className="flex justify-center gap-6 text-2xl">
            <a href="tel:+32476049257" aria-label="Téléphone" className="hover:text-white transition">
              <FaPhone />
            </a>
            <a href="mailto:bkdesignn@hotmail.com" aria-label="Envoyer un email" className="hover:text-white transition">
              <FaEnvelope />
            </a>
            <a
              href="https://www.google.com/maps/dir//Rte+d'Ath+426,+7050+Jurbise"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Voir sur Google Maps"
              className="hover:text-white transition"
            >
              <FaMapMarkerAlt />
            </a>
          </div>

          <div className=" text-[#ffffff] text-center ">
            <p>
              <strong className="text-[#ffc272]">Horaires :</strong> Mardi de 14h à 18h et du mercredi au samedi de 10h30 à 18h
            </p>
            <p>Rue des Fripiers 22B, Mons - 7000</p>
            <p>BK Design © 2025 — Tous droits réservés.</p>
            <p>
              Website by <strong className="text-[#ffc272]">Gaëtan Crabeels</strong>
            </p>
            <div className="mt-4 " >
              <a className="text-[#ffc272] mr-5 " href="/e-shop/policies/Return.html" target="_blank">Return Policy</a>
                            <a className="text-[#ffc272] mr-5 " href="/e-shop/policies/Private.html" target="_blank">Private Policy</a>
                            <a className="text-[#ffc272] " href="/e-shop/policies/Terms_and_conditions.html" target="_blank">Terms and conditions</a>

            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
