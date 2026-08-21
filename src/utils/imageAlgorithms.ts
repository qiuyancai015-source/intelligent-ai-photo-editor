import { ImageAdjustments, BgConfig, TextElement, StickerElement, AddWatermarkConfig } from "../types";

/**
 * Filter presets with color matrix / adjustment profiles
 */
export const FILTER_PRESETS = [
  { id: "none", name: "原图", desc: "原始色彩", icon: "✨" },
  { id: "natural", name: "自然质感", desc: "柔和明亮", icon: "🍃", brightness: 5, contrast: 8, saturation: 10, temperature: 2 },
  { id: "film", name: "胶片复古", desc: "经典电影色调", icon: "🎞️", brightness: -5, contrast: 20, saturation: -15, temperature: 15, sepia: 15 },
  { id: "morandi", name: "莫兰迪", desc: "高级灰低饱和", icon: "🎨", brightness: 8, contrast: -10, saturation: -25, temperature: -5 },
  { id: "fresh", name: "日系清透", desc: "高光通透淡雅", icon: "🌸", brightness: 12, contrast: -5, saturation: 5, temperature: -8 },
  { id: "cyberpunk", name: "赛博朋克", desc: "霓虹冷艳高对比", icon: "🌆", brightness: -10, contrast: 35, saturation: 40, temperature: -30 },
  { id: "bw", name: "黑白大师", desc: "经典高反差黑白", icon: "🏁", brightness: 5, contrast: 28, saturation: -100, sharpness: 20 },
  { id: "warm_glow", name: "落日暖阳", desc: "温暖金黄治愈", icon: "🌅", brightness: 8, contrast: 12, saturation: 20, temperature: 35 },
  { id: "food_crisp", name: "美食明亮", desc: "鲜亮诱人高饱和", icon: "🍰", brightness: 10, contrast: 15, saturation: 30, temperature: 10, sharpness: 15 },
  { id: "product_clean", name: "商业白底", desc: "清爽干净白平衡", icon: "💼", brightness: 15, contrast: 10, saturation: 0, temperature: -5, sharpness: 25 },
  { id: "vintage_gold", name: "复古金棕", desc: "轻奢复古暖调", icon: "🪙", brightness: -2, contrast: 18, saturation: -5, temperature: 25, sepia: 25 },
  { id: "cool_metal", name: "冷冽金属", desc: "工业质感冷灰", icon: "❄️", brightness: 0, contrast: 22, saturation: -20, temperature: -35, sharpness: 15 },
];

// Processing invariants: cutout changes alpha only; inpainting changes only
// the painted mask and continues real neighbouring texture instead of using
// a flat colour.
export const CUTOUT_RULES = "Separate foreground from background and modify alpha only. Preserve every foreground RGB pixel plus all detached splash droplets, liquid spray, mist, sparks, glitter, particles, crumbs and drifting debris as intentional foreground effects. Never denoise or discard small effect elements. Preserve hard edges precisely and soft/translucent effects with natural partial alpha.";
export const CUTOUT_DEFRINGE_RULES = "Remove only outer matte halos, pink/white/black fringes and background colour spill; do not add an outline or alter interior subject pixels.";
export const INPAINT_RULES = "Change only the painted mask; sample the full surrounding ring for colour, lighting, gradients and material; continue real texture through the removed area, never use a solid fill or blur away detail.";
export const WATERMARK_REMOVAL_RULES = "移除 mask 标记的 logo 或水印；仅修改涂抹区域，其余 RGBA 像素完全不动；参考周边原有材质纹理、颗粒细节、色彩和光影填充，优先复用图片已有纹理；禁止平滑纯色补丁、模糊残影，不改动其他物体。";

/**
 * Perform Smart Background Removal (Cutout)
 * Dual-Engine: First tries AI Matting service, seamlessly falls back to 
 * high-precision BFS Gradient-Barrier local Chroma Matting with Defringing & Feathering.
 */
