import { useState, useRef, useCallback, useEffect } from 'react';
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';
import { Download, Upload, Palette, Square, Circle, RectangleHorizontal, X, Sparkles, Blend, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import lovableHeart from '@/assets/lovable-heart.svg';

type QRStyle = 'squares' | 'dots' | 'rounded';
type GradientType = 'none' | 'linear' | 'radial';

interface QRSettings {
  content: string;
  fgColor: string;
  fgColor2: string;
  bgColor: string;
  style: QRStyle;
  gradientType: GradientType;
  gradientRotation: number;
  logo: string | null;
  logoSize: number;
}

interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
}

const extractColorsFromImage = (imageSrc: string): Promise<ExtractedColors> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ primary: '#0D9488', secondary: '#14B8A6', accent: '#2DD4BF' });
        return;
      }

      // Sample at a reasonable size
      const sampleSize = 50;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const pixels = imageData.data;

      // Collect colors with their frequencies
      const colorMap: Map<string, { r: number; g: number; b: number; count: number }> = new Map();

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip transparent and near-white/near-black pixels
        if (a < 128) continue;
        const brightness = (r + g + b) / 3;
        if (brightness > 240 || brightness < 15) continue;

        // Quantize colors to reduce noise
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;

        const existing = colorMap.get(key);
        if (existing) {
          existing.count++;
          existing.r = (existing.r + r) / 2;
          existing.g = (existing.g + g) / 2;
          existing.b = (existing.b + b) / 2;
        } else {
          colorMap.set(key, { r, g, b, count: 1 });
        }
      }

      // Sort by frequency and get top colors
      const sortedColors = Array.from(colorMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Find colors with good saturation
      const getSaturation = (r: number, g: number, b: number) => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return max === 0 ? 0 : (max - min) / max;
      };

      const saturatedColors = sortedColors
        .filter(c => getSaturation(c.r, c.g, c.b) > 0.2)
        .slice(0, 3);

      const toHex = (r: number, g: number, b: number) => 
        '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');

      if (saturatedColors.length >= 1) {
        resolve({
          primary: toHex(saturatedColors[0].r, saturatedColors[0].g, saturatedColors[0].b),
          secondary: saturatedColors[1] 
            ? toHex(saturatedColors[1].r, saturatedColors[1].g, saturatedColors[1].b)
            : toHex(saturatedColors[0].r * 0.8, saturatedColors[0].g * 0.8, saturatedColors[0].b * 0.8),
          accent: saturatedColors[2]
            ? toHex(saturatedColors[2].r, saturatedColors[2].g, saturatedColors[2].b)
            : toHex(saturatedColors[0].r * 1.2, saturatedColors[0].g * 1.2, saturatedColors[0].b * 1.2),
        });
      } else if (sortedColors.length >= 1) {
        resolve({
          primary: toHex(sortedColors[0].r, sortedColors[0].g, sortedColors[0].b),
          secondary: sortedColors[1] 
            ? toHex(sortedColors[1].r, sortedColors[1].g, sortedColors[1].b)
            : '#0D9488',
          accent: sortedColors[2]
            ? toHex(sortedColors[2].r, sortedColors[2].g, sortedColors[2].b)
            : '#14B8A6',
        });
      } else {
        resolve({ primary: '#0D9488', secondary: '#14B8A6', accent: '#2DD4BF' });
      }
    };
    img.onerror = () => {
      resolve({ primary: '#0D9488', secondary: '#14B8A6', accent: '#2DD4BF' });
    };
    img.src = imageSrc;
  });
};

const getStyleConfig = (style: QRStyle): { dotsType: DotType; cornersSquareType: CornerSquareType; cornersDotType: CornerDotType } => {
  switch (style) {
    case 'dots':
      return { 
        dotsType: 'dots', 
        cornersSquareType: 'dot',
        cornersDotType: 'dot'
      };
    case 'rounded':
      return { 
        dotsType: 'rounded', 
        cornersSquareType: 'extra-rounded',
        cornersDotType: 'dot'
      };
    case 'squares':
    default:
      return { 
        dotsType: 'square', 
        cornersSquareType: 'square',
        cornersDotType: 'square'
      };
  }
};

const StyleButton = ({ 
  active, 
  onClick, 
  children, 
  icon: Icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200",
      active 
        ? "bg-primary text-primary-foreground border-primary shadow-lg" 
        : "bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary hover:border-primary/30"
    )}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm font-medium">{children}</span>
  </button>
);

