import * as THREE from 'three';

export function detectSoftwareGl(): boolean {
  const probeCanvas = document.createElement('canvas');
  const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param) || '');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

export function makeCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  maxAnisotropy = 4,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx, width, height);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createShopTvTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    1024,
    440,
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#071124');
      grad.addColorStop(0.5, '#0F2248');
      grad.addColorStop(1, '#091833');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle glowing spotlight halo behind brand text
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.44, 24, w * 0.5, h * 0.44, 380);
      glow.addColorStop(0, 'rgba(23, 105, 255, 0.34)');
      glow.addColorStop(0.6, 'rgba(23, 105, 255, 0.08)');
      glow.addColorStop(1, 'rgba(23, 105, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Crisp micro-tech grid pattern
      ctx.strokeStyle = 'rgba(127, 176, 255, 0.09)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x += 44) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 44) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Top gold & bottom electric blue accent bars
      ctx.fillStyle = '#FFC531';
      ctx.fillRect(0, 0, w, 12);
      ctx.fillStyle = '#1769FF';
      ctx.fillRect(0, h - 20, w, 20);

      // Corner HUD brackets
      ctx.strokeStyle = 'rgba(255, 197, 49, 0.7)';
      ctx.lineWidth = 4;
      const b = 28;
      ctx.strokeRect(24, 28, w - 48, h - 66);
      ctx.fillStyle = '#0B1733';
      ctx.fillRect(60, 20, w - 120, 20);
      ctx.fillRect(60, h - 50, w - 120, 20);
      void b;

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 72px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('USMAN MOBILE', w / 2, 146);

      ctx.fillStyle = '#DCE8FF';
      ctx.font = '700 38px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('REPAIRING CENTRE & ACCESSORIES', w / 2, 206);

      // Gold badge strip
      ctx.fillStyle = '#FFC531';
      ctx.fillRect(w * 0.2, 232, w * 0.6, 48);
      ctx.fillStyle = '#071124';
      ctx.font = '800 24px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('FAST   •   TRUSTED   •   EXPERT SERVICE', w / 2, 265);

      ctx.fillStyle = '#93C5FD';
      ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('LCD & IC REPAIR   |   SOFTWARE   |   AIRPODS   |   EASYPAISA & JAZZCASH', w / 2, 340);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '600 20px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('0300-1088723   •   0320-6882843', w / 2, 384);
    },
    maxAnisotropy,
  );
}

export function createTileFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      // Grout base
      ctx.fillStyle = '#B8C0CC';
      ctx.fillRect(0, 0, w, h);
      const cells = 4;
      const cell = w / cells;
      for (let r = 0; r < cells; r++) {
        for (let c = 0; c < cells; c++) {
          const x = c * cell + 3;
          const y = r * cell + 3;
          const s = cell - 6;
          // Polished ivory-marble showroom porcelain tiles
          const tileGrad = ctx.createLinearGradient(x, y, x + s, y + s);
          if ((r + c) % 2 === 0) {
            tileGrad.addColorStop(0, '#F1EFEA');
            tileGrad.addColorStop(1, '#DFDBD2');
          } else {
            tileGrad.addColorStop(0, '#E7E3DA');
            tileGrad.addColorStop(1, '#D7D2C8');
          }
          ctx.fillStyle = tileGrad;
          ctx.fillRect(x, y, s, s);

          // Subtle diagonal marble vein highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + s * 0.12, y + s * 0.78);
          ctx.lineTo(x + s * 0.82, y + s * 0.16);
          ctx.stroke();
        }
      }
    },
    maxAnisotropy,
  );
}

export function createSolarCellTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#0B1E40';
      ctx.fillRect(0, 0, w, h);

      // Photovoltaic cell grid
      const cols = 12;
      const rows = 6;
      const cw = w / cols;
      const ch = h / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = '#112E60';
          ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
          // Fine silver busbars
          ctx.fillStyle = 'rgba(176, 214, 255, 0.35)';
          ctx.fillRect(c * cw + cw * 0.32, r * ch + 2, 1, ch - 4);
          ctx.fillRect(c * cw + cw * 0.68, r * ch + 2, 1, ch - 4);
        }
      }
      // Aluminum outer frame trim
      ctx.strokeStyle = '#C6D4E3';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, w - 8, h - 8);
    },
    maxAnisotropy,
  );
}

export function createAwningTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    128,
    (ctx, w, h) => {
      const stripes = 12;
      const sw = w / stripes;
      for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#102A5C' : '#E2A829';
        ctx.fillRect(i * sw, 0, sw + 1, h);
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.fillRect(0, h - 18, w, 18);
    },
    maxAnisotropy,
  );
}

export function createRepairScreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    160,
    (ctx, w, h) => {
      ctx.fillStyle = '#071526';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#19A974';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 16; x < w - 16; x += 8) {
        const y = h * 0.55 + Math.sin(x * 0.09) * 20 * Math.cos(x * 0.03);
        if (x === 16) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#60A5FA';
      ctx.font = '600 18px monospace';
      ctx.fillText('DIAGNOSTIC OK', 18, 32);
      ctx.fillStyle = '#FFC531';
      ctx.fillText('4.20V  1.85A', 18, 140);
    },
    maxAnisotropy,
  );
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 18, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(6, 10, 20, 0.62)');
      grad.addColorStop(0.55, 'rgba(6, 10, 20, 0.28)');
      grad.addColorStop(1, 'rgba(6, 10, 20, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    1,
  );
}

export function createEnhancedSatelliteTexture(
  img: HTMLImageElement,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const natW = img.naturalWidth || 1150;
  const natH = img.naturalHeight || 862;
  const scale = Math.min(2, 2048 / Math.max(natW, natH));
  const w = Math.round(natW * scale);
  const h = Math.round(natH * scale);
  const tex = makeCanvasTexture(
    w,
    h,
    (ctx, cw, ch) => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.filter = 'contrast(1.05) saturate(1.08) brightness(1.02)';
      ctx.drawImage(img, 0, 0, cw, ch);
      ctx.filter = 'none';

      // Soft outer feather into website's warm sand theme (#F3ECE6)
      const edgeH = Math.round(cw * 0.015);
      const edgeV = Math.round(ch * 0.015);

      const leftGrad = ctx.createLinearGradient(0, 0, edgeH, 0);
      leftGrad.addColorStop(0, '#F3ECE6');
      leftGrad.addColorStop(1, 'rgba(243, 236, 230, 0)');
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, 0, edgeH, ch);

      const rightGrad = ctx.createLinearGradient(cw - edgeH, 0, cw, 0);
      rightGrad.addColorStop(0, 'rgba(243, 236, 230, 0)');
      rightGrad.addColorStop(1, '#F3ECE6');
      ctx.fillStyle = rightGrad;
      ctx.fillRect(cw - edgeH, 0, edgeH, ch);

      const topGrad = ctx.createLinearGradient(0, 0, 0, edgeV);
      topGrad.addColorStop(0, '#F3ECE6');
      topGrad.addColorStop(1, 'rgba(243, 236, 230, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, cw, edgeV);

      const bottomGrad = ctx.createLinearGradient(0, ch - edgeV, 0, ch);
      bottomGrad.addColorStop(0, 'rgba(243, 236, 230, 0)');
      bottomGrad.addColorStop(1, '#F3ECE6');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, ch - edgeV, cw, edgeV);
    },
    maxAnisotropy,
  );
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

