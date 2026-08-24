const HEX_COLOR = /^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i;

const toLinearChannel = (channel: number): number => {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

export const getRelativeLuminance = (hex: string): number => {
  const match = hex.match(HEX_COLOR);
  if (!match) return 0;

  const [, red, green, blue] = match;
  const [linearRed, linearGreen, linearBlue] = [red, green, blue].map(
    (channel) => toLinearChannel(Number.parseInt(channel, 16)),
  );
  return linearRed * 0.2126 + linearGreen * 0.7152 + linearBlue * 0.0722;
};

export const getContrastRatio = ({
  background,
  foreground,
}: {
  background: string;
  foreground: string;
}): number => {
  const luminances = [
    getRelativeLuminance(background),
    getRelativeLuminance(foreground),
  ].sort((left, right) => right - left);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
};