export async function removeBackgroundSmart(
  imageSource: HTMLImageElement | string,
  options: {
    sensitivity?: number;
    featherRadius?: number;
    edgeSmooth?: number;
    edgeExpansion?: number;
    useAiServer?: boolean;
    onProgress?: (message: string) => void;
  } = {}
): Promise<{ cutoutDataUrl: string; maskDataUrl: string }> {
  const { sensitivity = 35, featherRadius = 0, edgeExpansion = 0, useAiServer = true, onProgress } = options;

  const img = await resolveImage(imageSource);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  // Primary engine: an actual foreground segmentation network. Colour flood
  // fill cannot distinguish a red shoe from a connected red floor/shadow.
  // IS-Net identifies the complete product semantically and emits an alpha
  // mask while leaving the original RGB pixels untouched.
  if (useAiServer) {
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const source = typeof imageSource === "string" ? imageSource : await imageElementToBlob(img);
      // Version the directory so browsers that previously cached the compact
      // model can never reuse it for this high-quality pipeline.
      const localModelPath = new URL("./imgly-fp16-v2/", window.location.href).toString();
      const aiCutout = removeBackground(source, {
        // Host the model with the app instead of an unreachable third-party CDN.
        publicPath: localModelPath,
        // FP16 preserves fine knit fibres and dark/red shoe edges much better
        // than the compact quantized model, while still being self-hosted.
        model: "isnet_fp16",
        device: "cpu",
        progress: (key: string, current: number, total: number) => {
          if (key.startsWith("fetch:") && total > 0) {
            onProgress?.(`首次加载抠图模型 ${Math.min(100, Math.round((current / total) * 100))}%（之后会自动缓存）`);
          } else if (key === "compute:inference") {
            onProgress?.("模型加载完成，正在识别主体边缘...");
          }
        },
        output: { format: "image/png", quality: 1 },
      });
      const timeout = new Promise<never>((_, reject) => {
        // Slow connections may need several minutes for the first 84 MB load.
        window.setTimeout(() => reject(new Error("高质量抠图模型加载超时")), 600_000);
      });
      const resultBlob = await Promise.race([aiCutout, timeout]);
      const semanticUrl = await blobToDataUrl(resultBlob);
      const semanticImg = await resolveImage(semanticUrl);
      const semanticCanvas = document.createElement("canvas");
      semanticCanvas.width = width;
      semanticCanvas.height = height;
      const semanticCtx = semanticCanvas.getContext("2d", { willReadFrequently: true })!;
      semanticCtx.drawImage(semanticImg, 0, 0, width, height);
      const semanticPixels = semanticCtx.getImageData(0, 0, width, height);

      // Recompose with the original source RGB: segmentation is allowed to
      // determine alpha only and must never retouch the shoe itself.
      const originalCanvas = document.createElement("canvas");
      originalCanvas.width = width;
      originalCanvas.height = height;
      const originalCtx = originalCanvas.getContext("2d", { willReadFrequently: true })!;
      originalCtx.drawImage(img, 0, 0, width, height);
      const originalPixels = originalCtx.getImageData(0, 0, width, height);
      const semanticMask = document.createElement("canvas");
      semanticMask.width = width;
      semanticMask.height = height;
      const semanticMaskCtx = semanticMask.getContext("2d")!;
      const semanticMaskPixels = semanticMaskCtx.createImageData(width, height);
      for (let i = 0; i < width * height; i++) {
        const p = i * 4;
        const alpha = semanticPixels.data[p + 3];
        originalPixels.data[p + 3] = alpha;
        semanticMaskPixels.data[p] = alpha;
        semanticMaskPixels.data[p + 1] = alpha;
        semanticMaskPixels.data[p + 2] = alpha;
        semanticMaskPixels.data[p + 3] = 255;
      }
      originalCtx.putImageData(originalPixels, 0, 0);
      semanticMaskCtx.putImageData(semanticMaskPixels, 0, 0);
      return {
        cutoutDataUrl: originalCanvas.toDataURL("image/png"),
        maskDataUrl: semanticMask.toDataURL("image/png"),
      };
    } catch (error) {
      // Do not silently return the low-precision colour flood-fill result. It
      // can remove red/dark product pixels and look like a successful cutout.
      console.error("High-quality semantic cutout failed:", error);
      throw new Error("高质量抠图模型未能完整加载，请刷新页面后重试，并保持网络连接稳定。", { cause: error });
    }
  }

  // 1. Optional AI Server Cutout Attempt
  if (useAiServer && typeof imageSource === "string" && imageSource.startsWith("data:")) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch("/api/ai/cutout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageSource }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.imageUrl) {
        // Load AI cutout image and generate corresponding mask
        const aiImg = await resolveImage(data.imageUrl);
        const aiCanvas = document.createElement("canvas");
        aiCanvas.width = width;
        aiCanvas.height = height;
        const aiCtx = aiCanvas.getContext("2d")!;
        aiCtx.drawImage(aiImg, 0, 0, width, height);

        const aiData = aiCtx.getImageData(0, 0, width, height);
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext("2d")!;
        const maskImgData = maskCtx.createImageData(width, height);

        for (let i = 0; i < width * height; i++) {
          const a = aiData.data[i * 4 + 3];
          maskImgData.data[i * 4] = a;
          maskImgData.data[i * 4 + 1] = a;
          maskImgData.data[i * 4 + 2] = a;
          maskImgData.data[i * 4 + 3] = 255;
        }
        maskCtx.putImageData(maskImgData, 0, 0);

        return {
          cutoutDataUrl: aiCanvas.toDataURL("image/png"),
          maskDataUrl: maskCanvas.toDataURL("image/png"),
        };
      }
    } catch (e) {
      console.warn("AI Server cutout skipped, proceeding with high-speed local matting engine:", e);
    }
  }

  // 2. High-Precision Local Gradient-Barrier BFS Matting Engine
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context failed");

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Mask canvas
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!maskCtx) throw new Error("Mask canvas failed");
  const maskImgData = maskCtx.createImageData(width, height);
  const maskData = maskImgData.data;

  const totalPixels = width * height;
  const isBg = new Uint8Array(totalPixels); // 0 = Unknown/FG, 1 = Confirmed BG

  // Step 1: Collect multiple border color seed samples
  const rawBorderSeeds: [number, number, number][] = [];
  const stepX = Math.max(1, Math.floor(width / 40));
  const stepY = Math.max(1, Math.floor(height / 40));

  for (let x = 0; x < width; x += stepX) {
    rawBorderSeeds.push(getPixelRGB(data, width, x, 0));
    rawBorderSeeds.push(getPixelRGB(data, width, x, height - 1));
  }
  for (let y = 0; y < height; y += stepY) {
    rawBorderSeeds.push(getPixelRGB(data, width, 0, y));
    rawBorderSeeds.push(getPixelRGB(data, width, width - 1, y));
  }

  // A portrait/product may touch an image edge (typically the lower edge).
  // Treating every border pixel as background made dark clothes become a
  // background seed and the flood fill subsequently erased the whole person.
  // Find the dominant border-colour family (medoid) and reject outlier seeds.
  let medoid = rawBorderSeeds[0];
  let bestScore = Infinity;
  for (const candidate of rawBorderSeeds) {
    const distances = rawBorderSeeds
      .map((sample) => colorDistance(candidate[0], candidate[1], candidate[2], sample[0], sample[1], sample[2]))
      .sort((a, b) => a - b);
    // Score against the closest majority, so a subject occupying one edge
    // cannot pull the representative colour away from the real background.
    const majority = Math.max(1, Math.floor(distances.length * 0.62));
    const score = distances.slice(0, majority).reduce((sum, value) => sum + value, 0);
    if (score < bestScore) { bestScore = score; medoid = candidate; }
  }
  const seedFamilyTolerance = Math.max(28, Math.min(68, 24 + sensitivity * 0.42));
  const borderSeeds = rawBorderSeeds.filter(([r, g, b]) =>
    colorDistance(r, g, b, medoid[0], medoid[1], medoid[2]) < seedFamilyTolerance
  );
  if (!borderSeeds.length) borderSeeds.push(medoid);

  // Calculate base threshold from user sensitivity
  // Keep the threshold conservative. The previous 18..103 range could treat
  // white clothes, skin highlights and light product details as background.
  const baseTolerance = (sensitivity / 100) * 60 + 12; // 12 ~ 72 distance threshold

  // Step 2: Compute Sobel Edge magnitude map
  const edgeMap = new Float32Array(totalPixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const pC = idx * 4;
      const lumC = 0.299 * data[pC] + 0.587 * data[pC + 1] + 0.114 * data[pC + 2];
      
      const pL = (idx - 1) * 4;
      const pR = (idx + 1) * 4;
      const pT = (idx - width) * 4;
      const pB = (idx + width) * 4;

      const lumL = 0.299 * data[pL] + 0.587 * data[pL + 1] + 0.114 * data[pL + 2];
      const lumR = 0.299 * data[pR] + 0.587 * data[pR + 1] + 0.114 * data[pR + 2];
      const lumT = 0.299 * data[pT] + 0.587 * data[pT + 1] + 0.114 * data[pT + 2];
      const lumB = 0.299 * data[pB] + 0.587 * data[pB + 1] + 0.114 * data[pB + 2];

      const gx = lumR - lumL;
      const gy = lumB - lumT;
      edgeMap[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // Step 3: BFS Flood Fill from Outer Borders
  // Initialize queue with border coordinates
  const queue: number[] = [];

  const checkBorderMatch = (x: number, y: number): boolean => {
    const idx = (y * width + x) * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    for (const [br, bg, bb] of borderSeeds) {
      if (colorDistance(r, g, b, br, bg, bb) < baseTolerance * 1.35) {
        return true;
      }
    }
    return false;
  };

  for (let x = 0; x < width; x++) {
    if (checkBorderMatch(x, 0)) {
      isBg[x] = 1;
      queue.push(x);
    }
    if (checkBorderMatch(x, height - 1)) {
      isBg[(height - 1) * width + x] = 1;
      queue.push((height - 1) * width + x);
    }
  }
  for (let y = 0; y < height; y++) {
    if (checkBorderMatch(0, y)) {
      isBg[y * width] = 1;
      queue.push(y * width);
    }
    if (checkBorderMatch(width - 1, y)) {
      isBg[y * width + (width - 1)] = 1;
      queue.push(y * width + (width - 1));
    }
  }

  // BFS Queue Processing
  let head = 0;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxR = Math.sqrt(centerX * centerX + centerY * centerY);

  while (head < queue.length) {
    const currIdx = queue[head++];
    const cx = currIdx % width;
    const cy = Math.floor(currIdx / width);
    const cDataIdx = currIdx * 4;
    const cr = data[cDataIdx], cg = data[cDataIdx + 1], cb = data[cDataIdx + 2];

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const nIdx = ny * width + nx;
      if (isBg[nIdx] === 1) continue;

      const nDataIdx = nIdx * 4;
      const nr = data[nDataIdx], ng = data[nDataIdx + 1], nb = data[nDataIdx + 2];

      // Saliency center weighting: center pixels have higher barrier
      const distFromCenter = Math.sqrt((nx - centerX) ** 2 + (ny - centerY) ** 2) / maxR;
      // Pixels near the visual center are much more likely to belong to the
      // subject. Require a substantially closer background match there.
      const localTolerance = baseTolerance * (0.48 + distFromCenter * 0.52);
      const edgeBarrier = edgeMap[nIdx];

      // A valid background pixel must remain close to the dominant border
      // family. Parent-only similarity allowed gradual colour drift to walk
      // across hair/clothing and eventually consume the face.
      const diffToParent = colorDistance(cr, cg, cb, nr, ng, nb);
      
      let minDiffToSeed = 999;
      for (let i = 0; i < borderSeeds.length; i += 2) {
        const [br, bg, bb] = borderSeeds[i];
        const d = colorDistance(nr, ng, nb, br, bg, bb);
        if (d < minDiffToSeed) minDiffToSeed = d;
      }

      const matchesBackgroundFamily = minDiffToSeed < localTolerance * 0.92;
      const locallyContinuous = diffToParent < localTolerance * 0.78;

      // Product photos often contain a soft contact shadow. Its gradient has
      // enough Sobel energy to stop an ordinary flood fill, leaving a solid
      // background-coloured island under the product. Permit crossing that
      // gradient only when the pixel is an exceptionally strong match for the
      // sampled background and the surrounding patch is visually smooth.
      // Textured material (knit shoes, hair, fur, printed fabric) produces a
      // much larger local colour spread and therefore remains protected even
      // when its hue resembles the backdrop.
      let localSpread = 0;
      let localSamples = 0;
      for (let oy = -2; oy <= 2; oy += 2) {
        for (let ox = -2; ox <= 2; ox += 2) {
          const sx = nx + ox, sy = ny + oy;
          if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
          const sp = (sy * width + sx) * 4;
          localSpread += colorDistance(nr, ng, nb, data[sp], data[sp + 1], data[sp + 2]);
          localSamples++;
        }
      }
      const meanLocalSpread = localSamples ? localSpread / localSamples : 999;
      const isSmoothBackdrop = meanLocalSpread < 20;
      const isVeryStrongBgMatch = minDiffToSeed < localTolerance * 0.56;
      const crossesSoftShadow = isVeryStrongBgMatch && isSmoothBackdrop &&
        diffToParent < localTolerance * 1.08 && edgeBarrier < 82;

      // When a product touches the lower image edge, a coloured contact
      // shadow can be connected to the border and therefore cannot match the
      // dark/neutral border samples. Remove only the clearly flat, outer
      // shadow pixels; woven uppers, laces and soles have much higher local
      // texture and stay intact.
      const outerFlatShadow = distFromCenter > 0.62 &&
        isSmoothBackdrop && meanLocalSpread < 12 && edgeBarrier < 24 &&
        diffToParent < localTolerance * 1.35;

      if ((matchesBackgroundFamily && locallyContinuous && edgeBarrier < 34) || crossesSoftShadow || outerFlatShadow) {
        isBg[nIdx] = 1;
        queue.push(nIdx);
      }
    }
  }

  // Recover enclosed background pockets (for example the gaps between flower
  // petals, arms or product handles). Only very flat regions that strongly
  // match the sampled outer background and exceed a safe area threshold are
  // removed. Small highlights, water drops and printed subject details stay.
  // Disabled by default: colour-only enclosed-pocket detection cannot safely
  // distinguish a background hole from similarly coloured facial lighting,
  // skin, clothes or reflective product details. Preserving the subject is
  // more important than automatically opening every enclosed background gap.
  const detectEnclosedBackgroundPockets = false;
  const enclosedCandidate = new Uint8Array(totalPixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (isBg[idx]) continue;
      const p = idx * 4;
      let minDiff = Infinity;
      for (const [br, bg, bb] of borderSeeds) {
        minDiff = Math.min(minDiff, colorDistance(data[p], data[p + 1], data[p + 2], br, bg, bb));
      }
      // Strong match + low local texture. This is intentionally stricter than
      // the outer flood fill so pale foreground material is not punched out.
      if (detectEnclosedBackgroundPockets && minDiff < baseTolerance * 0.52 && edgeMap[idx] < 16) enclosedCandidate[idx] = 1;
    }
  }

  const visitedPocket = new Uint8Array(totalPixels);
  const minPocketArea = Math.max(36, Math.round(totalPixels * 0.00008));
  const maxPocketArea = Math.max(minPocketArea, Math.round(totalPixels * 0.018));
  for (let seed = 0; seed < totalPixels; seed++) {
    if (!enclosedCandidate[seed] || visitedPocket[seed]) continue;
    const pocket: number[] = [];
    const pocketQueue = [seed];
    visitedPocket[seed] = 1;
    let pocketHead = 0;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    while (pocketHead < pocketQueue.length) {
      const idx = pocketQueue[pocketHead++];
      pocket.push(idx);
      const x = idx % width, y = Math.floor(idx / width);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      const neighbors = [idx - 1, idx + 1, idx - width, idx + width];
      for (const nIdx of neighbors) {
        const nx = nIdx % width, ny = Math.floor(nIdx / width);
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        // Prevent row wrapping for left/right neighbors.
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        if (enclosedCandidate[nIdx] && !visitedPocket[nIdx]) {
          visitedPocket[nIdx] = 1;
          pocketQueue.push(nIdx);
        }
      }
    }
    const pocketW = maxX - minX + 1;
    const pocketH = maxY - minY + 1;
    // A background gap is normally a limited pocket. Large or subject-scale
    // white regions (faces, clothes, gloves, product panels) must be retained.
    const isSubjectScale = pocket.length > maxPocketArea || pocketW > width * 0.24 || pocketH > height * 0.24;

    // Detect enclosed facial/illustration detail inside the region's bounds.
    // Eyes, mouth and contour strokes produce a meaningful amount of strong
    // edge energy; a true flat background pocket generally does not.
    let strongDetail = 0, sampled = 0;
    const sampleStep = Math.max(1, Math.floor(Math.max(pocketW, pocketH) / 90));
    for (let y = minY; y <= maxY; y += sampleStep) {
      for (let x = minX; x <= maxX; x += sampleStep) {
        sampled++;
        if (edgeMap[y * width + x] > 46) strongDetail++;
      }
    }
    const containsSubjectDetail = sampled > 0 && strongDetail / sampled > 0.018;

    if (pocket.length >= minPocketArea && !isSubjectScale && !containsSubjectDetail) {
      for (const idx of pocket) isBg[idx] = 1;
    }
  }

  // Step 5: Generate Alpha Buffer with Feathering
  const rawAlpha = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    rawAlpha[i] = isBg[i] === 1 ? 0 : 255;
  }

  const expandedAlpha = applyEdgeExpansion(rawAlpha, width, height, edgeExpansion);
  const finalAlpha = applySoftFeather(expandedAlpha, width, height, featherRadius);

  // Step 6: Apply to Image and Mask with De-fringing
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const alpha = finalAlpha[idx];
      const pIdx = idx * 4;

      data[pIdx + 3] = alpha;

      // Mask visualization
      maskData[pIdx] = alpha;
      maskData[pIdx + 1] = alpha;
      maskData[pIdx + 2] = alpha;
      maskData[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  maskCtx.putImageData(maskImgData, 0, 0);

  return {
    cutoutDataUrl: canvas.toDataURL("image/png"),
    maskDataUrl: maskCanvas.toDataURL("image/png"),
  };
}

