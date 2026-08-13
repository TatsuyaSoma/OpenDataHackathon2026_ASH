import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Check, X, ZoomIn } from 'lucide-react-native';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  visible: boolean;
  imageUri?: string;
  onCancel: () => void;
  onConfirm: (croppedUri: string) => void;
}

const VIEWPORT_SIZE = 280; // 切り抜き枠の表示サイズ（CSS px）
const OUTPUT_SIZE = 480; // 書き出す画像の解像度（px）
const MAX_ZOOM = 3;

/**
 * Web版の写真切り抜きモーダル。
 * expo-image-pickerのallowsEditingはWebでは無視される（未対応）ため、
 * ドラッグでの位置調整・スライダーでの拡大縮小をcanvasで実装している。
 */
export const ImageCropModal: React.FC<Props> = ({ visible, imageUri, onCancel, onConfirm }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // 画像が変わるたびに状態をリセットする
  useEffect(() => {
    setNaturalSize({ width: 0, height: 0 });
    setZoom(1);
    setPos({ x: 0, y: 0 });
  }, [imageUri]);

  const applyNaturalSize = (width: number, height: number) => {
    const scale = VIEWPORT_SIZE / Math.min(width, height);
    setNaturalSize({ width, height });
    setPos({
      x: (VIEWPORT_SIZE - width * scale) / 2,
      y: (VIEWPORT_SIZE - height * scale) / 2,
    });
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    applyNaturalSize(img.naturalWidth, img.naturalHeight);
  };

  // blob:/data: URIは読み込みが一瞬で終わり、onLoadがReact側のイベント登録より先に
  // 発火してしまうことがある。その場合img.completeが既にtrueになっているので、
  // レンダー後に取りこぼしがないか確認して補完する。
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0 && naturalSize.width === 0) {
      applyNaturalSize(img.naturalWidth, img.naturalHeight);
    }
  }, [imageUri, naturalSize.width]);

  const baseScale =
    naturalSize.width > 0 ? VIEWPORT_SIZE / Math.min(naturalSize.width, naturalSize.height) : 1;
  const displayScale = baseScale * zoom;
  const displayedWidth = naturalSize.width * displayScale;
  const displayedHeight = naturalSize.height * displayScale;

  const clampPos = (x: number, y: number) => ({
    x: Math.min(0, Math.max(VIEWPORT_SIZE - displayedWidth, x)),
    y: Math.min(0, Math.max(VIEWPORT_SIZE - displayedHeight, y)),
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, posX: pos.x, posY: pos.y };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPos(clampPos(dragRef.current.posX + dx, dragRef.current.posY + dy));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const handleZoomChange = (value: number) => {
    const nextScale = baseScale * value;
    const nextWidth = naturalSize.width * nextScale;
    const nextHeight = naturalSize.height * nextScale;
    // ズーム後も見えている中心位置ができるだけ保たれるよう、中心を基準に補正してから
    // 新しいズーム倍率での表示サイズでクランプし直す
    const ratio = nextScale / displayScale;
    const rawX = (pos.x - VIEWPORT_SIZE / 2) * ratio + VIEWPORT_SIZE / 2;
    const rawY = (pos.y - VIEWPORT_SIZE / 2) * ratio + VIEWPORT_SIZE / 2;
    setZoom(value);
    setPos({
      x: Math.min(0, Math.max(VIEWPORT_SIZE - nextWidth, rawX)),
      y: Math.min(0, Math.max(VIEWPORT_SIZE - nextHeight, rawY)),
    });
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || naturalSize.width === 0) return;

    const sourceX = -pos.x / displayScale;
    const sourceY = -pos.y / displayScale;
    const sourceSize = VIEWPORT_SIZE / displayScale;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    onConfirm(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <Modal visible={visible} transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} hitSlop={8}>
              <X size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>切り抜き位置を調整</Text>
            <TouchableOpacity onPress={handleConfirm} hitSlop={8}>
              <Check size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>ドラッグで位置を調整、下のスライダーで拡大・縮小できます。</Text>

          <div
            style={{
              width: VIEWPORT_SIZE,
              height: VIEWPORT_SIZE,
              borderRadius: 16,
              overflow: 'hidden',
              alignSelf: 'center',
              position: 'relative',
              backgroundColor: '#000',
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}>
            {imageUri && (
              <img
                ref={imgRef}
                src={imageUri}
                alt=""
                onLoad={handleImageLoad}
                draggable={false}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: displayedWidth || undefined,
                  height: displayedHeight || undefined,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <View style={styles.zoomRow}>
            <ZoomIn size={16} color={colors.textSecondary} />
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              style={{ flex: 1, marginLeft: spacing.sm }}
              disabled={naturalSize.width === 0}
            />
          </View>

          <TouchableOpacity style={styles.confirmButton} activeOpacity={0.8} onPress={handleConfirm}>
            <Check size={18} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>この位置に決定</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    width: VIEWPORT_SIZE + spacing.lg * 2,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
