import { useState } from "react";
import { COLORS } from "../theme/colors";
import {
  FiGlobe, FiCheckCircle, FiShield, FiDollarSign, FiHeadphones, FiTruck,
  FiSearch, FiFileText, FiPhone, FiMail, FiMapPin, FiArrowRight, FiZap,
  FiSettings, FiClock, FiMenu, FiX, FiClipboard, FiBox, FiFilter, FiTool,
  FiActivity, FiCalendar, FiBarChart2, FiCompass,
} from "react-icons/fi";
import { GiValve, GiPipes, GiOilDrum, GiFactory, GiMining, GiCargoShip, GiEarthAmerica, GiEarthAfricaEurope, GiEarthAsiaOceania } from "react-icons/gi";
import { FaLinkedin, FaFacebook, FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa";

const ICONS = {
  valve: GiValve,
  filter: FiFilter,
  pipe: GiPipes,
  instrument: FiActivity,
  electrical: FiZap,
  spare: FiTool,
  check: FiCheckCircle,
  "arrow-right": FiArrowRight,
  globe: FiGlobe,
  menu: FiMenu,
  close: FiX,
  "shield-check": FiShield,
  truck: FiTruck,
  headset: FiHeadphones,
  factory: GiFactory,
  "oil-rig": GiOilDrum,
  "mining-cart": GiMining,
  ship: GiCargoShip,
  gear: FiSettings,
  "dollar-circle": FiDollarSign,
  document: FiFileText,
  search: FiSearch,
  clipboard: FiClipboard,
  box: FiBox,
  mail: FiMail,
  phone: FiPhone,
  "map-pin": FiMapPin,
  clock: FiClock,
  calendar: FiCalendar,
  "bar-chart": FiBarChart2,
  "earth-americas": GiEarthAmerica,
  "earth-europe": GiEarthAfricaEurope,
  "earth-asia": GiEarthAsiaOceania,
  compass: FiCompass,
  linkedin: FaLinkedin,
  facebook: FaFacebook,
  instagram: FaInstagram,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp,
};

export default function Icon({ type, size = 32, color = COLORS.navy, className = "" }) {
  const [pulsing, setPulsing] = useState(false);
  const hoverColor = color === COLORS.orange ? "#4C89DE" : COLORS.orange;
  const style = { display: "block", cursor: "pointer", "--tm-icon-color": color, "--tm-icon-hover-color": hoverColor };
  const cls = ["tm-icon", pulsing ? "tm-icon-pulsing" : "", className].filter(Boolean).join(" ");
  const handleClick = () => setPulsing(true);
  const handleAnimEnd = () => setPulsing(false);

  const IconComponent = ICONS[type];
  if (!IconComponent) return null;

  return (
    <IconComponent
      className={cls}
      style={style}
      size={size}
      color={color}
      onClick={handleClick}
      onAnimationEnd={handleAnimEnd}
    />
  );
}
