import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EditProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Edit Profile Screen (Placeholder)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EditProfileScreen;