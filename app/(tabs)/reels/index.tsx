import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StatusBar,
  View,
} from "react-native";

import { useReelStore } from "@/store/reel.store";
import EmptyMessage from "./components/EmptyMessage";
import ReelItem from "./components/ReelItem";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ReelsScreen() {
  const { reels, loading, hasMore, fetchInitial, fetchMore } = useReelStore();

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchInitial();
  }, []);

  if (loading && reels.length === 0) {
    return (
      <View className="flex-1 bg-[#101010] justify-center items-center">
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  if (!loading && reels.length === 0) {
    return <EmptyMessage />;
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" hidden />

      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ReelItem reel={item} index={index} />}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onEndReached={() => !loading && hasMore && fetchMore()}
        onEndReachedThreshold={0.5}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={4}
        removeClippedSubviews
        ListFooterComponent={
        !hasMore && reels.length > 0 ? (
            <EmptyMessage />
          ) : null
        }
      />
    </View>
  );
}
