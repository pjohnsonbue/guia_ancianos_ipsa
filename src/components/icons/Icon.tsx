import React from "react";
import Svg, { Path, Circle, Line, Rect } from "react-native-svg";

export type IconName =
  | "chevronLeft"
  | "chevronRight"
  | "settings"
  | "close"
  | "check"
  | "triangleDown"
  | "refresh"
  | "clipboard"
  | "book"
  | "award"
  | "play";

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// A small hand-picked line-icon set so core UI chrome renders identically and
// crisply on every device, instead of relying on how each platform draws an
// emoji.
export function Icon({ name, size = 20, color = "#152238", strokeWidth = 2 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
  };

  switch (name) {
    case "chevronLeft":
      return (
        <Svg {...common}>
          <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "chevronRight":
      return (
        <Svg {...common}>
          <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "settings":
      return (
        <Svg {...common}>
          <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Circle cx="14" cy="7" r="2.4" fill={color} />
          <Line x1="4" y1="14" x2="20" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Circle cx="9" cy="14" r="2.4" fill={color} />
          <Line x1="4" y1="21" x2="20" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Circle cx="16" cy="21" r="2.4" fill={color} />
        </Svg>
      );
    case "close":
      return (
        <Svg {...common}>
          <Path d="M6 6L18 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M18 6L6 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case "check":
      return (
        <Svg {...common}>
          <Path d="M5 13l4.5 4.5L19 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "triangleDown":
      // "More content below" affordance on a card's back face.
      return (
        <Svg {...common}>
          <Path d="M6 9L12 16L18 9Z" fill={color} />
        </Svg>
      );
    case "refresh":
      return (
        <Svg {...common}>
          <Path d="M20 11a8 8 0 0 0-14.6-4.5L4 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M4 3.5V8h4.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M4 13a8 8 0 0 0 14.6 4.5L20 16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M20 20.5V16h-4.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "clipboard":
      return (
        <Svg {...common}>
          <Rect x="5" y="4.5" width="14" height="17" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="9" y="2.5" width="6" height="4" rx="1.2" stroke={color} strokeWidth={strokeWidth} fill={color} fillOpacity={0.15} />
          <Path d="M8.5 14l2.5 2.5L15.5 11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "book":
      return (
        <Svg {...common}>
          <Path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Path d="M12 6.5C14 5 17 4.5 20.5 5v13c-3.5-.5-6.5 0-8.5 1.5V6.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </Svg>
      );
    case "award":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="9" r="5.5" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </Svg>
      );
    case "play":
      return (
        <Svg {...common}>
          <Path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill={color} />
        </Svg>
      );
    default:
      return null;
  }
}