// ColorSwatch must be defined BEFORE ColorPicker since ColorPicker uses it
const ColorSwatch = ({ 
  color, 
  onClick, 
  active,
  size = 'md',
}: { 
  color: string; 
  onClick: () => void; 
  active: boolean;
  size?: 'sm' | 'md';
}) => (
  <button
    onClick={onClick}
    className={cn(
      "rounded-lg border-2 transition-all duration-200 hover:scale-110 flex-shrink-0",
      size === 'sm' ? 'w-7 h-7' : 'w-10 h-10',
      active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
    )}
    style={{ backgroundColor: color }}
    title={color.toUpperCase()}
  />
);

const ColorPicker = ({ 
  label, 
  value, 
  onChange,
  suggestedColors,
}: { 
  label: string; 
  value: string; 
  onChange: (color: string) => void;
  suggestedColors?: ExtractedColors | null;
}) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border hover:border-primary/50 transition-colors"
          style={{ padding: 0 }}
        />
      </div>
      <Input
        value={value.toUpperCase()}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm uppercase w-24"
        maxLength={7}
      />
      {suggestedColors && (
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <ColorSwatch
            color={suggestedColors.primary}
            onClick={() => onChange(suggestedColors.primary)}
            active={value.toLowerCase() === suggestedColors.primary.toLowerCase()}
            size="sm"
          />
          <ColorSwatch
            color={suggestedColors.secondary}
            onClick={() => onChange(suggestedColors.secondary)}
            active={value.toLowerCase() === suggestedColors.secondary.toLowerCase()}
            size="sm"
          />
          <ColorSwatch
            color={suggestedColors.accent}
            onClick={() => onChange(suggestedColors.accent)}
            active={value.toLowerCase() === suggestedColors.accent.toLowerCase()}
            size="sm"
          />
        </div>
      )}
    </div>
  </div>
);

