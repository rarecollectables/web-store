import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! How can I help you?', fromUser: false }
  ]);
  const [text, setText] = useState('');

  const sendMessage = () => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text, fromUser: true }]);
    setText('');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top || 20 }]}>      
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.message, item.fromUser ? styles.user : styles.bot]}>            
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <Pressable style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 10 },
  message: { padding: 10, borderRadius: 8, marginVertical: 5 },
  user: { backgroundColor: '#E5006D', alignSelf: 'flex-end' },
  bot: { backgroundColor: '#eee', alignSelf: 'flex-start' },
  messageText: { color: '#000' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ccc' },
  input: { flex: 1, padding: 10, backgroundColor: '#f1f1f1', borderRadius: 8, marginRight: 10 },
  sendButton: { backgroundColor: '#E5006D', padding: 10, borderRadius: 8 },
  sendText: { color: '#fff' },
  close: { position: 'absolute', top: 10, right: 10 },
  closeText: { color: '#888' }
});
