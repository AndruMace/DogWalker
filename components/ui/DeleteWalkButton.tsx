import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useWalk } from '@/contexts/WalkContext';

type DeleteWalkButtonProps = {
  walkId: string;
  onDelete?: () => void;
};

export const DeleteWalkButton: React.FC<DeleteWalkButtonProps> = ({ walkId, onDelete }) => {
  const { deleteWalk } = useWalk();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePress = () => {
    Alert.alert(
      "Delete Walk",
      "Are you sure you want to delete this walk? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteWalk(walkId);
              if (onDelete) {
                onDelete();
              }
            } catch (error) {
              console.error("Error deleting walk:", error);
              Alert.alert("Error", "Failed to delete walk. Please try again.");
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleDeletePress}
      disabled={isDeleting}
    >
      <IconSymbol name="trash" size={20} color="#FF3B30" />
      <ThemedText style={styles.text}>Delete</ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  text: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  }
}); 