export const QRCodeGenerator = () => {
  const [settings, setSettings] = useState<QRSettings>({
    content: 'https://custom-qr-code.lovable.app',
    fgColor: '#0D9488',
    fgColor2: '#2DD4BF',
    bgColor: '#FFFFFF',
    style: 'squares',
    gradientType: 'none',
    gradientRotation: 0,
    logo: lovableHeart,
    logoSize: 50,
  });

  const [suggestedColors, setSuggestedColors] = useState<ExtractedColors | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);

  // Build gradient or solid color options
  const getColorOptions = useCallback(() => {
    if (settings.gradientType === 'none') {
      return { color: settings.fgColor };
    }
    return {
      gradient: {
        type: settings.gradientType,
        rotation: settings.gradientRotation * (Math.PI / 180),
        colorStops: [
          { offset: 0, color: settings.fgColor },
          { offset: 1, color: settings.fgColor2 },
        ],
      },
    };
  }, [settings.gradientType, settings.fgColor, settings.fgColor2, settings.gradientRotation]);

  // Initialize QR code
  useEffect(() => {
    const styleConfig = getStyleConfig(settings.style);
    const colorOptions = getColorOptions();
    
    qrCodeRef.current = new QRCodeStyling({
      width: 280,
      height: 280,
      data: settings.content || 'https://custom-qr-code.lovable.app',
      dotsOptions: {
        ...colorOptions,
        type: styleConfig.dotsType,
      },
      cornersSquareOptions: {
        ...colorOptions,
        type: styleConfig.cornersSquareType,
      },
      cornersDotOptions: {
        ...colorOptions,
        type: styleConfig.cornersDotType,
      },
      backgroundOptions: {
        color: settings.bgColor,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 8,
        imageSize: 0.4,
      },
      image: settings.logo || undefined,
      qrOptions: {
        errorCorrectionLevel: 'H',
      },
    });

    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCodeRef.current.append(qrRef.current);
    }
  }, []);

  // Update QR code when settings change
  useEffect(() => {
    if (qrCodeRef.current) {
      const styleConfig = getStyleConfig(settings.style);
      
      // Build color options inline to avoid stale closure
      const colorOptions = settings.gradientType === 'none'
        ? { color: settings.fgColor, gradient: undefined }
        : {
            gradient: {
              type: settings.gradientType as 'linear' | 'radial',
              rotation: settings.gradientRotation * (Math.PI / 180),
              colorStops: [
                { offset: 0, color: settings.fgColor },
                { offset: 1, color: settings.fgColor2 },
              ],
            },
          };
      
      qrCodeRef.current.update({
        data: settings.content || 'https://custom-qr-code.lovable.app',
        dotsOptions: {
          ...colorOptions,
          type: styleConfig.dotsType,
        },
        cornersSquareOptions: {
          ...colorOptions,
          type: styleConfig.cornersSquareType,
        },
        cornersDotOptions: {
          ...colorOptions,
          type: styleConfig.cornersDotType,
        },
        backgroundOptions: {
          color: settings.bgColor,
        },
        image: settings.logo || undefined,
      });
    }
  }, [settings]);

  const updateSetting = <K extends keyof QRSettings>(key: K, value: QRSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageSrc = reader.result as string;
        updateSetting('logo', imageSrc);
        
        // Extract colors from the uploaded image
        const colors = await extractColorsFromImage(imageSrc);
        setSuggestedColors(colors);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeLogo = () => {
    updateSetting('logo', null);
    setSuggestedColors(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadQR = useCallback(() => {
    if (qrCodeRef.current) {
      qrCodeRef.current.download({ 
        name: 'qr-code',
        extension: 'png'
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">QR Code</span> Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create beautiful, customized QR codes in seconds
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Controls Panel */}
          <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6 animate-slide-up order-2 lg:order-1">
            {/* Content Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Content</Label>
              <Input
                value={settings.content}
                onChange={(e) => updateSetting('content', e.target.value)}
                placeholder="Enter URL or text..."
                className="h-12 text-base"
              />
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-6">
              <ColorPicker
                label="Foreground"
                value={settings.fgColor}
                onChange={(color) => updateSetting('fgColor', color)}
                suggestedColors={suggestedColors}
              />
              <ColorPicker
                label="Background"
                value={settings.bgColor}
                onChange={(color) => updateSetting('bgColor', color)}
              />
            </div>

            {/* Style Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Style</Label>
              <div className="flex flex-wrap gap-2">
                <StyleButton
                  active={settings.style === 'squares'}
                  onClick={() => updateSetting('style', 'squares')}
                  icon={Square}
                >
                  Squares
                </StyleButton>
                <StyleButton
                  active={settings.style === 'dots'}
                  onClick={() => updateSetting('style', 'dots')}
                  icon={Circle}
                >
                  Dots
                </StyleButton>
                <StyleButton
                  active={settings.style === 'rounded'}
                  onClick={() => updateSetting('style', 'rounded')}
                  icon={RectangleHorizontal}
                >
                  Rounded
                </StyleButton>
              </div>
            </div>

            {/* Gradient Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Color Mode</Label>
              <div className="flex flex-wrap gap-2">
                <StyleButton
                  active={settings.gradientType === 'none'}
                  onClick={() => updateSetting('gradientType', 'none')}
                  icon={Square}
                >
                  Solid
                </StyleButton>
                <StyleButton
                  active={settings.gradientType === 'linear'}
                  onClick={() => updateSetting('gradientType', 'linear')}
                  icon={Blend}
                >
                  Linear
                </StyleButton>
                <StyleButton
                  active={settings.gradientType === 'radial'}
                  onClick={() => updateSetting('gradientType', 'radial')}
                  icon={Sun}
                >
                  Radial
                </StyleButton>
              </div>
              
              {settings.gradientType !== 'none' && (
                <div className="space-y-4 pt-2 animate-fade-in">
                  <ColorPicker
                    label="Second Color"
                    value={settings.fgColor2}
                    onChange={(color) => updateSetting('fgColor2', color)}
                    suggestedColors={suggestedColors}
                  />
                  {settings.gradientType === 'linear' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Rotation: {settings.gradientRotation}°
                      </Label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={settings.gradientRotation}
                        onChange={(e) => updateSetting('gradientRotation', parseInt(e.target.value))}
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Logo / Image</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </Button>
                {settings.logo && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeLogo}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {settings.logo && (
                <div className="flex items-center gap-3 pt-2">
                  <img 
                    src={settings.logo} 
                    alt="Logo preview" 
                    className="w-10 h-10 rounded-lg object-contain border border-border"
                  />
                  <span className="text-sm text-muted-foreground">Logo uploaded</span>
                </div>
              )}
            </div>

            {/* Download Button */}
            <Button
              onClick={downloadQR}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 glow-effect"
            >
              <Download className="w-5 h-5 mr-2" />
              Download QR Code
            </Button>
          </div>

          {/* Preview Panel */}
          <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center animate-slide-up order-1 lg:order-2" style={{ animationDelay: '0.1s' }}>
            <div className="mb-4 flex items-center gap-2 text-muted-foreground">
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">Live Preview</span>
            </div>
            
            <div 
              ref={qrRef}
              className="relative p-6 rounded-2xl bg-card shadow-inner border border-border/50 flex items-center justify-center"
              style={{ backgroundColor: settings.bgColor, minWidth: 310, minHeight: 310 }}
            />

            <p className="mt-6 text-sm text-muted-foreground text-center max-w-xs">
              Scan with any QR reader to test your code
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Made with <span className="text-primary">♥</span> using Lovable
        </p>
      </div>
    </div>
  );
};
