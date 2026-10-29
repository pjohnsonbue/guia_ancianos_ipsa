import React from "react";
import { Text, type TextStyle, type StyleProp } from "react-native";
import { fontFamily } from "../theme/theme";

// Splits "plain **bold** and *italic*" into styled runs.
function parse(src: string): { text: string; bold: boolean; italic: boolean }[] {
  const out: { text: string; bold: boolean; italic: boolean }[] = [];
  let bold = false, italic = false, buf = "";
  const push = () => {
    if (buf) out.push({ text: buf, bold, italic });
    buf = "";
  };
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "*" && src[i + 1] === "*") {
      push();
      bold = !bold;
      i++;
    } else if (src[i] === "*") {
      push();
      italic = !italic;
    } else {
      buf += src[i];
    }
  }
  push();
  return out;
}

/** Renders the reader's mini-markup (**bold**, *italic*). */
export const RichText = React.memo(function RichText({
  text,
  style,
  boldFamily = fontFamily.bodyBold,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  boldFamily?: string;
}) {
  const runs = parse(text);
  if (runs.length === 1 && !runs[0].bold && !runs[0].italic) return <Text style={style}>{runs[0].text}</Text>;
  return (
    <Text style={style}>
      {runs.map((r, i) => (
        <Text key={i} style={[r.bold && { fontFamily: boldFamily }, r.italic && { fontStyle: "italic" }]}>
          {r.text}
        </Text>
      ))}
    </Text>
  );
});