export function createRoadRibbonTexture(
  isMain: boolean,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const tex = makeCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);

      // Dark high-contrast outer casing so bright red & yellow roads pop cleanly over sandy roofs
      const casingGrad = ctx.createLinearGradient(0, 0, w, 0);
      casingGrad.addColorStop(0, 'rgba(10, 16, 30, 0)');
      casingGrad.addColorStop(0.06, 'rgba(10, 16, 30, 0.85)');
      casingGrad.addColorStop(0.16, 'rgba(10, 16, 30, 0.88)');
      casingGrad.addColorStop(0.84, 'rgba(10, 16, 30, 0.88)');
      casingGrad.addColorStop(0.94, 'rgba(10, 16, 30, 0.85)');
      casingGrad.addColorStop(1, 'rgba(10, 16, 30, 0)');
      ctx.fillStyle = casingGrad;
      ctx.fillRect(0, 0, w, h);

      // Vibrant core fill: crisp Red for Main Bazar, vivid Gold-Yellow for Streets
      const coreGrad = ctx.createLinearGradient(w * 0.14, 0, w * 0.86, 0);
      if (isMain) {
        coreGrad.addColorStop(0, 'rgba(220, 38, 38, 0.94)');
        coreGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.88)');
        coreGrad.addColorStop(1, 'rgba(220, 38, 38, 0.94)');
      } else {
        coreGrad.addColorStop(0, 'rgba(234, 179, 8, 0.9)');
        coreGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.84)');
        coreGrad.addColorStop(1, 'rgba(234, 179, 8, 0.9)');
      }
      ctx.fillStyle = coreGrad;
      ctx.fillRect(w * 0.14, 0, w * 0.72, h);

      // Crisp bright inner border pinstripes for crisp aerial definition
      ctx.fillStyle = isMain
        ? 'rgba(254, 202, 202, 0.92)'
        : 'rgba(254, 249, 195, 0.9)';
      ctx.fillRect(w * 0.14, 0, w * 0.04, h);
      ctx.fillRect(w * 0.82, 0, w * 0.04, h);
    },
    maxAnisotropy,
  );
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export function createLampPoolTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    128,
    128,
    (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(255, 214, 130, 0.55)');
      grad.addColorStop(0.45, 'rgba(255, 188, 86, 0.22)');
      grad.addColorStop(1, 'rgba(255, 180, 70, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    1,
  );
}

export function createTwilightSkyTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    32,
    512,
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#070C18');
      grad.addColorStop(0.44, '#0B1325');
      grad.addColorStop(0.54, '#152544');
      grad.addColorStop(0.62, '#1C2E52');
      grad.addColorStop(1, '#09101E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    1,
  );
}

export function createSideBrandingBannerTexture(
  side: 'left' | 'right',
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    880,
    (ctx, w, h) => {
      // Rich dark navy shop sign background
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0B1733');
      bg.addColorStop(0.5, '#10224A');
      bg.addColorStop(1, '#081126');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Outer luminous border frame
      ctx.strokeStyle = side === 'left' ? '#1769FF' : '#19A974';
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.strokeStyle = '#FFC531';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, w - 48, h - 48);

      // Top golden header block
      ctx.fillStyle = '#FFC531';
      ctx.fillRect(28, 28, w - 56, 154);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#0A1328';
      if (side === 'left') {
        ctx.font = '800 50px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('USMAN MOBILE', w / 2, 92);
        ctx.font = '700 32px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('REPAIRING CENTRE', w / 2, 144);
      } else {
        ctx.font = '800 44px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('ACCESSORIES', w / 2, 92);
        ctx.font = '700 32px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('& DIGITAL SERVICES', w / 2, 144);
      }

      // Accent tagline bar
      ctx.fillStyle = side === 'left' ? '#1769FF' : '#19A974';
      ctx.fillRect(28, 194, w - 56, 58);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 26px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(
        side === 'left' ? 'FAST • TRUSTED • EXPERT' : 'QUALITY GUARANTEED',
        w / 2,
        232,
      );

      // Service rows with crisp divider lines
      const rows =
        side === 'left'
          ? [
              { title: 'MOBILE REPAIR', sub: 'All Android & iPhone Models' },
              { title: 'SOFTWARE & FLASH', sub: 'Unlocking & OS Recovery' },
              { title: 'LCD & GLASS', sub: 'Original Display Replacement' },
              { title: 'CHARGING & IC', sub: 'Precision Micro-Soldering' },
            ]
          : [
              { title: 'AIRPODS & AUDIO', sub: 'Handsfree, Buds & Speakers' },
              { title: 'CHARGERS & CABLES', sub: 'Fast Adapters & Power Banks' },
              { title: 'COVERS & GLASS', sub: 'Cases & Tempered Protectors' },
              { title: 'EASYPAISA • JAZZCASH', sub: 'Easyload & Electricity Bills' },
            ];

      let y = 314;
      rows.forEach((row, idx) => {
        ctx.fillStyle = '#FFC531';
        ctx.font = '700 32px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(row.title, w / 2, y);

        ctx.fillStyle = '#DCE8FF';
        ctx.font = '500 22px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(row.sub, w / 2, y + 34);

        if (idx < rows.length - 1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(64, y + 58);
          ctx.lineTo(w - 64, y + 58);
          ctx.stroke();
        }
        y += 108;
      });

      // Bottom footer callout
      ctx.fillStyle = '#152A56';
      ctx.fillRect(28, h - 134, w - 56, 106);
      ctx.fillStyle = '#FFC531';
      ctx.font = '700 28px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(
        side === 'left' ? '0300-1088723' : 'OPEN 7 DAYS',
        w / 2,
        h - 86,
      );
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 25px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(
        side === 'left' ? '0320-6882843' : '9:00 AM – 10:00 PM',
        w / 2,
        h - 46,
      );
    },
    maxAnisotropy,
  );
}

export function createSidewalkStandeeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    384,
    640,
    (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#09152E');
      bg.addColorStop(1, '#102654');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#FFC531';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Top vibrant banner
      ctx.fillStyle = '#FFC531';
      ctx.fillRect(18, 18, w - 36, 118);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#081226';
      ctx.font = '800 38px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('USMAN MOBILE', w / 2, 72);
      ctx.font = '700 22px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('EXPERT REPAIR LAB', w / 2, 112);

      // Services pills
      const items = [
        { bg: '#1769FF', fg: '#FFFFFF', text: 'LCD & GLASS REPAIR' },
        { bg: '#19A974', fg: '#FFFFFF', text: 'EASYPAISA • JAZZCASH' },
        { bg: '#F59E0B', fg: '#0A1120', text: 'AIRPODS & CHARGERS' },
        { bg: '#0EA5E9', fg: '#FFFFFF', text: 'SOFTWARE & UNLOCK' },
      ];
      items.forEach((it, idx) => {
        const y = 164 + idx * 92;
        ctx.fillStyle = it.bg;
        ctx.fillRect(28, y, w - 56, 68);
        ctx.fillStyle = it.fg;
        ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(it.text, w / 2, y + 42);
      });

      // Phone footer
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('0300-1088723', w / 2, 566);
      ctx.fillStyle = '#FFC531';
      ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('0320-6882843', w / 2, 602);
    },
    maxAnisotropy,
  );
}