export async function updateCutoutEdges(cutoutDataUrl: string, maskDataUrl: string, featherRadius = 1, edgeExpansion = 0): Promise<string> {
  const img = await resolveImage(cutoutDataUrl), mask = await resolveImage(maskDataUrl);
  const width = img.naturalWidth || img.width, height = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!; ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, width, height);
  const mc = document.createElement("canvas"); mc.width = width; mc.height = height;
  const mctx = mc.getContext("2d", { willReadFrequently: true })!; mctx.drawImage(mask, 0, 0, width, height);
  const md = mctx.getImageData(0, 0, width, height).data, alpha = new Uint8Array(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = md[i * 4];
  const adjusted = applySoftFeather(applyEdgeExpansion(alpha, width, height, edgeExpansion), width, height, featherRadius);
  for (let i = 0; i < adjusted.length; i++) pixels.data[i * 4 + 3] = adjusted[i];
  ctx.putImageData(pixels, 0, 0); return canvas.toDataURL("image/png");
}

/**
 * Intelligent Inpainting algorithm for Watermark & Object Erasure
 * High-performance patch synthesis and Telea gradient blend
 */
export async function inpaintArea(
  imageSource: HTMLImageElement | string,
  maskCanvasOrDataUrl: HTMLCanvasElement | string,
  options: { iterations?: number; patchRadius?: number } = {}
): Promise<string> {
  const { iterations = 3, patchRadius = 12 } = options;

  const img = await resolveImage(imageSource);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context failed");
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const originalData = data.slice();

  // Resolve mask
  let maskData: Uint8ClampedArray;
  if (typeof maskCanvasOrDataUrl === "string") {
    const maskImg = await resolveImage(maskCanvasOrDataUrl);
    const mCanvas = document.createElement("canvas");
    mCanvas.width = width;
    mCanvas.height = height;
    const mCtx = mCanvas.getContext("2d", { willReadFrequently: true })!;
    mCtx.drawImage(maskImg, 0, 0, width, height);
    maskData = mCtx.getImageData(0, 0, width, height).data;
  } else {
    const mCtx = maskCanvasOrDataUrl.getContext("2d", { willReadFrequently: true })!;
    maskData = mCtx.getImageData(0, 0, width, height).data;
  }

  // Mask flag buffer: 1 = to be inpainted, 0 = known good pixel
  const maskFlag = new Uint8Array(width * height);
  let totalMasked = 0;

  for (let i = 0; i < width * height; i++) {
    const r = maskData[i * 4];
    const g = maskData[i * 4 + 1];
    const b = maskData[i * 4 + 2];
    const a = maskData[i * 4 + 3];
    // Check if pixel is drawn on the mask (red hue or non-transparent overlay)
    const isMasked = a > 20 && (r > 60 || a > 80);
    if (isMasked) {
      maskFlag[i] = 1;
      totalMasked++;
    }
  }

  if (totalMasked === 0) {
    return canvas.toDataURL("image/png");
  }

  // Never expand the user's mask. Only explicitly painted pixels may change.

  // Front-propagating texture fill. Every completed boundary ring becomes a
  // valid source for the next ring, so a wide watermark is removed in one run.
  const pending = maskFlag.slice();
  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
  let remaining = pending.reduce((sum, value) => sum + value, 0);
  const maxLayers = Math.max(width, height);
  for (let layer = 0; remaining > 0 && layer < maxLayers; layer++) {
    const frontier: number[] = [];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!pending[idx]) continue;
      if (dirs.some(([dx,dy]) => {
        const nx=x+dx, ny=y+dy;
        return nx>=0 && nx<width && ny>=0 && ny<height && !pending[ny*width+nx];
      })) frontier.push(idx);
    }
    if (!frontier.length) break;
    const nextColors = new Uint8ClampedArray(frontier.length * 3);
    frontier.forEach((idx, fi) => {
      const x=idx%width, y=Math.floor(idx/width);
      let sr=0,sg=0,sb=0,sw=0, sr2=0,sg2=0,sb2=0;
      let nearestP = -1, nearestD = Infinity;
      const radius=Math.min(patchRadius, 18);
      for (let dy=-radius;dy<=radius;dy++) for(let dx=-radius;dx<=radius;dx++) {
        const nx=x+dx,ny=y+dy;
        // Sampling is restricted to original, unmasked pixels. Synthesized
        // pixels are never recycled as texture sources.
        if(nx<0||nx>=width||ny<0||ny>=height||maskFlag[ny*width+nx]) continue;
        const d2=dx*dx+dy*dy;
        if(!d2||d2>radius*radius) continue;
        const weight=1/(1+d2*.18), p=(ny*width+nx)*4;
        if (d2 < nearestD) { nearestD = d2; nearestP = p; }
        sr+=originalData[p]*weight;sg+=originalData[p+1]*weight;sb+=originalData[p+2]*weight;sw+=weight;
        sr2+=originalData[p]*originalData[p]*weight;sg2+=originalData[p+1]*originalData[p+1]*weight;sb2+=originalData[p+2]*originalData[p+2]*weight;
      }
      // For a thick painted region, locate the closest original pixels along
      // eight rays rather than using generated interior pixels.
      if (!sw) {
        for (let distance = radius + 1; distance <= Math.min(80, Math.max(width, height)); distance++) {
          for (const [ux, uy] of dirs) {
            const nx = x + ux * distance, ny = y + uy * distance;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height || maskFlag[ny * width + nx]) continue;
            const p = (ny * width + nx) * 4;
            nearestP = p; nearestD = distance * distance;
            sr = originalData[p]; sg = originalData[p + 1]; sb = originalData[p + 2]; sw = 1;
            sr2 = sr * sr; sg2 = sg * sg; sb2 = sb * sb;
            break;
          }
          if (sw) break;
        }
      }
      if(sw) {
        const r=sr/sw,g=sg/sw,b=sb/sw;
        const variance=Math.sqrt(Math.max(0,(sr2+sg2+sb2)/sw-(r*r+g*g+b*b))/3);
        const detailScale = Math.min(0.82, 0.42 + variance / 80);
        const nr = nearestP >= 0 ? originalData[nearestP] : r;
        const ng = nearestP >= 0 ? originalData[nearestP + 1] : g;
        const nb = nearestP >= 0 ? originalData[nearestP + 2] : b;
        nextColors[fi*3]=r+(nr-r)*detailScale;
        nextColors[fi*3+1]=g+(ng-g)*detailScale;
        nextColors[fi*3+2]=b+(nb-b)*detailScale;
      }
    });
    frontier.forEach((idx,fi)=>{const p=idx*4;data[p]=nextColors[fi*3];data[p+1]=nextColors[fi*3+1];data[p+2]=nextColors[fi*3+2];pending[idx]=0;remaining--;});
  }

  // Do not smooth outside the mask: every unselected pixel must remain
  // byte-for-byte identical to the source image.
  for (let i = 0; i < maskFlag.length; i++) {
    if (maskFlag[i]) continue;
    const p = i * 4;
    data[p] = originalData[p];
    data[p + 1] = originalData[p + 1];
    data[p + 2] = originalData[p + 2];
    data[p + 3] = originalData[p + 3];
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Detect pale, low-saturation repeated text watermarks across an image. */
export async function detectRepeatedWatermarkMask(imageSource: HTMLImageElement | string): Promise<string> {
  const img = await resolveImage(imageSource);
  const width = img.naturalWidth || img.width, height = img.naturalHeight || img.height;
  const c = document.createElement("canvas"); c.width = width; c.height = height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!; ctx.drawImage(img, 0, 0);
  const src = ctx.getImageData(0, 0, width, height).data;
  const flag = new Uint8Array(width * height);
  for (let y = 6; y < height - 6; y++) for (let x = 6; x < width - 6; x++) {
    const i = y * width + x, p = i * 4;
    if (src[p + 3] < 48) continue;
    const r = src[p], g = src[p + 1], b = src[p + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const saturation = max - min, lum = (r + g + b) / 3;
    let ar = 0, ag = 0, ab = 0, n = 0;
    for (const [dx, dy] of [[-6,0],[6,0],[0,-6],[0,6],[-5,-5],[5,-5],[-5,5],[5,5]]) {
      const q = ((y + dy) * width + x + dx) * 4;
      if (src[q + 3] < 48) continue;
      ar += src[q]; ag += src[q + 1]; ab += src[q + 2]; n++;
    }
    if (n < 4) continue;
    ar /= n; ag /= n; ab /= n;
    const localLum = (ar + ag + ab) / 3;
    const localSat = Math.max(ar, ag, ab) - Math.min(ar, ag, ab);
    const lift = lum - localLum;
    const movesTowardWhite = r > ar + 1.5 && g > ag + 1.5 && b > ab + 1.5;
    const desaturatesSurface = saturation < localSat - 1.5;
    const paleGreyOnLight = saturation < 20 && lum > 135 && lum < 250 &&
      Math.abs(lift) > 2.5 && Math.abs(lift) < 44;
    const translucentWhiteOnColour = movesTowardWhite && lift > 2.5 &&
      lift < 48 && (desaturatesSurface || localSat > 22);
    if (paleGreyOnLight || translucentWhiteOnColour) flag[i] = 1;
  }
  // Close/dilate thin anti-aliased glyph strokes.
  let grown = flag;
  for (let pass = 0; pass < 3; pass++) {
    const next = grown.slice();
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (!grown[i] && (grown[i-1] || grown[i+1] || grown[i-width] || grown[i+width])) next[i] = 1;
    }
    grown = next;
  }
  const out = document.createElement("canvas"); out.width = width; out.height = height;
  const od = out.getContext("2d")!.createImageData(width, height);
  for (let i = 0; i < grown.length; i++) if (grown[i]) {
    const p = i * 4; od.data[p] = 255; od.data[p + 3] = 255;
  }
  out.getContext("2d")!.putImageData(od, 0, 0);
  return out.toDataURL("image/png");
}

/**
 * Crop image by custom bounding box rectangle (percentages 0-100)
 */
export async function cropImageByRect(
  imageSource: HTMLImageElement | string,
  rect: { x: number; y: number; width: number; height: number },
  outputSize?: { width: number; height: number },
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await resolveImage(imageSource);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Calculate pixel bounds clamped
  const pxX = Math.max(0, Math.min(origW - 1, Math.round((rect.x / 100) * origW)));
  const pxY = Math.max(0, Math.min(origH - 1, Math.round((rect.y / 100) * origH)));
  const pxW = Math.max(10, Math.min(origW - pxX, Math.round((rect.width / 100) * origW)));
  const pxH = Math.max(10, Math.min(origH - pxY, Math.round((rect.height / 100) * origH)));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, outputSize?.width || pxW);
  canvas.height = Math.max(1, outputSize?.height || pxH);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, pxX, pxY, pxW, pxH, 0, 0, canvas.width, canvas.height);

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Apply real-time adjustments (Brightness, Contrast, Saturation, Temp, Sharpness, Filters)
 */
