import { Reel } from "@/shared/types/reel";
import { useReelStore } from "@/store/reel.store";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  StatusBar,
  View,
  ViewToken,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EmptyMessage from "./components/EmptyMessage";
import ReelItem from "./components/ReelItem";

export default function ReelsScreen() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const reels = useReelStore((state) => state.reels);
  const loading = useReelStore((state) => state.loading);
  const hasMore = useReelStore((state) => state.hasMore);
  const fetchInitial = useReelStore((state) => state.fetchInitial);
  const fetchMore = useReelStore((state) => state.fetchMore);
  const setCurrentIndex = useReelStore((state) => state.setCurrentIndex);

  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [containerHeight, setContainerHeight] = useState(0);
  const itemHeight = useMemo(
    () => Math.max(containerHeight || screenHeight, 1),
    [containerHeight, screenHeight],
  );

  const flatListRef = useRef<FlatList<Reel>>(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisible = viewableItems[0];
      if (!firstVisible?.isViewable || typeof firstVisible.index !== "number") return;
      setCurrentIndex(firstVisible.index);
    },
  ).current;

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Reel>) => (
      <ReelItem
        reel={item}
        index={index}
        itemHeight={itemHeight}
        itemWidth={screenWidth}
        bottomInset={Math.max(insets.bottom, 8)}
        screenActive={isFocused}
      />
    ),
    [insets.bottom, isFocused, itemHeight, screenWidth],
  );

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
    <View
      className="flex-1 bg-[#101010]"
      onLayout={(event) => setContainerHeight(event.nativeEvent.layout.height)}
    >
      <StatusBar barStyle="light-content" hidden />

      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={itemHeight}
        pagingEnabled
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={() => !loading && hasMore && fetchMore()}
        onEndReachedThreshold={0.5}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        windowSize={5}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={40}
        removeClippedSubviews
        ListFooterComponent={
          !hasMore && reels.length > 0 ? <EmptyMessage /> : null
        }
      />
    </View>
  );
}
