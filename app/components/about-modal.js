import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function AboutModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.headerRow}>
            <FontAwesome name="info-circle" size={22} color="#BFA054" style={{ marginRight: 8 }} />
            <Text style={styles.header}>About Rare Collectables</Text>
            <Pressable style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close About">
              <FontAwesome name="close" size={22} color="#BFA054" />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.brandLine}>Luxury • Authenticity • Legacy</Text>
            <Text style={styles.body}>
              Rare Collectables is a destination for discerning collectors and lovers of fine jewellery and objects d'art. Our curated selection features only the most exquisite pieces—each chosen for its rarity, craftsmanship, and enduring value.
            </Text>
            <Text style={styles.body}>
              Our brand is defined by a commitment to authenticity, provenance, and a seamless luxury experience. Every item is authenticated and presented with the utmost care, reflecting our passion for detail and our respect for the stories behind each collectable.
            </Text>
            <Text style={styles.body}>
              We believe that true luxury is timeless. Our palette—gold, onyx black, ivory, amethyst, emerald, ruby, platinum grey, and soft gold—embodies sophistication and exclusivity. From your first browse to your final purchase, we ensure every moment feels special.
            </Text>
            <Text style={styles.body}>
              Whether you are seeking a unique gift, an heirloom investment, or a statement piece, Rare Collectables is your trusted partner in the world of luxury.
            </Text>
            <Text style={styles.footer}>Est. 2024 • London</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: 360, backgroundColor: '#FFF', borderRadius: 18, padding: 18, shadowColor: '#BFA054', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  header: { flex: 1, fontSize: 22, fontWeight: '900', color: '#BFA054', textAlign: 'left' },
  closeBtn: { padding: 4, marginLeft: 8 },
  brandLine: { color: '#BFA054', fontWeight: '700', fontSize: 15, marginBottom: 10, textAlign: 'center' },
  body: { color: '#1A1A1A', fontSize: 15, marginBottom: 12, textAlign: 'left', fontFamily: 'serif' },
  footer: { color: '#7C7C7C', fontWeight: '700', fontSize: 13, textAlign: 'center', marginTop: 16 },
});
