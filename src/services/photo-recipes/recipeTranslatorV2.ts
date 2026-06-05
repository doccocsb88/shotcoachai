import { PhotoRecipe, WhiteBalanceV2, GrainV2 } from '../../models/photoRecipe';

export function getFilmSimulationTranslation(simulation: string): string[] {
  const lower = simulation.toLowerCase();
  if (lower.includes('classic chrome')) {
    return [
      'Slightly muted colors',
      'Documentary film rendering',
      'Natural skin tones',
      'Controlled reds',
      'Calm blues',
      'Slightly subdued greens'
    ];
  }
  if (lower.includes('classic neg')) {
    return [
      'High contrast and deep shadows',
      'Nostalgic color reproduction',
      'Hard tones with distinct colors',
      'Rich cinematic feel'
    ];
  }
  if (lower.includes('nostalgic neg')) {
    return [
      'Soft and amber-tinted highlights',
      'Rich shadow detail',
      'Retro pop color look',
      'Warm and gentle nostalgic feel'
    ];
  }
  if (lower.includes('astia')) {
    return [
      'Soft colors with smooth skin tones',
      'Gentle contrast',
      'Vibrant but not overpowering'
    ];
  }
  if (lower.includes('velvia')) {
    return [
      'High saturation and high contrast',
      'Vivid landscape colors',
      'Deep blues and rich greens'
    ];
  }
  return ['Replicate the requested film simulation color science'];
}

export function getWBTranslation(wb: WhiteBalanceV2 | undefined): string[] {
  if (!wb) return ['Neutral color balance'];
  
  const translations: string[] = [];
  if (wb.redShift > 0 && wb.blueShift < 0) {
    translations.push('Warm and golden color balance');
  } else if (wb.redShift < 0 && wb.blueShift > 0) {
    translations.push('Cooler and cleaner color balance');
  } else if (wb.redShift < 0 && wb.blueShift < 0) {
    translations.push('Slightly cyan/green shifted balance');
  } else {
    translations.push('Neutral color balance adjustment');
  }
  
  if (wb.mode.toLowerCase().includes('fluorescent')) {
    translations.push('Compensate for artificial lighting or add creative vintage cast');
  }
  return translations;
}

export function getColorChromeTranslation(strength: string | undefined): string[] {
  const s = (strength || 'Off').toLowerCase();
  if (s === 'strong') return ['Rich color depth', 'Strong separation between similar colors', 'No HDR appearance'];
  if (s === 'weak') return ['Slightly richer color depth', 'Better separation between similar colors', 'No HDR appearance'];
  return ['Natural color depth'];
}

export function getColorChromeFXBlueTranslation(strength: string | undefined): string[] {
  const s = (strength || 'Off').toLowerCase();
  if (s === 'strong') return ['Deep blue tones', 'Strongly controlled ocean and sky rendering', 'No artificial saturation'];
  if (s === 'weak') return ['Slightly deeper blue tones', 'Controlled ocean and sky rendering', 'No artificial saturation'];
  return ['Natural sky and water rendering'];
}

export function getDRTranslation(dr: string | undefined): string[] {
  const s = (dr || 'DR100').toUpperCase();
  if (s.includes('400')) return ['Strong highlight protection', 'Preserve bright sky detail', 'Preserve water texture', 'Maintain wide tonal range'];
  if (s.includes('200')) return ['Moderate highlight protection', 'Preserve bright areas'];
  if (s.includes('AUTO')) return ['Balanced dynamic range for the scene'];
  return ['Standard dynamic range', 'Natural highlight clipping'];
}

export function getHighlightTranslation(value: number | undefined): string[] {
  const v = value || 0;
  if (v < 0) return ['Softer highlight rolloff', 'Reduced clipping', 'More film-like bright areas'];
  if (v > 0) return ['Harder highlights', 'More punch in bright areas'];
  return ['Standard highlight rendering'];
}

export function getShadowTranslation(value: number | undefined): string[] {
  const v = value || 0;
  if (v < 0) return ['Open shadows slightly', 'Preserve detail in dark regions', 'Avoid crushed blacks'];
  if (v > 0) return ['Deeper shadows', 'Higher contrast in dark areas', 'More dramatic film look'];
  return ['Standard shadow rendering'];
}

