import { Modal } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';

type ZoomableImageModalProps = {
  visible: boolean;
  imageUri?: string;
  onClose: () => void;
};

export function ZoomableImageModal({ visible, imageUri, onClose }: ZoomableImageModalProps) {
  const images = imageUri ? [{ url: imageUri }] : [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <ImageViewer
        imageUrls={images}
        onCancel={onClose}
        enableSwipeDown={true}
        backgroundColor="rgba(0, 0, 0, 0.95)"
      />
    </Modal>
  );
}