export function createShelfHeaderTexture(
  title: string,
  accentHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    96,
    (ctx, w, h) => {
      ctx.fillStyle = '#0B162E';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = accentHex;
      ctx.fillRect(0, h - 10, w, 10);
      ctx.fillRect(0, 0, w, 6);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 34px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(title, w / 2, 60);
    },
    maxAnisotropy,
  );
}

export function createSchematicScreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    160,
    (ctx, w, h) => {
      ctx.fillStyle = '#061522';
      ctx.fillRect(0, 0, w, h);

      // Stylized phone PCB layout
      ctx.strokeStyle = '#1E40AF';
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, 120, 112);

      // IC chips
      ctx.fillStyle = '#0F2A4D';
      ctx.fillRect(42, 40, 34, 34);
      ctx.fillRect(88, 52, 42, 26);
      ctx.fillRect(46, 88, 54, 32);

      // Highlighted circuit traces
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(76, 56);
      ctx.lineTo(88, 56);
      ctx.moveTo(59, 74);
      ctx.lineTo(59, 88);
      ctx.moveTo(100, 104);
      ctx.lineTo(132, 104);
      ctx.stroke();

      // Thermal hotspot indicator
      const hot = ctx.createRadialGradient(108, 65, 2, 108, 65, 18);
      hot.addColorStop(0, 'rgba(255, 80, 50, 0.95)');
      hot.addColorStop(1, 'rgba(255, 80, 50, 0)');
      ctx.fillStyle = hot;
      ctx.fillRect(86, 44, 44, 42);

      // Side telemetry readouts
      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 14px monospace';
      ctx.fillText('PCB MAP', 160, 42);
      ctx.fillStyle = '#4ADE80';
      ctx.fillText('PMIC OK', 160, 72);
      ctx.fillStyle = '#FACC15';
      ctx.fillText('380°C', 160, 102);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('USB-C', 160, 130);
    },
    maxAnisotropy,
  );
}

export function createEasypaisaStandTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    180,
    (ctx, w, h) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(0, 0, w, h / 2);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(0, h / 2, w, h / 2);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 32px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('easypaisa', w / 2, 58);

      ctx.fillStyle = '#FEF08A';
      ctx.font = '800 30px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('JazzCash', w / 2, 146);
    },
    maxAnisotropy,
  );
}

export function createAcFanTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#D8DFEA';
      ctx.fillRect(0, 0, w, h);

      // Recessed dark fan cavity
      ctx.fillStyle = '#162030';
      ctx.beginPath();
      ctx.arc(w * 0.4, h * 0.5, 76, 0, Math.PI * 2);
      ctx.fill();

      // Fan blades
      ctx.fillStyle = '#334155';
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(w * 0.4, h * 0.5);
        ctx.rotate((i * Math.PI * 2) / 3 + 0.3);
        ctx.beginPath();
        ctx.ellipse(32, 0, 34, 16, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.arc(w * 0.4, h * 0.5, 14, 0, Math.PI * 2);
      ctx.fill();

      // Protective concentric grille rings
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 3;
      [28, 48, 68].forEach((r) => {
        ctx.beginPath();
        ctx.arc(w * 0.4, h * 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Right side control panel louver
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(w * 0.78, 36, 34, 14);
      ctx.fillStyle = '#1E293B';
      for (let y = 78; y < 210; y += 16) {
        ctx.fillRect(w * 0.76, y, 40, 6);
      }
    },
    maxAnisotropy,
  );
}

export function createWelcomeMatTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#141D2E';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#FFC531';
      ctx.lineWidth = 10;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFC531';
      ctx.font = '800 54px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('WELCOME', w / 2, 126);
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('USMAN MOBILE REPAIRING CENTRE', w / 2, 182);
    },
    maxAnisotropy,
  );
}

// ============================================================================
// REALISTIC REAL-SHOP TEXTURES (Matching Usman Mobile Repairing Centre Photos)
// ============================================================================

export function createWhiteMarbleTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const base = ctx.createLinearGradient(0, 0, w, h);
      base.addColorStop(0, '#F4F3F0');
      base.addColorStop(0.5, '#EAE8E4');
      base.addColorStop(1, '#E2DFD9');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      // Organic bold & fine dark-grey Calacatta marble veins (just like the real counter & gate)
      const drawVein = (
        pts: [number, number][],
        color: string,
        width: number,
        blur = 0,
      ) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (blur > 0) ctx.filter = `blur(${blur}px)`;
        ctx.beginPath();
        pts.forEach(([x, y], idx) => {
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
      };

      drawVein(
        [
          [0, 120],
          [85, 165],
          [168, 225],
          [245, 210],
          [340, 295],
          [435, 360],
          [512, 410],
        ],
        'rgba(82, 84, 88, 0.36)',
        14,
        5,
      );
      drawVein(
        [
          [0, 122],
          [88, 166],
          [170, 228],
          [248, 212],
          [342, 298],
          [438, 362],
          [512, 412],
        ],
        'rgba(58, 60, 64, 0.72)',
        4,
      );
      drawVein(
        [
          [180, 0],
          [215, 70],
          [260, 118],
          [325, 140],
          [410, 200],
          [512, 235],
        ],
        'rgba(95, 97, 102, 0.3)',
        10,
        4,
      );
      drawVein(
        [
          [184, 0],
          [218, 72],
          [264, 120],
          [328, 142],
          [414, 202],
          [512, 238],
        ],
        'rgba(66, 68, 72, 0.58)',
        2.5,
      );
      drawVein(
        [
          [30, 390],
          [120, 355],
          [190, 385],
          [290, 455],
          [385, 495],
        ],
        'rgba(78, 80, 84, 0.45)',
        3,
      );
      drawVein(
        [
          [260, 212],
          [295, 255],
          [282, 315],
          [325, 368],
        ],
        'rgba(72, 74, 78, 0.38)',
        2,
      );
    },
    maxAnisotropy,
  );
}