export function getColorTranslation(value: number | undefined): string[] {
  const v = value || 0;
  if (v < 0) return ['Desaturated, muted colors', 'Vintage faded look'];
  if (v > 0) return ['Slightly richer colors', 'Still realistic', 'No digital oversaturation'];
  return ['Standard color saturation'];
}

export function getSharpnessTranslation(value: number | undefined): string[] {
  const v = value || 0;
  if (v < 0) return ['Softer details', 'More organic vintage feel', 'Reduced digital sharpness'];
  if (v > 0) return ['Mild natural detail enhancement', 'No oversharpening'];
  return ['Natural lens sharpness'];
}

export function getNoiseReductionTranslation(value: number | undefined): string[] {
  const v = value || 0;
  if (v < 0) return ['Preserve natural texture', 'Avoid digital smoothing'];
  if (v > 0) return ['Smoother images', 'Reduced noise'];
  return ['Standard noise rendering'];
}

export function getClarityTranslation(value: number | undefined): string[] {
  const v = value || 0;
  if (v < 0) return ['Softened micro-contrast', 'Dreamy bloom-like effect in highlights'];
  if (v > 0) return ['Enhanced micro-contrast', 'Punchy textures'];
  return ['Keep original lens rendering', 'Avoid excessive micro-contrast'];
}

export function getGrainTranslation(grain: GrainV2 | undefined): string[] {
  if (!grain || !grain.enabled || grain.strength.toLowerCase() === 'off') {
    return ['Clean digital output'];
  }
  return [`Add \${grain.size.toLowerCase()}, \${grain.strength.toLowerCase()} film grain`, 'Organic texture'];
}

export function buildParameterTranslation(recipe: PhotoRecipe): string {
  let output = '';

  const sim = recipe.filmSimulation || 'Standard';
  output += `${sim}:\\n`;
  getFilmSimulationTranslation(sim).forEach(t => output += `- ${t}\\n`);
  output += '\\n';

  if (recipe.whiteBalance) {
    const wbStr = `WB Shift Red ${recipe.whiteBalance.redShift} Blue ${recipe.whiteBalance.blueShift}`;
    output += `${wbStr}:\\n`;
    getWBTranslation(recipe.whiteBalance).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  if (recipe.colorChromeEffect) {
    output += `Color Chrome Effect ${recipe.colorChromeEffect}:\\n`;
    getColorChromeTranslation(recipe.colorChromeEffect).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  if (recipe.colorChromeFXBlue) {
    output += `Color Chrome FX Blue ${recipe.colorChromeFXBlue}:\\n`;
    getColorChromeFXBlueTranslation(recipe.colorChromeFXBlue).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  if (recipe.dynamicRange) {
    output += `${recipe.dynamicRange}:\\n`;
    getDRTranslation(recipe.dynamicRange).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  if (recipe.highlight !== undefined) {
    output += `Highlight ${recipe.highlight}:\\n`;
    getHighlightTranslation(recipe.highlight).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  if (recipe.shadow !== undefined) {
    output += `Shadow ${recipe.shadow}:\\n`;
    getShadowTranslation(recipe.shadow).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  if (recipe.color !== undefined) {
    output += `Color ${recipe.color > 0 ? '+' : ''}${recipe.color}:\\n`;
    getColorTranslation(recipe.color).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  if (recipe.sharpness !== undefined) {
    output += `Sharpness ${recipe.sharpness > 0 ? '+' : ''}${recipe.sharpness}:\\n`;
    getSharpnessTranslation(recipe.sharpness).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  if (recipe.noiseReduction !== undefined) {
    output += `High ISO Noise Reduction ${recipe.noiseReduction}:\\n`;
    getNoiseReductionTranslation(recipe.noiseReduction).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  if (recipe.clarity !== undefined) {
    output += `Clarity ${recipe.clarity}:\\n`;
    getClarityTranslation(recipe.clarity).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  if (recipe.grain) {
    output += `Grain ${!recipe.grain.enabled ? 'Off' : recipe.grain.strength + ' ' + recipe.grain.size}:\\n`;
    getGrainTranslation(recipe.grain).forEach(t => output += `- ${t}\\n`);
    output += '\\n';
  }

  return output.trim();
}
