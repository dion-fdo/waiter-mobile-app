import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Notepad'>;

type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  important?: boolean;
};

function getNotesKey(tableId: number) {
  return `table_notepad_notes_${tableId}`;
}

export default function NotepadScreen({ navigation, route }: Props) {
  const { tableId, tableName } = route.params;

  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [important, setImportant] = useState(false);

  const loadNotes = useCallback(async () => {
    const saved = await AsyncStorage.getItem(getNotesKey(tableId));

    if (!saved) {
      setNotes([]);
      return;
    }

    setNotes(JSON.parse(saved));
  }, [tableId]);

  const saveNotes = async (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    await AsyncStorage.setItem(
      getNotesKey(tableId),
      JSON.stringify(updatedNotes)
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const openAddNote = () => {
    setEditingNote(null);
    setTitle('');
    setBody('');
    setImportant(false);
    setModalVisible(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setBody(note.body);
    setImportant(!!note.important);
    setModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!title.trim() && !body.trim()) {
      Alert.alert('Empty note', 'Please add a title or note content.');
      return;
    }

    const now = Date.now();

    if (editingNote) {
      const updatedNotes = notes.map(note =>
        note.id === editingNote.id
          ? {
              ...note,
              title: title.trim(),
              body: body.trim(),
              important,
              updatedAt: now,
            }
          : note
      );

      await saveNotes(updatedNotes);
    } else {
      const newNote: Note = {
        id: `${now}`,
        title: title.trim() || 'Untitled Note',
        body: body.trim(),
        important,
        createdAt: now,
        updatedAt: now,
      };

      await saveNotes([newNote, ...notes]);
    }

    setModalVisible(false);
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete note',
      'Are you sure you want to delete this note?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedNotes = notes.filter(note => note.id !== noteId);
            await saveNotes(updatedNotes);
          },
        },
      ]
    );
  };

  const formatDate = (value: number) => {
    return new Date(value).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topCard}>
          <Text style={styles.header}>Notepad</Text>
          <Text style={styles.subHeader}>{tableName}</Text>
        </View>

        <FlatList
          data={notes}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No notes added yet.</Text>
              <Text style={styles.emptyText}>
                Tap the plus button to add a note for this table.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.noteCard}
              onPress={() => openEditNote(item)}
            >
              <View style={styles.noteHeaderRow}>
                <View style={styles.noteTextWrap}>
                  <Text style={styles.noteTitle} numberOfLines={1}>
                    {item.title}
                  </Text>

                  <Text style={styles.noteDate}>
                    {formatDate(item.updatedAt)}
                  </Text>
                </View>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNote(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>

              {item.body ? (
                <Text style={styles.noteBody} numberOfLines={3}>
                  {item.body}
                </Text>
              ) : null}
            </Pressable>
          )}
        />

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Pressable style={styles.fab} onPress={openAddNote}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>

        <Modal visible={modalVisible} transparent animationType="fade">
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  {editingNote ? 'Edit Note' : 'Add Note'}
                </Text>

                <Pressable
                  style={[
                    styles.importantButton,
                    important && styles.importantButtonActive,
                  ]}
                  onPress={() => setImportant(prev => !prev)}
                >
                  <Image
                    source={require('../../../assets/important.png')}
                    style={styles.importantIcon}
                  />
                </Pressable>
              </View>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor="#9CA3AF"
                style={styles.titleInput}
              />

              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Write your note here..."
                placeholderTextColor="#9CA3AF"
                style={styles.bodyInput}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.modalButtonRow}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.saveButton} onPress={handleSaveNote}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>

                <Pressable
                  style={styles.cashierButton}
                  onPress={() => {
                    // TODO: send note to cashier
                  }}
                >
                  <Image
                    source={require('../../../assets/send-cashier.png')}
                    style={styles.cashierIcon}
                  />
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  topCard: {
    backgroundColor: '#F05822',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },

  subHeader: {
    fontSize: 15,
    color: '#ffffff',
  },

  listContent: {
    paddingBottom: 100,
  },

  emptyBox: {
    backgroundColor: '#efefef',
    borderWidth: 1,
    borderColor: '#c3c3c3',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  noteCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  noteTextWrap: {
    flex: 1,
  },

  noteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  noteDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  noteBody: {
    marginTop: 12,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  deleteButtonText: {
    color: '#F05822',
    fontSize: 13,
    fontWeight: '700',
  },

  backButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    color: '#5a5a5a',
    fontSize: 16,
    fontWeight: '400',
  },

  fab: {
    position: 'absolute',
    right: 22,
    bottom: 82,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F05822',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  fabText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '500',
    marginTop: -2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },

  titleInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },

  bodyInput: {
    height: 180,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1,
    backgroundColor: '#F05822',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  importantButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#d10000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  importantButtonActive: {
    backgroundColor: '#2d8700',
    borderWidth: 1,
    borderColor: '#70f564',
  },

  importantIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  cashierButton: {
    width: 48,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cashierIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});