export async function applyAdjustmentsAndFilters(
  imageSource: HTMLImageElement | string,
  adjustments: ImageAdjustments
): Promise<string> {
  const img = await resolveImage(imageSource);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context failed");

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Preset filter lookup
  const filterPreset = FILTER_PRESETS.find((f) => f.id === adjustments.filterId);

  const bDelta = adjustments.brightness + (filterPreset?.brightness || 0);
  const cDelta = adjustments.contrast + (filterPreset?.contrast || 0);
  const sDelta = adjustments.saturation + (filterPreset?.saturation || 0);
  const tDelta = adjustments.temperature + (filterPreset?.temperature || 0);
  const sepiaVal = adjustments.sepia + (filterPreset?.sepia || 0);
  const sharpVal = adjustments.sharpness + (filterPreset?.sharpness || 0);

  // Pre-calculate contrast factor
  const contrastFactor = (259 * (cDelta + 255)) / (255 * (259 - cDelta));
  const satFactor = 1 + sDelta / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    r += bDelta * 2.55;
    g += bDelta * 2.55;
    b += bDelta * 2.55;

    // Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Temperature (Warm/Cool) & Tint
    if (tDelta !== 0) {
      r += tDelta * 1.2;
      b -= tDelta * 1.2;
    }
    if (adjustments.tint !== 0) {
      g += adjustments.tint * 1.0;
    }

    // Saturation
    if (sDelta !== 0) {
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
    }

    // Sepia
    if (sepiaVal > 0) {
      const s = Math.min(1, sepiaVal / 100);
      const sr = r * 0.393 + g * 0.769 + b * 0.189;
      const sg = r * 0.349 + g * 0.686 + b * 0.168;
      const sb = r * 0.272 + g * 0.534 + b * 0.131;
      r = r * (1 - s) + sr * s;
      g = g * (1 - s) + sg * s;
      b = b * (1 - s) + sb * s;
    }

    // Invert
    if (adjustments.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  // Vignette
  if (adjustments.vignette > 0) {
    applyVignette(data, width, height, adjustments.vignette / 100);
  }

  // Sharpness Convolution Matrix
  if (sharpVal > 0) {
    applySharpen(data, width, height, sharpVal / 100);
  }

  ctx.putImageData(imgData, 0, 0);

  // Blur (if any)
  if (adjustments.blur > 0) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.filter = `blur(${adjustments.blur * 0.5}px)`;
    tempCtx.drawImage(canvas, 0, 0);
    return tempCanvas.toDataURL("image/png");
  }

  return canvas.toDataURL("image/png");
}

