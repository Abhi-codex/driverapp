import { Text, View } from "react-native";
import { styles as s } from "../constants/tailwindStyles";

export default function Page() {
  return (
    <View>
      <View style={[s.p4]}>
        <Text style={[s.textLg, s.fontBold]}>patient app</Text>
      </View>
    </View>
  );
}
