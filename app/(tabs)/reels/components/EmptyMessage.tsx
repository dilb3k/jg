import { Dimensions, Text, View } from "react-native";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const EmptyMessage = () => (
  <View
    style={{
      height: SCREEN_HEIGHT,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#1A1A1A",
    }}
  >
    <Text className="text-white text-xl mb-2">Больше рилсов пока нет</Text>
    <Text className="text-white/80 text-base w-2/3 text-center">
      Загляните позже — мы уже готовим новые
    </Text>
  </View>
);

export default EmptyMessage;