import React, { useEffect, useRef, useState } from 'react';
import autoAnimate from '@formkit/auto-animate';
import './App.css';
import { useSwipe } from './useSwipe';

const debug = false;
const useStorage = true;

const isWin = (tiles: Tiles, reversed?: boolean): boolean => {
  let win = true;
  const digits = tiles.map((tile) => tile.digit);
  digits.forEach((digit, i) => {
    if (digit === 20 && (digits[i + 1] === 1 || i === 19)) return;
    if (digit + 1 !== digits[i + 1] && digits[i + 1]) {
      console.log('not a win', digit, digits[i + 1]);
      win = false;
    }
  });

  if (!win && !reversed) {
    console.log('checking reverse');
    return isWin(tiles.reverse() as Tiles, true);
  }

  return win;
};

function shuffle(array: any[]) {
  if (debug) {
    const [one, two, three, four, ...rest] = array;
    return [four, three, two, one, ...rest];
  }
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

const savedOrderString = window.localStorage.getItem('order');

const initial: number[] =
  useStorage && savedOrderString
    ? JSON.parse(savedOrderString)
    : shuffle(new Array(20).fill(null).map((_, i) => i + 1));

const saveState = (tiles: Tiles) => {
  const sorted = tiles.sort((a, b) => (a.index[0] < b.index[0] ? -1 : 1));
  const digits = sorted.map((tile) => tile.digit);

  window.localStorage.setItem('order', JSON.stringify(digits));
};

type Tile = {
  digit: number;
  index: [number, React.Dispatch<React.SetStateAction<number>>];
};

/** A tuple representing exactly 20 Tiles */
type Tiles = [
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile,
  Tile
];

const moveLeft = (tiles: Tiles) => {
  tiles.forEach((tile) => {
    const [index, setIndex] = tile.index;
    requestAnimationFrame(() => {
      setIndex(index === 1 ? 20 : index - 1);
    });
  });
  return false;
};

const moveRight = (tiles: Tiles) => {
  tiles.forEach((tile) => {
    const [index, setIndex] = tile.index;
    setIndex(index === 20 ? 1 : index + 1);
  });
  return false;
};

const swapTiles = (tiles: Tiles) => {
  const nine = tiles.find((tile) => tile.index[0] === 9)!;
  nine.index[1](12);

  const ten = tiles.find((tile) => tile.index[0] === 10)!;
  ten.index[1](11);

  const eleven = tiles.find((tile) => tile.index[0] === 11)!;
  eleven.index[1](10);

  const twelve = tiles.find((tile) => tile.index[0] === 12)!;
  twelve.index[1](9);
  return false;
};

const reset = () => {
  window.localStorage.removeItem('order');
  window.location.reload();
};

const Board = () => {
  const parent = useRef<null | HTMLDivElement>(null);

  const [helpVisible, setHelpVisible] = useState(false);
  const toggleHelp = () => {
    setHelpVisible(!helpVisible);
    return false;
  };

  const tiles = shuffle(
    initial.map((digit, i) => ({
      digit,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      index: useState(i + 1),
    }))
  ) as Tiles;

  const swipeHandlers = useSwipe({
    onSwipedLeft: () => moveLeft(tiles),
    onSwipedRight: () => moveRight(tiles),
    onOtherTouch: () => swapTiles(tiles),
  });

  const [didWin, setDidWin] = useState(false);

  useEffect(() => {
    parent.current && autoAnimate(parent.current);
  }, [parent]);

  useEffect(() => {
    saveState(tiles);
    setDidWin(isWin(tiles));
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.code) {
        case 'ArrowLeft':
          moveLeft(tiles);
          break;
        case 'ArrowRight':
          moveRight(tiles);
          break;
        case 'Space':
          swapTiles(tiles);
          break;
        default:
          return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Don't forget to clean up
    return function cleanup() {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tiles, ...tiles.map((tile) => tile.index[0])]);

  return (
    <div {...swipeHandlers} className="board" ref={parent}>
      <h3>{didWin ? '🎉' : 'Sort the numbers.'}</h3>
      <div className="swapper" onClick={() => swapTiles(tiles)}></div>
      <div className="tiles">
        {tiles.map((tile) => (
          <div key={tile.digit} className={`tile tile-${tile.index[0]}`}>
            {tile.digit}
          </div>
        ))}
      </div>
      <div className="controls">
        <button onClick={() => moveLeft(tiles)}>↪️</button>
        <button onClick={() => swapTiles(tiles)}>🔄</button>
        <button onClick={() => moveRight(tiles)}>↩️</button>
      </div>
      <div className={`info ${helpVisible ? 'open' : 'closed'}`}>
        <div>
          <div>
            This game is based on TopSpin, the physical puzzle game by Binary
            Arts
          </div>
          <div>Controls:</div>
          <table>
            <thead>
              <th>Input method</th>
              <th>rotate counterclockwise</th>
              <th>swap highlighted</th>
              <th>rotate clockwise</th>
            </thead>
            <tr>
              <th>Keyboard</th>
              <td>Left</td>
              <td>Space</td>
              <td>Right</td>
            </tr>
            <tr>
              <th>Touch</th>
              <td>Swipe</td>
              <td>Tap</td>
              <td>Swipe</td>
            </tr>
            <tr>
              <th>Buttons</th>
              <td>↪️</td>
              <td>🔄</td>
              <td>↩️</td>
            </tr>
          </table>
        </div>
      </div>
      <div className="global-controls">
        <button onClick={toggleHelp}>{helpVisible ? '❌' : '🤨'}</button>
        <button onClick={reset}>🔀</button>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Board />
    </div>
  );
}

export default App;
