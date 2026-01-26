import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useState } from "react";
import { Button } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from 'expo-image-picker'

import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";


export default function Index() {
  const [image, setImage] = useState<string | null>(null);
  const router = useRouter();

  // 图片选择
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    // log
    console.log(result);
    // after
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      // -> detail page
      router.push({
        pathname: '/detail',
        params: { imageUri: uri },
      })
    }
  };

  // PAGE
  return (
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ThemedText>
        Hello!
      </ThemedText>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={{
        width: 400,
        height: 400,
      }} />}
    </ThemedView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});