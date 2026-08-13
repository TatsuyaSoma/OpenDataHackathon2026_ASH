import React from 'react';

interface Props {
  visible: boolean;
  imageUri?: string;
  onCancel: () => void;
  onConfirm: (croppedUri: string) => void;
}

/**
 * ネイティブ（iOS/Android）ではexpo-image-pickerのallowsEditingでOS標準の
 * 切り抜きUIが表示されるため、このコンポーネントは使用しない（何も描画しない）。
 * Web版の実装は ImageCropModal.web.tsx を参照。
 */
export const ImageCropModal: React.FC<Props> = () => null;
