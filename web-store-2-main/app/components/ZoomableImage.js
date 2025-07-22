import React, { useRef } from 'react';
import { View, Modal, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

export default function ZoomableImage({ source, visible, onClose }) {
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const pan = useRef(new Animated.ValueXY()).current;
  const lastPan = useRef({ x: 0, y: 0 });

  // Pinch and pan handlers (mobile only)
  // For desktop, click to close or use scroll to zoom (not implemented here)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.centered} pointerEvents="box-none">
          <Animated.View
            style={[styles.imageContainer, { transform: [...pan.getTranslateTransform(), { scale }] }]}
            pointerEvents="auto"
            onStartShouldSetResponder={() => true}
            onTouchStart={e => e.stopPropagation && e.stopPropagation()}
          >
            <ExpoImage
              source={source}
              style={styles.image}
              contentFit="contain"
            />
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    maxWidth: width - 32,
    maxHeight: height - 80,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  image: {
    width: width - 64,
    height: height - 120,
    resizeMode: 'contain',
    borderRadius: 14,
    backgroundColor: '#222',
  },
});