/**
 * Composite full image with background, subject cutout, shadow, stroke, text, stickers, and security watermark
 */
export async function renderCompositeCanvas(
  subjectImgUrl: string,
  bgConfig: BgConfig,
  textElements: TextElement[] = [],
  stickers: StickerElement[] = [],
  watermarkConfig?: AddWatermarkConfig,
  outputScale: number = 1,
  isJpeg: boolean = false
): Promise<HTMLCanvasElement> {
  const subjectImg = await resolveImage(subjectImgUrl);
  const width = Math.round((subjectImg.naturalWidth || subjectImg.width) * outputScale);
  const height = Math.round((subjectImg.naturalHeight || subjectImg.height) * outputScale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas init failed");

  ctx.save();

  // If exporting as JPEG, fill pure white background first so transparent pixels never turn black
  if (isJpeg) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  }

  // 1. Draw Background
  if (bgConfig.type === "transparent") {
    if (!isJpeg) {
      ctx.clearRect(0, 0, width, height);
    }
  } else if (bgConfig.type === "color") {
    ctx.fillStyle = bgConfig.color;
    ctx.fillRect(0, 0, width, height);
  } else if (bgConfig.type === "gradient") {
    const grad = bgConfig.gradient;
    let gradientFill: CanvasGradient;
    if (grad.type === "linear") {
      const rad = (grad.angle * Math.PI) / 180;
      const x1 = width / 2 - (Math.cos(rad) * width) / 2;
      const y1 = height / 2 - (Math.sin(rad) * height) / 2;
      const x2 = width / 2 + (Math.cos(rad) * width) / 2;
      const y2 = height / 2 + (Math.sin(rad) * height) / 2;
      gradientFill = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      gradientFill = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) / 1.5
      );
    }

    gradientFill.addColorStop(0, grad.color1);
    if (grad.color3) {
      gradientFill.addColorStop(0.5, grad.color3);
      gradientFill.addColorStop(1, grad.color2);
    } else {
      gradientFill.addColorStop(1, grad.color2);
    }
    ctx.fillStyle = gradientFill;
    ctx.fillRect(0, 0, width, height);
  } else if (bgConfig.type === "image" && bgConfig.imageUrl) {
    try {
      const bgImg = await resolveImage(bgConfig.imageUrl);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch {
      ctx.fillStyle = "#F3F4F6";
      ctx.fillRect(0, 0, width, height);
    }
  } else if (bgConfig.type === "texture") {
    drawTextureBackground(ctx, width, height, bgConfig.textureId || "studio");
  }

  // 2. Draw Subject Shadow (if enabled)
  if (bgConfig.shadow && bgConfig.shadow.enabled) {
    ctx.save();
    ctx.shadowColor = bgConfig.shadow.color || "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = bgConfig.shadow.blur * outputScale;
    ctx.shadowOffsetX = bgConfig.shadow.offsetX * outputScale;
    ctx.shadowOffsetY = bgConfig.shadow.offsetY * outputScale;
    ctx.drawImage(subjectImg, 0, 0, width, height);
    ctx.restore();
  }

  // 3. Draw Subject Stroke / Outline (if enabled)
  if (bgConfig.stroke && bgConfig.stroke.enabled && bgConfig.stroke.width > 0) {
    drawSubjectOutline(ctx, subjectImg, width, height, bgConfig.stroke.width * outputScale, bgConfig.stroke.color);
  }

  // 4. Draw Subject Cutout / Working Image
  ctx.drawImage(subjectImg, 0, 0, width, height);

  // 5. Draw Text Elements
  for (const item of textElements) {
    drawTextElement(ctx, item, width, height, outputScale);
  }

  // 6. Draw Stickers / Badges
  for (const sticker of stickers) {
    drawStickerBadge(ctx, sticker, width, height, outputScale);
  }

  // 7. Draw Anti-theft / Copyright Watermark Layer
  if (watermarkConfig && watermarkConfig.enabled) {
    await drawWatermarkLayer(ctx, watermarkConfig, width, height, outputScale);
  }

  ctx.restore();
  return canvas;
}

