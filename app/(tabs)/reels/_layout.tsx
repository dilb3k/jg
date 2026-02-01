import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StatusBar,
  Text,
  View,
} from "react-native";

import { useReelStore } from "@/store/reel.store";
import ReelItem from "./components/ReelItem";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ReelsScreen() {
  const {
    reels,
    loading,
    hasMore,
    fetchInitial,
    fetchMore,
    currentIndex,
    setCurrentIndex,
  } = useReelStore();

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchInitial();
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 100,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      if (viewableItems.length === 0) return;

      const mostVisible = viewableItems.reduce((prev, curr) =>
        curr.isViewable &&
        (!prev.isViewable || curr.viewablePercent > prev.viewablePercent)
          ? curr
          : prev,
      );

      if (
        mostVisible?.index !== undefined &&
        mostVisible.index !== currentIndex
      ) {
        setCurrentIndex(mostVisible.index);
      }
    },
    [currentIndex, setCurrentIndex],
  );

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]).current;

  const showEmptyMessage = reels.length === 0 && !loading;

  const EmptyMessage = () => (
    <View
      style={{
        height: SCREEN_HEIGHT,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
      }}
    >
      <Text className="text-white text-xl mb-2">Больше рилсов пока нет</Text>
      <Text className="text-white/80 text-base w-2/3 text-center">
        Загляните позже — мы уже готовим новые
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" hidden />

      {showEmptyMessage ? (
        <EmptyMessage />
      ) : (
        <FlatList
          ref={flatListRef}
          data={reels}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ReelItem reel={item} index={index} />
          )}
          pagingEnabled
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
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
          removeClippedSubviews={true}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
          ListFooterComponent={
            loading && reels.length > 0 ? (
              <View
                style={{
                  height: 120,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#ff3366" />
              </View>
            ) : !hasMore && reels.length > 0 ? (
              <EmptyMessage />
            ) : null
          }
        />
      )}
    </View>
  );
}
