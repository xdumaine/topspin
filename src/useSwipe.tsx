import { TouchEvent, useState } from 'react';

interface SwipeInput {
  onSwipedLeft: () => void;
  onSwipedRight: () => void;
  onOtherTouch: () => void;
}

interface SwipeOutput {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

export const useSwipe = (input: SwipeInput): SwipeOutput => {
  const [touchStart, setTouchStart] = useState([0, 0]);
  const [touchEnd, setTouchEnd] = useState([0, 0]);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd([0, 0]); // otherwise the swipe is fired even with usual touch events
    const { clientX, clientY } = e.targetTouches[0];
    setTouchStart([clientX, clientY]);
  };

  const onTouchMove = (e: TouchEvent) => {
    const { clientX, clientY } = e.targetTouches[0];
    setTouchEnd([clientX, clientY]);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const xDistance = touchStart[0] - touchEnd[0];
    const isLeftSwipe = xDistance > minSwipeDistance;
    const isRightSwipe = xDistance < -minSwipeDistance;

    const isUpSwipe = touchStart[1] - touchEnd[1] > minSwipeDistance;
    const isDownSwipe = touchStart[1] - touchEnd[1] < -minSwipeDistance;

    const isVerticalSwipe = isUpSwipe || isDownSwipe;
    const isHorizontalSwipe = isLeftSwipe || isRightSwipe;

    if (isHorizontalSwipe && isVerticalSwipe) {
      return;
    }

    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    if (isLeftSwipe) {
      if (touchStart[0] < windowWidth / 2) {
        return;
      }
      if (touchStart[1] < windowHeight / 2) {
        input.onSwipedLeft();
      } else {
        input.onSwipedRight();
      }
    }
    if (isRightSwipe) {
      if (touchStart[0] > windowWidth / 2) {
        return;
      }
      if (touchStart[1] < windowHeight / 2) {
        input.onSwipedRight();
      } else {
        input.onSwipedLeft();
      }
    }
    if (isUpSwipe) {
      if (touchStart[0] < windowWidth / 2) {
        input.onSwipedRight();
      } else {
        input.onSwipedLeft();
      }
    }
    if (isDownSwipe) {
      if (touchStart[0] < windowWidth / 2) {
        input.onSwipedLeft();
      } else {
        input.onSwipedRight();
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