// Helpers

function imageElementToBlob(img: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("Could not encode source image")),
    "image/png",
    1,
  ));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function resolveImage(source: HTMLImageElement | string): Promise<HTMLImageElement> {
  if (typeof source !== "string") {
    if (source.complete) return Promise.resolve(source);
    return new Promise((resolve, reject) => {
      source.onload = () => resolve(source);
      source.onerror = reject;
    });
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = source;
  });
}

function getPixelRGB(data: Uint8ClampedArray, width: number, x: number, y: number): [number, number, number] {
  const idx = (y * width + x) * 4;
  return [data[idx], data[idx + 1], data[idx + 2]];
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11);
}

function applySoftFeather(alpha: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  if (radius <= 0) return alpha;
  const output = new Uint8Array(alpha.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          sum += alpha[ny * width + nx];
          count++;
        }
      }
      output[y * width + x] = Math.round(sum / count);
    }
  }
  return output;
}

function applyEdgeExpansion(alpha: Uint8Array, width: number, height: number, amount: number): Uint8Array {
  const steps = Math.min(10, Math.abs(Math.round(amount)));
  if (!steps) return alpha;
  let current = alpha.slice();
  for (let step = 0; step < steps; step++) {
    const next = current.slice();
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const values = [current[idx], current[idx-1], current[idx+1], current[idx-width], current[idx+width]];
      // Positive extends the opaque subject; negative shrinks it inward.
      next[idx] = amount > 0 ? Math.max(...values) : Math.min(...values);
    }
    current = next;
  }
  return current;
}

