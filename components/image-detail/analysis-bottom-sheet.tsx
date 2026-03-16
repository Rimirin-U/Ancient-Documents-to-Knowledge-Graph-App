import { useColor } from '@/hooks/useColor';
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

type AnalysisBottomSheetProps = PropsWithChildren<{
  collapsedTopRatio?: number;
  expandedTopRatio?: number;
  onTopChange?: (top: number) => void;
}>;

export function AnalysisBottomSheet({
  children,
  collapsedTopRatio = 0.75,
  expandedTopRatio = 0.2,
  onTopChange,
}: AnalysisBottomSheetProps) {
  const { height } = useWindowDimensions();

  const panelBg = useColor('background', { light: '#f6f7f9', dark: '#1d2229' });
  const borderColor = useColor('icon', { light: '#d8dbe1', dark: '#3a424d' });
  const handleColor = useColor('icon', { light: '#a5a9b1', dark: '#68717f' });

  const collapsedTop = useMemo(() => height * collapsedTopRatio, [height, collapsedTopRatio]);
  const expandedTop = useMemo(() => height * expandedTopRatio, [height, expandedTopRatio]);

  const top = useRef(new Animated.Value(collapsedTop)).current;
  const topOffsetRef = useRef(collapsedTop);
  const expandedRef = useRef(false);

  useEffect(() => {
    const target = expandedRef.current ? expandedTop : collapsedTop;
    top.setValue(target);
    topOffsetRef.current = target;
    onTopChange?.(target);
  }, [collapsedTop, expandedTop, onTopChange, top]);

  useEffect(() => {
    if (!onTopChange) return;

    const id = top.addListener(({ value }) => {
      onTopChange(value);
    });

    return () => {
      top.removeListener(id);
    };
  }, [onTopChange, top]);

  const animateTo = useCallback((value: number, nextExpanded: boolean) => {
    expandedRef.current = nextExpanded;
    Animated.spring(top, {
      toValue: value,
      useNativeDriver: false,
      damping: 20,
      stiffness: 180,
      mass: 0.6,
    }).start(() => {
      topOffsetRef.current = value;
      onTopChange?.(value);
    });
  }, [onTopChange, top]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 3,
        onPanResponderGrant: () => {
          top.stopAnimation((value) => {
            topOffsetRef.current = value;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const nextTop = Math.max(expandedTop, Math.min(collapsedTop, topOffsetRef.current + gestureState.dy));
          top.setValue(nextTop);
          onTopChange?.(nextTop);
        },
        onPanResponderRelease: (_, gestureState) => {
          const currentTop = topOffsetRef.current + gestureState.dy;
          const middle = (collapsedTop + expandedTop) / 2;
          const shouldExpand = gestureState.vy < -0.15 || currentTop < middle;

          animateTo(shouldExpand ? expandedTop : collapsedTop, shouldExpand);
        },
      }),
    [animateTo, collapsedTop, expandedTop, top]
  );

  return (
    <Animated.View style={[styles.panel, { top, backgroundColor: panelBg, borderColor }]}> 
      <View style={styles.handleZone} {...panResponder.panHandlers}>
        <View style={[styles.handle, { backgroundColor: handleColor }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 0,
    overflow: 'hidden',
  },
  handleZone: {
    paddingTop: 12,
    paddingBottom: 15,
    alignItems: 'center',
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 99,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 12,
  },
});