export function createCementFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#7A7D80';
      ctx.fillRect(0, 0, w, h);

      // Smooth troweled Pakistani cement floor mottling
      let s = 1337;
      const rnd = () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
      };
      for (let i = 0; i < 120; i++) {
        const cx = rnd() * w;
        const cy = rnd() * h;
        const r = 28 + rnd() * 95;
        const shade = Math.floor(96 + rnd() * 48);
        const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
        g.addColorStop(0, `rgba(${shade}, ${shade + 2}, ${shade + 4}, 0.22)`);
        g.addColorStop(1, `rgba(${shade}, ${shade + 2}, ${shade + 4}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      // Subtle floor expansion joint lines
      ctx.strokeStyle = 'rgba(42, 44, 48, 0.24)';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    },
    maxAnisotropy,
  );
}

export function createPlasterWallTexture(
  baseHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, w, h);

      let s = 4219;
      const rnd = () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
      };
      for (let i = 0; i < 95; i++) {
        const cx = rnd() * w;
        const cy = rnd() * h;
        const r = 35 + rnd() * 110;
        const dark = rnd() > 0.5;
        const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
        g.addColorStop(0, dark ? 'rgba(95, 92, 86, 0.065)' : 'rgba(255, 255, 250, 0.08)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
    },
    maxAnisotropy,
  );
}

export function createHangingWallPacksTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    1024,
    512,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);

      // Left 76% = 3 horizontal wooden wall rails packed with labeled blister packs
      const railYs = [62, 206, 352];
      railYs.forEach((ry) => {
        ctx.fillStyle = '#6E5B48';
        ctx.fillRect(14, ry - 12, 748, 22);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(14, ry + 10, 748, 6);
      });

      const drawPack = (
        x: number,
        y: number,
        pw: number,
        ph: number,
        cardBg: string,
        headerBg: string,
        headerText: string,
        subText: string,
        glyph: 'cable' | 'buds' | 'plug' | 'case',
      ) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + 3, y + 4, pw, ph);
        ctx.fillStyle = cardBg;
        ctx.fillRect(x, y, pw, ph);
        ctx.fillStyle = headerBg;
        ctx.fillRect(x, y, pw, ph * 0.28);
        // Peg hook hole
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + pw * 0.34, y + 4, pw * 0.32, 4);
        // Crisp header text
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 8px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(headerText, x + pw * 0.5, y + ph * 0.22);

        // Clear blister window with product silhouette
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.fillRect(x + 5, y + ph * 0.33, pw - 10, ph * 0.44);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 5, y + ph * 0.33, pw - 10, ph * 0.44);

        const cx = x + pw * 0.5;
        const cy = y + ph * 0.55;
        ctx.strokeStyle = '#1E293B';
        ctx.fillStyle = '#1E293B';
        if (glyph === 'cable') {
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 8, 12, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillRect(cx - 3, cy - 17, 6, 6);
        } else if (glyph === 'buds') {
          ctx.beginPath();
          ctx.arc(cx - 6, cy - 6, 4.5, 0, Math.PI * 2);
          ctx.arc(cx + 6, cy - 6, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy - 2);
          ctx.lineTo(cx - 4, cy + 12);
          ctx.moveTo(cx + 6, cy - 2);
          ctx.lineTo(cx + 4, cy + 12);
          ctx.stroke();
        } else if (glyph === 'plug') {
          ctx.fillRect(cx - 8, cy - 8, 16, 16);
          ctx.fillStyle = '#CBD5E1';
          ctx.fillRect(cx - 5, cy - 14, 3, 6);
          ctx.fillRect(cx + 2, cy - 14, 3, 6);
        } else {
          ctx.fillStyle = headerBg;
          ctx.fillRect(cx - 9, cy - 14, 18, 28);
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(cx - 6, cy - 11, 6, 8);
        }

        // Bottom spec strip
        ctx.fillStyle = '#0F172A';
        ctx.font = '700 7px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(subText, x + pw * 0.5, y + ph - 7);

        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x, y, pw, ph);
      };

      // Row 1: Fast Chargers & Orange/Green Cable Packs
      for (let i = 0; i < 16; i++) {
        const px = 22 + i * 46;
        if (i < 10) {
          drawPack(px, 58, 38, 108, '#F8FAFC', '#EA580C', 'TYPE-C', '65W 6A', 'cable');
        } else {
          drawPack(px, 58, 38, 108, '#F0FDF4', '#16A34A', 'RONIN', 'BASS', 'buds');
        }
      }

      // Row 2: Signature Bright YELLOW Turbo Cables + Green/Black Handsfree
      for (let i = 0; i < 16; i++) {
        const px = 22 + i * 46;
        if (i < 10) {
          drawPack(px, 200, 40, 114, '#FEF08A', '#CA8A04', 'FAST 6A', '1.2M', 'cable');
        } else {
          drawPack(px, 200, 38, 110, '#ECFDF5', '#15803D', 'HD MIC', '3.5MM', 'buds');
        }
      }

      // Row 3: White/Green Handsfree + Red Turbo Adapters
      for (let i = 0; i < 16; i++) {
        const px = 22 + i * 46;
        if (i < 9) {
          drawPack(px, 344, 38, 118, '#F8FAFC', '#16A34A', 'STEREO', 'ORIG', 'buds');
        } else {
          drawPack(px, 344, 38, 114, '#FEF2F2', '#DC2626', '33W PD', 'TURBO', 'plug');
        }
      }

      // Right 22% = White wire grid mesh rack with hanging covers & glass
      const gx0 = 786;
      const gw = 222;
      ctx.strokeStyle = '#D6D9DE';
      ctx.lineWidth = 3;
      ctx.strokeRect(gx0, 44, gw, 434);
      ctx.lineWidth = 1.6;
      for (let gx = gx0 + 28; gx < gx0 + gw; gx += 28) {
        ctx.beginPath();
        ctx.moveTo(gx, 44);
        ctx.lineTo(gx, 478);
        ctx.stroke();
      }
      for (let gy = 74; gy < 478; gy += 32) {
        ctx.beginPath();
        ctx.moveTo(gx0, gy);
        ctx.lineTo(gx0 + gw, gy);
        ctx.stroke();
      }
      const gridSpecs: [string, string, string][] = [
        ['#CA8A04', 'COVER', 'SLIM'],
        ['#0284C7', '9D PRO', 'GLASS'],
        ['#DC2626', 'MAGSAFE', 'CASE'],
        ['#16A34A', 'MATTE', '9H'],
      ];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const [col, t1, t2] = gridSpecs[(r + c) % gridSpecs.length];
          drawPack(gx0 + 16 + c * 50, 66 + r * 136, 38, 106, '#F8FAFC', col, t1, t2, 'case');
        }
      }
    },
    maxAnisotropy,
  );
}

export function createBackCabinetTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    1024,
    768,
    (ctx, w, h) => {
      // Dark walnut-brown wooden wall shelving unit (matching bf16940b.jpeg)
      ctx.fillStyle = '#332219';
      ctx.fillRect(0, 0, w, h);

      // Horizontal shelf planks + crisp retail shelf-edge labels
      const shelfSpecs = [
        { y: 152, label: 'FAST CHARGERS 33W - 67W  •  ORIGINAL ADAPTERS' },
        { y: 304, label: 'AIRPODS PRO  •  BLUETOOTH HEADSETS  •  SPEAKERS' },
        { y: 456, label: 'HANDSFREE  •  TYPE-C CABLES  •  CAR CHARGERS' },
        { y: 608, label: 'ORIGINAL BATTERIES  •  9D GLASS  •  MOBILE COVERS' },
        { y: 742, label: 'IC SPARE PARTS  •  CHARGING JACKS  •  REPAIR JARS' },
      ];
      shelfSpecs.forEach(({ y: sy, label }) => {
        ctx.fillStyle = '#4E3527';
        ctx.fillRect(10, sy, w - 20, 22);
        ctx.fillStyle = '#1E140E';
        ctx.fillRect(10, sy + 22, w - 20, 6);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FDE68A';
        ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(label, w / 2, sy + 15);
      });

      // Vertical wooden dividers
      [12, 260, 512, 764, w - 24].forEach((vx) => {
        ctx.fillStyle = '#261810';
        ctx.fillRect(vx, 0, 14, h);
      });

      const drawLabeledBox = (
        x: number,
        y: number,
        bw: number,
        bh: number,
        bg: string,
        band: string,
        title: string,
        sub: string,
      ) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.fillRect(x + 3, y + 3, bw, bh);
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, bw, bh);
        ctx.fillStyle = band;
        ctx.fillRect(x, y, bw, bh * 0.3);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 10px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(title, x + bw / 2, y + bh * 0.21);

        // Product graphic preview window
        ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
        ctx.fillRect(x + 6, y + bh * 0.36, bw - 12, bh * 0.38);
        ctx.fillStyle = band;
        ctx.beginPath();
        ctx.arc(x + bw / 2, y + bh * 0.55, Math.min(bw, bh) * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0F172A';
        ctx.font = '700 9px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(sub, x + bw / 2, y + bh - 10);

        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x, y, bw, bh);
      };

      // Row 1: Fast Chargers & Adapters
      for (let i = 0; i < 16; i++) {
        drawLabeledBox(
          28 + i * 60,
          24,
          52,
          124,
          i % 3 === 0 ? '#FEF9C3' : '#F8FAFC',
          i % 2 === 0 ? '#0F172A' : '#DC2626',
          i % 2 === 0 ? '33W PD' : '67W',
          'FAST',
        );
      }

      // Row 2: AirPods, Neckbands & Speakers
      for (let i = 0; i < 15; i++) {
        const isBig = i >= 13;
        drawLabeledBox(
          28 + i * 62,
          178,
          isBig ? 82 : 54,
          122,
          isBig ? '#FFF1F2' : '#F8FAFC',
          isBig ? '#E11D48' : '#1D4ED8',
          isBig ? 'JBL BASS' : 'AIRPODS',
          isBig ? 'BT 5.3' : 'PRO ANC',
        );
      }

      // Row 3: Signature Lime-Green Handsfree & Orange Cable Packs
      for (let i = 0; i < 16; i++) {
        const isLime = i >= 6;
        drawLabeledBox(
          28 + i * 60,
          332,
          52,
          120,
          isLime ? '#ECFCCB' : '#FFEDD5',
          isLime ? '#4D7C0F' : '#EA580C',
          isLime ? 'RONIN' : 'TYPE-C',
          isLime ? 'R-9 PRO' : '6A TURBO',
        );
      }

      // Row 4: Original Batteries & Yellow Power Packs
      for (let i = 0; i < 15; i++) {
        const isYellow = i > 10;
        drawLabeledBox(
          28 + i * 62,
          482,
          54,
          122,
          isYellow ? '#FEF08A' : '#E0F2FE',
          isYellow ? '#B45309' : '#0369A1',
          isYellow ? 'POWER' : 'BATTERY',
          isYellow ? '20000' : '5000mAh',
        );
      }

      // Row 5 (bottom): Labeled transparent spare-parts jars
      const jarTags = ['IC', 'USB', 'MIC', 'LCD', 'SIM', 'PIN', 'SPK', 'CAM'];
      for (let i = 0; i < 16; i++) {
        const jx = 32 + i * 60;
        ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
        ctx.fillRect(jx, 650, 44, 88);
        ctx.fillStyle = i % 2 === 0 ? '#1E293B' : '#DC2626';
        ctx.fillRect(jx - 2, 636, 48, 16);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(jx + 4, 676, 36, 24);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0F172A';
        ctx.font = '800 12px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(jarTags[i % jarTags.length], jx + 22, 693);
      }
    },
    maxAnisotropy,
  );
}

export function createStorefrontLowerPosterTexture(
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      // Authentic white & red Urdu poster on the lower-left storefront panel (matching store.jpg)
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      // Top telecom network strip (Jazz, Telenor, Zong, Ufone)
      const nets = ['#DC2626', '#0284C7', '#16A34A', '#EA580C'];
      nets.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(34 + i * 116, 28, 94, 48);
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = '#B91C1C';
      ctx.font = '800 58px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText('عثمان', w / 2 + 80, 160);

      ctx.fillStyle = '#0F172A';
      ctx.font = '700 42px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText('موبائل اینڈ ریپئرنگ سینٹر', w / 2, 234);

      // Vibrant red/green/blue bottom product showcase boxes
      const cols = ['#16A34A', '#DC2626', '#2563EB', '#D97706'];
      const labels = ['چارجرز', 'ہینڈز فری', 'ڈیٹا کیبل', 'ایئر بڈز'];
      cols.forEach((col, i) => {
        const bx = 26 + i * 118;
        ctx.fillStyle = col;
        ctx.fillRect(bx, 286, 106, 186);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(bx + 14, 304, 78, 96);
        ctx.fillStyle = '#FEF08A';
        ctx.font = '700 24px "IBM Plex Sans Arabic", system-ui, sans-serif';
        ctx.fillText(labels[i], bx + 53, 444);
      });
    },
    maxAnisotropy,
  );
}

export function createRateListCounterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    384,
    (ctx, w, h) => {
      // Dark brown wood counter front with pasted mobile package rate-list posters (matching bf16940b.jpeg)
      ctx.fillStyle = '#533A2E';
      ctx.fillRect(0, 0, w, h);

      // Wood grain vertical bands
      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      for (let x = 0; x < w; x += 42) {
        ctx.fillRect(x, 0, 3, h);
      }

      // Two pink/white telecom rate-list tariff sheets on left
      [28, 152].forEach((px) => {
        ctx.fillStyle = '#FFF7FA';
        ctx.fillRect(px, 24, 112, 168);
        ctx.fillStyle = '#EC4899';
        ctx.fillRect(px, 24, 112, 26);
        ctx.fillStyle = '#CBD5E1';
        for (let ry = 62; ry < 180; ry += 16) {
          ctx.fillRect(px + 10, ry, 92, 6);
        }
      });

      // Right telecom data offer poster ("35 GB" pink/green offer)
      ctx.fillStyle = '#FFFDF7';
      ctx.fillRect(356, 78, 140, 174);
      ctx.fillStyle = '#84CC16';
      ctx.fillRect(356, 78, 140, 42);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#DB2777';
      ctx.font = '800 50px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('35GB', 426, 178);
      ctx.fillStyle = '#1E293B';
      ctx.font = '700 20px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('WEEKLY OFFER', 426, 224);
    },
    maxAnisotropy,
  );
}

export function createSimHangCardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    160,
    240,
    (ctx, w, h) => {
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1D4ED8';
      ctx.fillRect(0, 0, w, 64);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 32px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('600GB', w / 2, 46);
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(18, 86, w - 36, 72);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 20px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('4G SIM', w / 2, 130);
      ctx.fillStyle = '#0F172A';
      ctx.font = '700 18px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('AVAILABLE', w / 2, 202);
    },
    maxAnisotropy,
  );
}

export function createQrStandeeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    192,
    288,
    (ctx, w, h) => {
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(22, 68, w - 44, w - 44);
      // Stylized QR code grid
      ctx.fillStyle = '#0F172A';
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if ((r + c * 3) % 2 === 0 || (r < 3 && c < 3) || (r < 3 && c > 5)) {
            ctx.fillRect(32 + c * 14, 78 + r * 14, 10, 10);
          }
        }
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('SCAN TO PAY', w / 2, 44);
      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 18px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('EASYPAISA • RAAST', w / 2, 258);
    },
    maxAnisotropy,
  );
}

export function createGreenClothTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#0B6B40';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 2;
      for (let i = 0; i < w; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }
    },
    maxAnisotropy,
  );
}

// ============================================================================
// REALISTIC RETAIL PRODUCT PACKAGING & INTERIOR SHOWROOM TEXTURES
// ============================================================================

export type RetailIconType =
  | 'handsfree'
  | 'cable'
  | 'charger'
  | 'keypad'
  | 'smartphone'
  | 'airpods'
  | 'speaker'
  | 'powerbank'
  | 'watch'
  | 'battery'
  | 'lcd'
  | 'cover'
  | 'glass';

function drawRetailProductArt(
  ctx: CanvasRenderingContext2D,
  iconType: RetailIconType,
  cx: number,
  cy: number,
  accent: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (iconType === 'handsfree') {
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(-26, -24, 14, 0, Math.PI * 2);
    ctx.arc(26, -24, 14, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-26, -10);
    ctx.quadraticCurveTo(-24, 24, 0, 24);
    ctx.quadraticCurveTo(24, 24, 26, -10);
    ctx.moveTo(0, 24);
    ctx.lineTo(0, 52);
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-6, 36, 12, 18);
  } else if (iconType === 'cable') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(0, 6, 34, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 6, 26, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-12, -50, 24, 20);
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(-8, -62, 16, 12);
  } else if (iconType === 'charger') {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 5;
    ctx.fillRect(-32, -20, 64, 62);
    ctx.strokeRect(-32, -20, 64, 62);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-18, -46, 10, 26);
    ctx.fillRect(8, -46, 10, 26);
    ctx.fillStyle = accent;
    ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', 0, 20);
  } else if (iconType === 'keypad') {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-28, -56, 56, 112);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(-22, -48, 44, 42);
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(-18, -2, 14, 8);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(4, -2, 14, 8);
    ctx.fillStyle = '#E2E8F0';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillRect(-20 + c * 15, 12 + r * 10, 10, 6);
      }
    }
  } else if (iconType === 'smartphone' || iconType === 'lcd') {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-32, -56, 64, 112);
    const scr = ctx.createLinearGradient(-28, -50, 28, 50);
    scr.addColorStop(0, accent);
    scr.addColorStop(1, '#1E3A8A');
    ctx.fillStyle = scr;
    ctx.fillRect(-27, -50, 54, 100);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -42, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (iconType === 'airpods') {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-36, -24, 72, 64, 16);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-36, -2);
    ctx.lineTo(36, -2);
    ctx.stroke();
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(0, 14, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (iconType === 'speaker') {
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(-42, -32, 84, 68, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(-18, 2, 18, 0, Math.PI * 2);
    ctx.arc(18, 2, 18, 0, Math.PI * 2);
    ctx.stroke();
  } else if (iconType === 'powerbank') {
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(-30, -52, 60, 104, 10);
    ctx.fill();
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(-20, -38, 40, 26);
    ctx.fillStyle = '#34D399';
    ctx.textAlign = 'center';
    ctx.font = '800 18px monospace';
    ctx.fillText('100%', 0, -20);
    ctx.fillStyle = accent;
    ctx.fillRect(-16, 10, 32, 8);
  } else if (iconType === 'watch') {
    ctx.fillStyle = accent;
    ctx.fillRect(-14, -56, 28, 112);
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(-28, -32, 56, 64, 12);
    ctx.fill();
    ctx.fillStyle = '#38BDF8';
    ctx.textAlign = 'center';
    ctx.font = '800 20px monospace';
    ctx.fillText('10:09', 0, 7);
  } else if (iconType === 'battery') {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-30, -44, 60, 92);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-12, -54, 24, 10);
    ctx.fillStyle = accent;
    ctx.fillRect(-22, -32, 44, 68);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = '800 18px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('5000', 0, 8);
  } else {
    // cover or glass
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(-30, -54, 60, 108, 12);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(-22, -44, 22, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(-11, -36, 4.5, 0, Math.PI * 2);
    ctx.arc(-11, -24, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function createRetailBoxTexture(
  brand: string,
  title: string,
  specs: string,
  bgHex: string,
  accentHex: string,
  iconType: RetailIconType,
  maxAnisotropy: number,
  darkText = true,
): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    320,
    (ctx, w, h) => {
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, w, h);

      // Top branded header bar
      ctx.fillStyle = accentHex;
      ctx.fillRect(0, 0, w, 64);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(brand, w / 2, 30);
      ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(title, w / 2, 52);

      // Center product artwork
      drawRetailProductArt(ctx, iconType, w / 2, 166, accentHex);

      // Bottom spec footer & barcode strip
      ctx.fillStyle = darkText ? '#0F172A' : '#F8FAFC';
      ctx.font = '800 16px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(specs, w / 2, 266);

      // Crisp barcode detail
      ctx.fillStyle = darkText ? '#1E293B' : '#CBD5E1';
      for (let bx = 46; bx < w - 46; bx += 7) {
        const bw = (bx * 3) % 5 === 0 ? 4 : 2;
        ctx.fillRect(bx, 282, bw, 22);
      }

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    },
    maxAnisotropy,
  );
}

export function createBlisterPackTexture(
  title: string,
  sub: string,
  cardBg: string,
  accentHex: string,
  iconType: RetailIconType,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return makeCanvasTexture(
    192,
    288,
    (ctx, w, h) => {
      ctx.fillStyle = cardBg;
      ctx.fillRect(0, 0, w, h);

      // Colored top header + Euro peg slot
      ctx.fillStyle = accentHex;
      ctx.fillRect(0, 0, w, 78);
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(w / 2 - 26, 10, 52, 12, 6);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 20px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(title, w / 2, 50);
      ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(sub, w / 2, 69);

      // Glossy clear blister window
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.beginPath();
      ctx.roundRect(16, 90, w - 32, 146, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.lineWidth = 2;
      ctx.stroke();

      drawRetailProductArt(ctx, iconType, w / 2, 162, accentHex);

      // Bottom quality badge bar
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(14, 248, w - 28, 28);
      ctx.fillStyle = '#FACC15';
      ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('ORIGINAL • IN STOCK', w / 2, 267);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
    },
    maxAnisotropy,
  );
}

export function createRoundTinTexture(
  title: string,
  sub: string,
  bgHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return makeCanvasTexture(
    192,
    192,
    (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, 78, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, 62, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(title, cx, cy - 4);
      ctx.fillStyle = '#FEF08A';
      ctx.font = '700 15px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(sub, cx, cy + 22);
    },
    maxAnisotropy,
  );
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface MonitorPreviewOptions {
  heroImageUrl?: string;
  fallbackHeroUrl?: string;
  monitorScreenImg?: string;
  logoUrl?: string;
  reviewsVisible?: boolean;
  reviewCount?: number;
  reviewAvg?: string;
  reviewInitials?: string[];
  onUpdated?: () => void;
}

export function createPosMonitorTexture(
  maxAnisotropy: number,
  options?: MonitorPreviewOptions,
): THREE.CanvasTexture & { updatePreview?: (next: MonitorPreviewOptions) => void } {
  const w = 3840;
  const h = 2400;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  const tex = new THREE.CanvasTexture(canvas) as THREE.CanvasTexture & {
    updatePreview?: (next: MonitorPreviewOptions) => void;
  };
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  let currentOpts: MonitorPreviewOptions = { reviewsVisible: true, ...(options || {}) };
  let heroImg: HTMLImageElement | null = null;
  let logoImg: HTMLImageElement | null = null;
  let monitorScreenImgObj: HTMLImageElement | null = null;
  let loadedHeroSrc = '';
  let loadedLogoSrc = '';
  let loadedMonitorScreenSrc = '';

  const redraw = () => {
    if (!ctx) return;

    if (monitorScreenImgObj && monitorScreenImgObj.complete && monitorScreenImgObj.naturalWidth > 0) {
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(monitorScreenImgObj, 0, 0, w, h);
      tex.needsUpdate = true;
      currentOpts.onUpdated?.();
      return;
    }

    // 1. Warm Sand Canvas Background (#F3ECE6)
    ctx.fillStyle = '#F3ECE6';
    ctx.fillRect(0, 0, w, h);

    // 2. Sticky Header Bar
    ctx.fillStyle = '#F3ECE6';
    ctx.fillRect(0, 0, w, 78);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.06)';
    ctx.fillRect(0, 77, w, 1.5);

    // Brand Logo Image or UM Badge
    const logoX = 56;
    const logoY = 17;
    const logoSize = 44;
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.save();
      fillRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 12);
      ctx.clip();
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      ctx.restore();
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.1)';
      ctx.lineWidth = 1.5;
      fillRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 12);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#EA4E1B';
      fillRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 12);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 18px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('UM', logoX + 7, logoY + 29);
    }

    // Brand Wordmark
    ctx.fillStyle = '#141414';
    ctx.font = '800 19px "Plus Jakarta Sans", system-ui, sans-serif';
    const brandLeft = 'Usman Mobile';
    ctx.fillText(brandLeft, 112, 37);
    const brandLeftW = ctx.measureText(brandLeft).width;
    ctx.fillStyle = '#EA4E1B';
    ctx.fillText(' Repairing Centre', 112 + brandLeftW, 37);

    ctx.fillStyle = '#525252';
    ctx.font = '600 12px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Expert Phone Repairs · Original Accessories', 112, 56);

    // Center Nav Links
    const navItems = ['Home', 'Products', 'Repairs', '3D Shop', 'Contact Us'];
    let navX = 505;
    navItems.forEach((lbl, idx) => {
      ctx.fillStyle = idx === 0 ? '#141414' : '#525252';
      ctx.font =
        idx === 0
          ? '700 15px "Plus Jakarta Sans", system-ui, sans-serif'
          : '500 15px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(lbl, navX, 45);
      const lw = ctx.measureText(lbl).width;
      if (idx === 0) {
        ctx.fillStyle = '#EA4E1B';
        ctx.fillRect(navX, 52, lw, 2.5);
      }
      navX += lw + 32;
    });

    // Right Header Pills: [اردو] and [Cart]
    ctx.fillStyle = '#FFFFFF';
    fillRoundedRect(ctx, 1006, 20, 84, 38, 19);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#141414';
    ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('اردو', 1048, 44);

    ctx.fillStyle = '#EA4E1B';
    fillRoundedRect(ctx, 1104, 18, 118, 42, 21);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 15px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Cart', 1163, 44);
    ctx.textAlign = 'left';

    // 3. Global Search Bar + Popular Chips Row
    ctx.fillStyle = '#FAF5F0';
    ctx.fillRect(0, 78, w, 126);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.05)';
    ctx.fillRect(0, 203, w, 1.5);

    ctx.fillStyle = '#FFFFFF';
    fillRoundedRect(ctx, 168, 96, 944, 52, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.11)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '500 15px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Search covers, 65W charger, AirPods, LCD, or phone model...', 204, 127);

    ctx.fillStyle = '#EA4E1B';
    fillRoundedRect(ctx, 998, 102, 106, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Search', 1051, 127);
    ctx.textAlign = 'left';

    // Popular chips
    ctx.fillStyle = '#525252';
    ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Popular:', 326, 179);
    const chips = ['Infinix Cover', '65W Charger', 'AirPods', '9D Glass', 'LCD Repair'];
    let chipX = 392;
    chips.forEach((chip) => {
      ctx.font = '600 12.5px "Plus Jakarta Sans", system-ui, sans-serif';
      const cw = ctx.measureText(chip).width + 26;
      ctx.fillStyle = '#FFFFFF';
      fillRoundedRect(ctx, chipX, 161, cw, 28, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#262626';
      ctx.fillText(chip, chipX + 13, 179);
      chipX += cw + 10;
    });

    // Bottom White Section Strip (matching HomePage transition into Trending section)
    const heroBottomY = 720;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, heroBottomY, w, h - heroBottomY);

    // 4. Hero Section (exact layout match to HomePage!)
    const heroTop = 248;
    const leftX = 56;

    ctx.fillStyle = '#525252';
    ctx.font = '600 14px Georgia, serif';
    ctx.fillText('Usman Mobile Repairing Centre · Hussain Khan Wala, Chak No. 8,', leftX, heroTop + 14);
    ctx.fillText('Pattoki', leftX, heroTop + 34);

    // Headline: Elevate Your / Mobile Experience
    ctx.fillStyle = '#141414';
    ctx.font = '800 58px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Elevate Your', leftX, heroTop + 102);

    ctx.fillStyle = '#EA4E1B';
    const mobileWord = 'Mobile';
    ctx.fillText(mobileWord, leftX, heroTop + 162);
    const mobileW = ctx.measureText(mobileWord).width;
    ctx.fillStyle = '#141414';
    ctx.fillText(' Experience', leftX + mobileW, heroTop + 162);

    // Urdu shop title
    ctx.fillStyle = '#404040';
    ctx.font = '700 22px "Noto Nastaliq Urdu", system-ui, sans-serif';
    ctx.fillText('عثمان موبائل اینڈ ریپئرنگ سینٹر', leftX, heroTop + 214);

    // Body copy
    ctx.fillStyle = '#525252';
    ctx.font = '400 17px "Times New Roman", Georgia, serif';
    ctx.fillText('Tested chargers, AirPods, covers, used phones & same-day phone', leftX, heroTop + 260);
    ctx.fillText('repair — plus Easypaisa, JazzCash & interactive 3D shop', leftX, heroTop + 286);
    ctx.fillText('walkthrough.', leftX, heroTop + 312);

    // Hero CTA Pills
    ctx.fillStyle = '#EA4E1B';
    fillRoundedRect(ctx, leftX, heroTop + 346, 176, 52, 26);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Shop Now', leftX + 28, heroTop + 378);
    ctx.beginPath();
    ctx.arc(leftX + 146, heroTop + 372, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EA4E1B';
    ctx.font = '800 15px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('→', leftX + 146, heroTop + 377);

    ctx.fillStyle = '#FFFFFF';
    fillRoundedRect(ctx, leftX + 190, heroTop + 346, 182, 52, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#141414';
    ctx.font = '700 16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Visit 3D Shop', leftX + 286, heroTop + 378);
    ctx.textAlign = 'left';

    // 5. Right Hero Photo Card (Actual Shop Photo flush with bottom strip, rounded-t-3xl)
    const photoX = 648;
    const photoY = 282;
    const photoW = 576;
    const photoH = heroBottomY - photoY;
    const topRadius = 28;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(photoX + topRadius, photoY);
    ctx.lineTo(photoX + photoW - topRadius, photoY);
    ctx.arcTo(photoX + photoW, photoY, photoX + photoW, photoY + topRadius, topRadius);
    ctx.lineTo(photoX + photoW, photoY + photoH);
    ctx.lineTo(photoX, photoY + photoH);
    ctx.lineTo(photoX, photoY + topRadius);
    ctx.arcTo(photoX, photoY, photoX + topRadius, photoY, topRadius);
    ctx.closePath();
    ctx.clip();

    if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
      const imgRatio = heroImg.naturalWidth / heroImg.naturalHeight;
      const boxRatio = photoW / photoH;
      let dw = photoW;
      let dh = photoH;
      let dx = photoX;
      let dy = photoY;
      if (imgRatio > boxRatio) {
        dh = photoH;
        dw = photoH * imgRatio;
        dx = photoX - (dw - photoW) * 0.5;
      } else {
        dw = photoW;
        dh = photoW / imgRatio;
        dy = photoY - (dh - photoH) * 0.35;
      }
      ctx.drawImage(heroImg, dx, dy, dw, dh);
    } else {
      const fallbackGrad = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
      fallbackGrad.addColorStop(0, '#ECD8BE');
      fallbackGrad.addColorStop(1, '#D8C3A5');
      ctx.fillStyle = fallbackGrad;
      ctx.fillRect(photoX, photoY, photoW, photoH);
    }

    // Soft left fade blending photo cleanly into #F3ECE6 just like HomePage.tsx
    const edgeGrad = ctx.createLinearGradient(photoX, 0, photoX + 68, 0);
    edgeGrad.addColorStop(0, '#F3ECE6');
    edgeGrad.addColorStop(0.55, 'rgba(243, 236, 230, 0.45)');
    edgeGrad.addColorStop(1, 'rgba(243, 236, 230, 0)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(photoX, photoY, 68, photoH);
    ctx.restore();

    // Compact Floating "Our Reviews" Card at bottom-left of hero photo
    if (currentOpts.reviewsVisible !== false) {
      const cardX = 678;
      const cardY = 594;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#FFFFFF';
      fillRoundedRect(ctx, cardX, cardY, 206, 98, 20);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#141414';
      ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('Our Reviews', cardX + 20, cardY + 32);

      const initials = currentOpts.reviewInitials?.length
        ? currentOpts.reviewInitials.slice(0, 3)
        : ['M', 'AA', 'HM'];
      const rCount = currentOpts.reviewCount ?? 0;
      const rAvg = currentOpts.reviewAvg || '5.0';

      if (rCount > 0) {
        initials.forEach((init, idx) => {
          const cx = cardX + 34 + idx * 22;
          const cy = cardY + 64;
          ctx.fillStyle = '#141414';
          ctx.beginPath();
          ctx.arc(cx, cy, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '800 10px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(init, cx, cy + 3.5);
        });
        ctx.textAlign = 'left';
        ctx.fillStyle = '#141414';
        ctx.font = '800 14px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(`${rAvg} ★ · ${rCount}`, cardX + 106, cardY + 69);
      } else {
        ctx.fillStyle = '#525252';
        ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('Write a review', cardX + 20, cardY + 66);
      }
    }

    tex.needsUpdate = true;
    currentOpts.onUpdated?.();
  };

  const loadHeroImage = (src: string, fallbackSrc?: string) => {
    const img = new Image();
    if (/^https?:\/\//i.test(src)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      heroImg = img;
      redraw();
    };
    img.onerror = () => {
      if (fallbackSrc && fallbackSrc !== src) {
        loadedHeroSrc = fallbackSrc;
        loadHeroImage(fallbackSrc);
      }
    };
    img.src = src;
  };

  const syncImages = () => {
    const nextScreen = currentOpts.monitorScreenImg?.trim() || '';
    if (nextScreen !== loadedMonitorScreenSrc) {
      loadedMonitorScreenSrc = nextScreen;
      if (!nextScreen) {
        monitorScreenImgObj = null;
        redraw();
      } else {
        const img = new Image();
        if (/^https?:\/\//i.test(nextScreen)) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          monitorScreenImgObj = img;
          redraw();
        };
        img.src = nextScreen;
      }
    }

    const nextHero = currentOpts.heroImageUrl?.trim() || currentOpts.fallbackHeroUrl?.trim() || '';
    const nextLogo = currentOpts.logoUrl?.trim() || '/pwa-192x192.png';

    if (nextHero && nextHero !== loadedHeroSrc) {
      loadedHeroSrc = nextHero;
      loadHeroImage(nextHero, currentOpts.fallbackHeroUrl?.trim());
    }

    if (nextLogo && nextLogo !== loadedLogoSrc) {
      loadedLogoSrc = nextLogo;
      const img = new Image();
      if (/^https?:\/\//i.test(nextLogo)) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        logoImg = img;
        redraw();
      };
      img.src = nextLogo;
    }
  };

  tex.updatePreview = (next: MonitorPreviewOptions) => {
    currentOpts = { ...currentOpts, ...next };
    redraw();
    syncImages();
  };

  redraw();
  syncImages();
  return tex;
}

export function createReworkStationTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    160,
    (ctx, w, h) => {
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      // Digital LED temperature display
      ctx.fillStyle = '#090D16';
      ctx.fillRect(18, 20, 124, 62);
      ctx.fillStyle = '#EF4444';
      ctx.font = '800 38px monospace';
      ctx.fillText('380°', 32, 64);

      // Brand header
      ctx.fillStyle = '#38BDF8';
      ctx.font = '800 14px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('SMD 858D LAB', 154, 38);

      // Air & Heat dials
      [174, 222].forEach((kx) => {
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(kx, 88, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      ctx.fillStyle = '#22C55E';
      ctx.fillRect(22, 108, 42, 24);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 12px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('ON', 34, 125);
    },
    maxAnisotropy,
  );
}

export function createInteriorMenuBoardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    384,
    (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0B1733');
      bg.addColorStop(1, '#10244D');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#FFC531';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      ctx.fillStyle = '#FFC531';
      ctx.fillRect(16, 16, w - 32, 72);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0A1328';
      ctx.font = '800 28px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('USMAN MOBILE REPAIR LAB', w / 2, 50);
      ctx.font = '700 16px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('ALL ORIGINAL ACCESSORIES & EXPERT SERVICE', w / 2, 76);

      const services = [
        ['LCD & TOUCH REPLACEMENT', 'SAME DAY'],
        ['CHARGING PORT & IC WORK', 'GUARANTEED'],
        ['SOFTWARE FLASH & UNLOCK', 'ALL MODELS'],
        ['EASYPAISA • JAZZCASH • BILLS', 'INSTANT'],
        ['ORIGINAL CHARGERS & BUDS', 'WARRANTY'],
      ];
      services.forEach(([left, right], i) => {
        const y = 132 + i * 44;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#F8FAFC';
        ctx.font = '700 18px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(`•  ${left}`, 30, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#4ADE80';
        ctx.font = '800 16px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(right, w - 30, y);

        if (i < services.length - 1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(30, y + 14);
          ctx.lineTo(w - 30, y + 14);
          ctx.stroke();
        }
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFC531';
      ctx.font = '800 18px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('CLICK ANY PRODUCT FOR PRICE & WHATSAPP', w / 2, h - 22);
    },
    maxAnisotropy,
  );
}