function smoothMaskSeams(
  data: Uint8ClampedArray,
  maskFlag: Uint8Array,
  width: number,
  height: number,
  radius: number
) {
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = y * width + x;
      if (maskFlag[idx] === 1) {
        // check if neighbor is unmasked (seam)
        let isSeam = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (maskFlag[(y + dy) * width + (x + dx)] === 0) {
              isSeam = true;
              break;
            }
          }
        }
        if (isSeam) {
          let sr = 0, sg = 0, sb = 0, c = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const pIdx = ((y + dy) * width + (x + dx)) * 4;
              sr += data[pIdx];
              sg += data[pIdx + 1];
              sb += data[pIdx + 2];
              c++;
            }
          }
          const p = idx * 4;
          data[p] = Math.round(sr / c);
          data[p + 1] = Math.round(sg / c);
          data[p + 2] = Math.round(sb / c);
        }
      }
    }
  }
}

function applyVignette(data: Uint8ClampedArray, width: number, height: number, strength: number) {
  const cx = width / 2;
  const cy = height / 2;
  const maxD = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxD;
      const factor = 1 - Math.pow(d, 2) * strength * 0.8;
      data[idx] = Math.max(0, data[idx] * factor);
      data[idx + 1] = Math.max(0, data[idx + 1] * factor);
      data[idx + 2] = Math.max(0, data[idx + 2] * factor);
    }
  }
}

function applySharpen(data: Uint8ClampedArray, width: number, height: number, amount: number) {
  const copy = new Uint8ClampedArray(data);
  const factor = amount * 1.2;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const top = copy[((y - 1) * width + x) * 4 + c];
        const bottom = copy[((y + 1) * width + x) * 4 + c];
        const left = copy[(y * width + (x - 1)) * 4 + c];
        const right = copy[(y * width + (x + 1)) * 4 + c];

        const laplacian = 4 * center - (top + bottom + left + right);
        data[idx + c] = Math.max(0, Math.min(255, center + laplacian * factor));
      }
    }
  }
}

