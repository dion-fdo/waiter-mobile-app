export const FontFamily = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
};

export const LineHeight = {
  xs: 16,
  sm: 20,
  md: 22,
  lg: 24,
  xl: 28,
  xxl: 32,
  title: 36,
};

export const Typography = {
  headingLarge: {
    fontSize: FontSize.title,
    lineHeight: LineHeight.title,
    fontFamily: FontFamily.bold,
    fontWeight: '700' as const,
  },
  headingMedium: {
    fontSize: FontSize.xxl,
    lineHeight: LineHeight.xxl,
    fontFamily: FontFamily.bold,
    fontWeight: '700' as const,
  },
  headingSmall: {
    fontSize: FontSize.xl,
    lineHeight: LineHeight.xl,
    fontFamily: FontFamily.semibold,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    fontFamily: FontFamily.regular,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontFamily: FontFamily.regular,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontFamily: FontFamily.regular,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontFamily: FontFamily.semibold,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
    fontFamily: FontFamily.regular,
    fontWeight: '400' as const,
  },
};