import { ThemedText } from "@/app-example/components/themed-text";
import { ThemedView } from "@/app-example/components/themed-view";

export default function Index() {
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
    </ThemedView>
  );
}