function drawTextureBackground(ctx: CanvasRenderingContext2D, width: number, height: number, type: string) {
  ctx.save();
  if (type === "studio") {
    // Luxury studio spotlight vignette
    const grad = ctx.createRadialGradient(width * 0.5, height * 0.4, 20, width * 0.5, height * 0.5, Math.max(width, height) * 0.8);
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(0.5, "#E2E8F0");
    grad.addColorStop(1, "#94A3B8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (type === "warm_studio") {
    const grad = ctx.createRadialGradient(width * 0.5, height * 0.35, 10, width * 0.5, height * 0.5, Math.max(width, height) * 0.75);
    grad.addColorStop(0, "#FFFBEB");
    grad.addColorStop(0.5, "#FDE68A");
    grad.addColorStop(1, "#D97706");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (type === "marble") {
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(203, 213, 225, 0.4)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (height / 6) * i + Math.random() * 20);
      ctx.bezierCurveTo(width * 0.3, (height / 6) * i + 80, width * 0.7, (height / 6) * i - 40, width, (height / 6) * i + 40);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#E5E7EB";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

function drawSubjectOutline(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  strokeWidth: number,
  strokeColor: string
) {
  ctx.save();
  // Draw outline by rendering dilated offsets
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;

  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const ox = Math.cos(angle) * strokeWidth;
    const oy = Math.sin(angle) * strokeWidth;
    tempCtx.drawImage(img, ox, oy, width, height);
  }

  tempCtx.globalCompositeOperation = "source-in";
  tempCtx.fillStyle = strokeColor;
  tempCtx.fillRect(0, 0, width, height);

  ctx.drawImage(tempCanvas, 0, 0);
  ctx.restore();
}

function drawTextElement(
  ctx: CanvasRenderingContext2D,
  elem: TextElement,
  width: number,
  height: number,
  scale: number
) {
  ctx.save();
  const posX = (elem.x / 100) * width;
  const posY = (elem.y / 100) * height;
  const fontSize = elem.fontSize * (elem.scale || 1) * scale;

  ctx.font = `${elem.fontWeight} ${fontSize}px ${elem.fontFamily || "sans-serif"}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  ctx.translate(posX, posY);
  if (elem.rotation) {
    ctx.rotate((elem.rotation * Math.PI) / 180);
  }

  const metrics = ctx.measureText(elem.text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;

  // Background pill if set
  if (elem.bgColor) {
    ctx.fillStyle = elem.bgColor;
    const paddingX = 14 * scale;
    const paddingY = 8 * scale;
    const radius = 6 * scale;
    const rx = -textWidth / 2 - paddingX;
    const ry = -textHeight / 2 - paddingY / 2;
    const rw = textWidth + paddingX * 2;
    const rh = textHeight + paddingY;

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(rx, ry, rw, rh, radius) : ctx.rect(rx, ry, rw, rh);
    ctx.fill();
  }

  // Shadow
  if (elem.hasShadow) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetX = 2 * scale;
    ctx.shadowOffsetY = 2 * scale;
  }

  // Border Stroke
  if (elem.hasBorder) {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4 * scale;
    ctx.strokeText(elem.text, 0, 0);
  }

  // Main text fill
  ctx.fillStyle = elem.color;
  ctx.fillText(elem.text, 0, 0);

  ctx.restore();
}

function drawStickerBadge(
  ctx: CanvasRenderingContext2D,
  sticker: StickerElement,
  width: number,
  height: number,
  scale: number
) {
  ctx.save();
  const posX = (sticker.x / 100) * width;
  const posY = (sticker.y / 100) * height;
  const badgeScale = sticker.scale * scale;

  ctx.translate(posX, posY);
  if (sticker.rotation) {
    ctx.rotate((sticker.rotation * Math.PI) / 180);
  }
  ctx.scale(badgeScale, badgeScale);

  const colors: Record<string, { bg: string; text: string; label: string }> = {
    hot: { bg: "#EF4444", text: "#FFFFFF", label: "🔥 爆款热销" },
    new: { bg: "#10B981", text: "#FFFFFF", label: "✨ 新品首发" },
    authentic: { bg: "#3B82F6", text: "#FFFFFF", label: "🛡️ 正品保障" },
    discount: { bg: "#F59E0B", text: "#FFFFFF", label: "🏷️ 限时特惠" },
    sale: { bg: "#EC4899", text: "#FFFFFF", label: "💥 狂欢大促" },
    verified: { bg: "#6366F1", text: "#FFFFFF", label: "✓ 官方认证" },
    ai: { bg: "#8B5CF6", text: "#FFFFFF", label: "⚡ AI生成" },
  };

  const current = colors[sticker.badgeType] || colors.hot;
  const label = sticker.title || current.label;

  ctx.font = "bold 15px sans-serif";
  const metrics = ctx.measureText(label);
  const w = metrics.width + 24;
  const h = 32;

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  // Badge Container
  ctx.fillStyle = current.bg;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-w / 2, -h / 2, w, h, 16) : ctx.rect(-w / 2, -h / 2, w, h);
  ctx.fill();

  // White inner border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Text
  ctx.shadowColor = "transparent";
  ctx.fillStyle = current.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 1);

  ctx.restore();
}

/**
 * Draw Anti-theft / Copyright Watermark Layer (Supports Tiled Grid & Single Position)
 */
async function drawWatermarkLayer(
  ctx: CanvasRenderingContext2D,
  config: AddWatermarkConfig,
  width: number,
  height: number,
  scale: number
) {
  if (!config.enabled) return;
  if (config.type === "text" && !config.text.trim()) return;
  if (config.type === "image" && !config.imageUrl) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0.01, Math.min(1, config.opacity));

  let logoImg: HTMLImageElement | null = null;
  if (config.type === "image" && config.imageUrl) {
    try {
      logoImg = await resolveImage(config.imageUrl);
    } catch (e) {
      console.warn("Watermark logo load failed:", e);
      ctx.restore();
      return;
    }
  }

  const rotationRad = (config.rotation * Math.PI) / 180;
  const scaledFontSize = Math.max(12, Math.round(config.fontSize * scale));

  if (config.layout === "tile") {
    // Tiled / Grid Watermark covering entire canvas
    const stepX = Math.max(100, config.gapX * scale);
    const stepY = Math.max(80, config.gapY * scale);

    // Diagonal bounds to ensure full coverage when rotated
    const diagonal = Math.sqrt(width * width + height * height);
    const startX = -diagonal * 0.5;
    const endX = width + diagonal * 0.5;
    const startY = -diagonal * 0.5;
    const endY = height + diagonal * 0.5;

    let rowIndex = 0;
    for (let y = startY; y < endY; y += stepY) {
      // Stagger odd rows for classic dynamic watermark protection
      const offsetX = (rowIndex % 2 === 1) ? stepX * 0.5 : 0;
      rowIndex++;

      for (let x = startX + offsetX; x < endX; x += stepX) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotationRad);

        if (config.type === "text") {
          ctx.font = `600 ${scaledFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (config.hasShadow) {
            ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
            ctx.shadowBlur = 4 * scale;
            ctx.shadowOffsetX = 1 * scale;
            ctx.shadowOffsetY = 1 * scale;
          }

          ctx.fillStyle = config.color;
          ctx.fillText(config.text, 0, 0);
        } else if (logoImg) {
          const logoW = (logoImg.naturalWidth || logoImg.width) * (config.imageScale || 0.5) * scale;
          const logoH = (logoImg.naturalHeight || logoImg.height) * (config.imageScale || 0.5) * scale;
          ctx.drawImage(logoImg, -logoW / 2, -logoH / 2, logoW, logoH);
        }

        ctx.restore();
      }
    }
  } else {
    // Single Position Mode
    let posX = width * 0.5;
    let posY = height * 0.5;
    let textAlign: CanvasTextAlign = "center";
    let textBaseline: CanvasTextBaseline = "middle";

    switch (config.position) {
      case "top-left":
        posX = width * 0.06;
        posY = height * 0.06;
        textAlign = "left";
        textBaseline = "top";
        break;
      case "top-center":
        posX = width * 0.5;
        posY = height * 0.06;
        textAlign = "center";
        textBaseline = "top";
        break;
      case "top-right":
        posX = width * 0.94;
        posY = height * 0.06;
        textAlign = "right";
        textBaseline = "top";
        break;
      case "center-left":
        posX = width * 0.06;
        posY = height * 0.5;
        textAlign = "left";
        textBaseline = "middle";
        break;
      case "center":
        posX = width * 0.5;
        posY = height * 0.5;
        textAlign = "center";
        textBaseline = "middle";
        break;
      case "center-right":
        posX = width * 0.94;
        posY = height * 0.5;
        textAlign = "right";
        textBaseline = "middle";
        break;
      case "bottom-left":
        posX = width * 0.06;
        posY = height * 0.94;
        textAlign = "left";
        textBaseline = "bottom";
        break;
      case "bottom-center":
        posX = width * 0.5;
        posY = height * 0.94;
        textAlign = "center";
        textBaseline = "bottom";
        break;
      case "bottom-right":
        posX = width * 0.94;
        posY = height * 0.94;
        textAlign = "right";
        textBaseline = "bottom";
        break;
      case "custom":
        posX = (config.customX / 100) * width;
        posY = (config.customY / 100) * height;
        textAlign = "center";
        textBaseline = "middle";
        break;
    }

    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate(rotationRad);

    if (config.type === "text") {
      ctx.font = `bold ${scaledFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;

      if (config.hasShadow) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 6 * scale;
        ctx.shadowOffsetX = 2 * scale;
        ctx.shadowOffsetY = 2 * scale;
      }

      ctx.fillStyle = config.color;
      ctx.fillText(config.text, 0, 0);
    } else if (logoImg) {
      const logoW = (logoImg.naturalWidth || logoImg.width) * (config.imageScale || 0.5) * scale;
      const logoH = (logoImg.naturalHeight || logoImg.height) * (config.imageScale || 0.5) * scale;
      ctx.drawImage(logoImg, -logoW / 2, -logoH / 2, logoW, logoH);
    }

    ctx.restore();
  }

  ctx.restore();
}
